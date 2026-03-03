// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5177;
const API_TOKEN = process.env.THENEWSAPI_TOKEN;
const API_BASE_URL = 'https://api.thenewsapi.com';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// News proxy endpoint
app.get('/api/news/all', async (req, res) => {
  try {
    // Validate token
    if (!API_TOKEN) {
      return res.status(500).json({
        error: 'TheNewsApi authentication failed',
        message: 'API token not configured on server'
      });
    }

    // Extract and validate query params
    const { page, limit, search, categories, language, published_after } = req.query;

    if (!page) {
      return res.status(400).json({ error: 'page parameter is required' });
    }

    // Build URL with required params
    const url = new URL(`${API_BASE_URL}/v1/news/all`);
    url.searchParams.append('api_token', API_TOKEN);
    url.searchParams.append('language', language || 'en');
    url.searchParams.append('limit', limit || '3');
    url.searchParams.append('page', page);

    // Add search or categories (mutually exclusive)
    if (search && search.trim()) {
      url.searchParams.append('search', search.trim());
    } else if (categories && categories.trim()) {
      url.searchParams.append('categories', categories.trim());
    }

    // Add date filter if provided
    if (published_after && published_after.trim()) {
      url.searchParams.append('published_after', published_after.trim());
    }

    // Log proxied request (no token)
    console.log(`[${new Date().toISOString()}] GET ${url.pathname}?${url.searchParams.toString().replace(/api_token=[^&]*/, 'api_token=***')}`);

    // Fetch from TheNewsApi
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'news-reader-proxy/1.0'
      },
      timeout: 10000
    });

    const data = await response.json();

    // Handle API errors
    if (!response.ok) {
      const statusCode = response.status;
      const errorBody = data.error || data;
      const errorMessage = typeof errorBody === 'object' 
        ? (errorBody.message || errorBody.error || JSON.stringify(errorBody))
        : errorBody;
      
      if (statusCode === 429) {
        return res.status(429).json({
          error: 'Daily request limit reached. Please try again tomorrow.',
          statusCode
        });
      }
      if (statusCode === 401 || statusCode === 403) {
        return res.status(statusCode).json({
          error: 'TheNewsApi authentication failed',
          statusCode
        });
      }
      if (statusCode === 402) {
        return res.status(402).json({
          error: 'Usage limit reached for your API plan. Please upgrade or wait until tomorrow.',
          statusCode
        });
      }
      return res.status(statusCode).json({
        error: errorMessage || 'An error occurred while fetching news',
        statusCode
      });
    }

    // Transform API response to match NewsArticle interface
    const transformedData = {
      ...data,
      data: data.data.map((article) => ({
        uuid: article.uuid,
        title: article.title,
        description: article.description || article.snippet || '',
        image_url: article.image_url,
        link: article.url, // Map 'url' to 'link'
        source: article.source,
        category: Array.isArray(article.categories) ? article.categories[0] : 'general', // First category or default
        language: article.language,
        published_at: article.published_at
      }))
    };

    // Success response
    res.json(transformedData);
  } catch (error) {
    console.error('[ERROR]', error.message);

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Unable to connect to TheNewsApi. Please try again later.'
      });
    }

    res.status(500).json({
      error: 'An error occurred while fetching news',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] News Reader Proxy Server running on port ${PORT}`);
  console.log(`API token configured: ${API_TOKEN ? 'yes' : 'NO - endpoints will fail'}`);
});
