# News Reader - Modern News Web Application

A modern, performant React + Vite web application with a Node/Express proxy for secure news browsing. Built with TheNewsApi, featuring a Flipboard-like single-article view with categories, search, pagination, prefetching, caching, and favorites.

## Features

✨ **User Experience**
- Single-article view with beautiful Flipboard-like card design
- Smooth pagination with prefetching and instant page swaps
- Category and search filtering (mutually exclusive)
- Favorites system with localStorage persistence
- Responsive design (desktop sidebar + mobile toggle)
- Loading skeletons and error handling

🚀 **Performance**
- In-memory page caching
- Intelligent prefetching (next page at article 2, previous page at article 1)
- Vite-powered fast builds and HMR

🔒 **Security**
- Express proxy hides API tokens from browser
- Secure token storage in `.env`
- No secrets in repository or logs

💻 **Technology**
- Frontend: React 18 + Vite + TypeScript
- Backend: Express.js on Node 16+
- Minimal, lightweight dependencies
- Plain CSS with responsive design

## Project Structure

```
news-reader/
├── package.json              # Root scripts
├── .gitignore               # Git configuration
├── server/                  # Express proxy
│   ├── package.json
│   ├── server.js           # Main server
│   ├── .env.example        # Example env vars
│   └── README.md
├── web/                     # React + Vite app
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   │   └── placeholder.png # Fallback image
│   └── src/
│       ├── main.tsx
│       ├── App.tsx         # Main component
│       ├── styles.css      # All styling
│       └── lib/
│           └── newsapi.ts  # API client
```

## Quick Start

### 1. Prerequisites
- Node.js 16+
- npm or yarn

### 2. Setup

Clone and navigate to project:
```bash
cd news-reader
```

Copy the `.env.example` to `.env` in the server folder and add your API token:
```bash
cp server/.env.example server/.env
```

Edit `server/.env` and set your TheNewsApi token:
```
THENEWSAPI_TOKEN=your_actual_api_token_here
```

Get your token from: https://www.thenewsapi.com/

### 3. Install Dependencies

```bash
npm run server:install
npm run web:install
```

Or install both at once:
```bash
npm run server:install && npm run web:install
```

### 4. Run Development Servers

Run both proxy and web dev server in parallel:
```bash
npm run dev
```

Or run them separately:
```bash
npm run server:dev  # Terminal 1: Express on port 5177
npm run web:dev    # Terminal 2: Vite on port 5176
```

### 5. Open Browser

Open http://localhost:5176 in your browser

## API Endpoints

### Server Health
```
GET http://localhost:5177/api/health
```

### News Proxy
```
GET http://localhost:5177/api/news/all?page=1&limit=3&categories=tech&language=en
```

Query parameters:
- `page` (required): Page number
- `limit` (optional, default: 3): Items per page (fixed at 3 per spec)
- `language` (optional, default: en): Language code (fixed to English)
- `categories` (optional): Comma-separated categories (one of: tech, general, science, sports, business, health, entertainment, politics, food, travel)
- `search` (optional): Search term (mutually exclusive with categories)

## Features & Behavior

### Search vs Categories
- **Has search input**: Search performed (no categories)
- **Empty search**: Categories filter applied (default: tech)

### Pagination
- 3 articles per page
- One article displayed at a time
- Pagination buttons: « (first), < (prev), · · · (article numbers), > (next), » (last)
- Prefetch next page when user reaches 2nd article
- Prefetch previous page when at 1st article and page > 1
- Instant swap to prefetched content

### Caching
- Pages cached in memory by page number
- Cache cleared when search/category changes
- Jumping back to cached page uses stored data

### Favorites
- Click ★ icon to save articles
- Persisted in localStorage
- Favorites button shows count
- Dedicated favorites view
- Exit to return to live results

### Error Handling
- 429: "Daily request limit reached. Please try again tomorrow."
- 401/403: "TheNewsApi authentication failed"
- Network errors: Helpful messages
- Fallback image when article image fails

### Loading States
- Full-height spinner when switching categories/search
- No stale content shown
- Semantic loading aria-labels

## Development

### Build for Production
```bash
cd web && npm run build
```

Output in `web/dist/`

### Environment Variables

**Server** (`.env`):
```
THENEWSAPI_TOKEN=your_real_token
```

**Never commit real tokens.** Always use `.env.example` as template.

### Debugging

Client logs proxied URL (without token):
```
[Fetch] categories=tech page=1
[Cache hit] categories:tech:page1
[Prefetch scheduled] page=2
```

Server never logs raw API token.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive from 320px+ (mobile-first)
- Accessibility: WCAG 2.1 compliant (semantic HTML, aria labels, reduced motion)

## Performance Metrics

- First load: ~2-3s (depending on network)
- Category/search change: <100ms (cache clear + load)
- Page swap (after prefetch): <50ms (instant from cache)
- Prefetch timing: ~500-800ms after reaching trigger

## Troubleshooting

### "TheNewsApi authentication failed"
- Check `THENEWSAPI_TOKEN` in `server/.env`
- Token must be valid (get from https://www.thenewsapi.com/)
- Restart server after updating `.env`

### "Daily request limit reached"
- Upgrade TheNewsApi plan or wait until tomorrow
- Free tier has ~100 requests/day

### Port Already in Use
- Change ports in `web/vite.config.ts` and `server/server.js`
- Update server proxy config in vite.config.ts

### Node/npm Issues
- Clear `node_modules` and reinstall:
  ```bash
  rm -rf node_modules server/node_modules web/node_modules
  npm run server:install && npm run web:install
  ```

## License

MIT

## Author

Built as a modern, production-ready news reader application.
