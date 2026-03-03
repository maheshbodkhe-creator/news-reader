# Vercel Deployment Guide

This project is now configured for deployment on Vercel. The setup includes both frontend and backend serverless functions.

## Prerequisites

1. A Vercel account (create one at https://vercel.com)
2. The Vercel CLI installed: `npm install -g vercel`
3. A TheNewsAPI token (get one at https://www.thenewsapi.com/)

## Project Structure for Vercel

```
news-reader/
├── api/                    # Serverless API functions
│   ├── news.js            # News API endpoint handler
│   └── health.js          # Health check endpoint
├── web/                   # React/Vite frontend
│   ├── src/
│   ├── dist/              # Built output (generated during build)
│   └── package.json
├── vercel.json            # Vercel configuration
└── package.json           # Root package.json
```

## Deployment Steps

### 1. Push to Git Repository

First, initialize a git repository if you haven't already:

```bash
cd /home/mahesh/code/news-reader
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/news-reader.git
git push -u origin main
```

### 2. Connect to Vercel

Option A: Using the Web Dashboard
- Go to https://vercel.com/dashboard
- Click "New Project"
- Select "Import Git Repository"
- Copy your repository URL and import it
- Vercel will auto-detect the configuration

Option B: Using Vercel CLI
```bash
vercel
```

### 3. Set Environment Variables

In the Vercel dashboard:

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add a new variable:
   - **Name:** `THENEWSAPI_TOKEN`
   - **Value:** Your actual API token from TheNewsAPI
   - **Environments:** Select all (Production, Preview, Development)

4. Click "Save"

### 4. Deploy

The project will automatically deploy when you push changes to your git repository. 

To manually deploy:
```bash
vercel --prod
```

### 5. Verify Deployment

After deployment, verify everything is working:

1. **Frontend**: Visit your Vercel domain (e.g., `https://news-reader.vercel.app`)
2. **API Health Check**: Visit `https://news-reader.vercel.app/api/health`
3. **API News Endpoint**: Visit `https://news-reader.vercel.app/api/news/all?page=1&categories=tech`

## How It Works on Vercel

### Frontend Build
- The `web/` directory is built using `npm run build` (vite outputs to `web/dist`)
- The output is automatically served as static files

### Backend (API Routes)
- The `api/` directory contains serverless functions
- `/api/news/all` → handled by `api/news.js`
- `/api/health` → handled by `api/health.js`
- Each request is handled by a serverless function instance

### Routing (vercel.json)
- API requests to `/api/news/all` are routed to the serverless function
- API requests to `/api/health` are routed to the health check function
- Static files are served from `web/dist/`
- All other routes fall back to `web/dist/index.html` for SPA routing

## Environment Configuration

### Local Development

For local development, keep using the existing setup:
```bash
npm run dev
```

The Vite proxy in `web/vite.config.ts` will handle routing to the local backend at `localhost:5177`.

### Production (Vercel)

In production, the frontend automatically uses relative API paths (`/api/...`) which are routed to the serverless functions thanks to `vercel.json`.

## Rate Limits & Quotas

Your API token has rate limits based on your TheNewsAPI plan. When limits are reached:
- You'll see a **402 (Payment Required)** error
- The error message will display on the frontend
- Limited to 50 requests per minute and daily request limits based on your plan

## Troubleshooting

### API requests return 402 (Payment Required)
- Check your TheNewsAPI usage at https://www.thenewsapi.com/
- You may need to upgrade your plan or wait for the daily quota to reset

### Deployment fails during build
- Check the Vercel build logs: `vercel logs`
- Ensure `web/dist` can be built locally: `cd web && npm run build`
- Verify all dependencies are listed in `package.json` files

### Frontend can't reach API
- Verify the `THENEWSAPI_TOKEN` environment variable is set in Vercel dashboard
- Check that `api/news.js` is correctly implemented
- Test the API directly: `curl https://your-domain.vercel.app/api/health`

### CORS errors
- The API functions include CORS headers set to `*` (allow all origins)
- This is fine for development but you may want to restrict in production

## Configuration Files

### `vercel.json`
Configures builds, environment variables, and routing for Vercel.

### `web/vite.config.ts` (Local Dev)
Proxies `/api` requests to `localhost:5177` during development.

### `api/news.js` (Production)
Serverless function that proxies requests to TheNewsAPI with proper error handling.

## Additional Commands

```bash
# View deployment logs
vercel logs

# Rollback to previous deployment
vercel rollback

# List deployments
vercel ls

# Set environment variables via CLI
vercel env add THENEWSAPI_TOKEN
```

## Next Steps

- Monitor API usage at https://www.thenewsapi.com/
- Consider caching strategies to reduce API calls
- Set up domain name in Vercel project settings
- Enable automatic deployments on git push
- Set up monitoring/alerts for API errors
