// api/health.js - Vercel serverless health check function

export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}
