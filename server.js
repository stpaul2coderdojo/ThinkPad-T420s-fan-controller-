import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Healthcheck endpoint for Render
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Serve static assets from built Vite distribution
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Render] ThinkPad T420s Antigravity Agent running on http://0.0.0.0:${PORT}`);
});
