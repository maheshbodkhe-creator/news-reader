// web/src/lib/newsapi.ts

export interface NewsArticle {
  uuid: string;
  title: string;
  description: string;
  image_url: string | null;
  link: string;
  source: string;
  category: string;
  language: string;
  published_at: string;
}

export interface NewsResponse {
  data: NewsArticle[];
  meta: {
    found: number;
    returned: number;
    limit: number;
    page: number;
  };
}

export interface NewsError {
  error: string;
  message?: string;
  statusCode?: number;
}

class NewsApiClient {
  private baseUrl = '/api';
  private cache: Record<string, NewsResponse> = {};
  private prefetchCache: Record<string, Promise<NewsResponse>> = {};

  /**
   * Get date string for articles published in the last N days
   */
  private getPublishedAfterDate(daysBack: number = 30): string {
    const date = new Date();
    date.setDate(date.getDate() - daysBack);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  /**
   * Generate cache key from request params
   */
  private getCacheKey(page: number, search?: string, categories?: string, publishedAfter?: string): string {
    if (search) {
      return `search:${search}:${publishedAfter || 'any'}:page${page}`;
    }
    return `categories:${categories}:${publishedAfter || 'any'}:page${page}`;
  }

  /**
   * Fetch news with optional caching and prefetching info
   */
  async fetchNews(
    page: number,
    search?: string,
    categories: string = 'tech',
    language: string = 'en',
    publishedAfter?: string
  ): Promise<NewsResponse> {
    const cacheKey = this.getCacheKey(page, search, categories, publishedAfter);

    // Return from cache if available
    if (this.cache[cacheKey]) {
      console.log(`[Cache hit] ${cacheKey}`);
      return this.cache[cacheKey];
    }

    // Return from prefetch if available
    if (cacheKey in this.prefetchCache) {
      console.log(`[Prefetch hit] ${cacheKey}`);
      return this.prefetchCache[cacheKey];
    }

    // Fetch fresh
    const params = new URLSearchParams({
      page: String(page),
      limit: '3',
      language
    });

    // Add date filter for searches to ensure recent results
    if (search && search.trim()) {
      params.append('search', search.trim());
      // When searching, always filter for recent articles (last 30 days)
      const recentDate = publishedAfter || this.getPublishedAfterDate(30);
      params.append('published_after', recentDate);
      console.log(`[Fetch] search=${search} published_after=${recentDate} page=${page}`);
    } else {
      params.append('categories', categories);
      // For categories, optionally filter by date if provided
      if (publishedAfter) {
        params.append('published_after', publishedAfter);
        console.log(`[Fetch] categories=${categories} published_after=${publishedAfter} page=${page}`);
      } else {
        console.log(`[Fetch] categories=${categories} page=${page}`);
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/news/all?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      // Cache successful response
      this.cache[cacheKey] = data;
      return data;
    } catch (error) {
      const err = error as NewsError;
      console.error(`[Error] ${err.error}`);
      throw err;
    }
  }

  /**
   * Prefetch next page
   */
  prefetchNextPage(
    currentPage: number,
    search?: string,
    categories: string = 'tech',
    publishedAfter?: string
  ): void {
    const nextPage = currentPage + 1;
    const cacheKey = this.getCacheKey(nextPage, search, categories, publishedAfter);

    // Don't prefetch if already cached or prefetching
    if (cacheKey in this.cache || cacheKey in this.prefetchCache) {
      return;
    }

    console.log(`[Prefetch scheduled] page=${nextPage}`);
    this.prefetchCache[cacheKey] = this.fetchNews(
      nextPage,
      search,
      categories,
      'en',
      publishedAfter
    ).then((data) => {
      // Move from prefetch to cache when done
      delete this.prefetchCache[cacheKey];
      this.cache[cacheKey] = data;
      console.log(`[Prefetch completed] page=${nextPage}`);
      return data;
    });
  }

  /**
   * Prefetch previous page
   */
  prefetchPrevPage(
    currentPage: number,
    search?: string,
    categories: string = 'tech',
    publishedAfter?: string
  ): void {
    if (currentPage <= 1) return;

    const prevPage = currentPage - 1;
    const cacheKey = this.getCacheKey(prevPage, search, categories, publishedAfter);

    // Don't prefetch if already cached or prefetching
    if (cacheKey in this.cache || cacheKey in this.prefetchCache) {
      return;
    }

    console.log(`[Prefetch scheduled] page=${prevPage}`);
    this.prefetchCache[cacheKey] = this.fetchNews(
      prevPage,
      search,
      categories,
      'en',
      publishedAfter
    ).then((data) => {
      // Move from prefetch to cache when done
      delete this.prefetchCache[cacheKey];
      this.cache[cacheKey] = data;
      console.log(`[Prefetch completed] page=${prevPage}`);
      return data;
    });
  }

  /**
   * Clear cache when search/categories change
   */
  clearCache(): void {
    console.log('[Cache cleared]');
    this.cache = {};
    this.prefetchCache = {};
  }

  /**
   * Check server health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const newsApi = new NewsApiClient();
