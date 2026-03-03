# News Reader Proxy Server

Express.js proxy for TheNewsApi that securely hides API tokens from the browser.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your TheNewsApi token to `.env`:
   ```
   THENEWSAPI_TOKEN=your_actual_token
   ```

3. Install dependencies (from project root):
   ```bash
   npm run server:install
   ```

## Development

Run the server:
```bash
npm run server:dev
```

Server runs on `http://localhost:5177`

## Endpoints

### Health Check
```
GET /api/health
```

### News Proxy
```
GET /api/news/all?page=1&limit=3&categories=tech&language=en
```

Query parameters:
- `page` (required): Page number
- `limit` (optional, default: 3): Items per page
- `language` (optional, default: en): Language code
- `categories` (optional): Comma-separated categories
- `search` (optional): Search term (mutually exclusive with categories)

## Security

- API token is **never** logged or exposed
- Token stored in `.env` (not committed to git)
- All requests must go through this proxy
- CORS enabled for local development
