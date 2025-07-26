import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();

// ✅ Enable CORS for all origins (can restrict later if needed)
app.use(cors({
  origin: '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const PORT = process.env.PORT || 3000;

// ✅ Hardcoded Bigship token for testing (Replace with actual one)
const TOKEN = 'da93cfe1f14e5be6d00ed24de75bfaa7e0d388e9d7758696c5c7996c0fd0f55d';

// ✅ Root route (optional for health check)
app.get('/', (req, res) => {
  res.send('Bigship Tracker API is up and running.');
});

// ✅ Tracking route
app.get('/api/track', async (req, res) => {
  const { tracking_type, tracking_id } = req.query;

  if (!tracking_type || !tracking_id) {
    return res.status(400).json({ error: 'Use ?tracking_type=awb|lrn&tracking_id=...' });
  }

  const url = `https://api.bigship.in/api/tracking?tracking_type=${tracking_type}&tracking_id=${tracking_id}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// ✅ Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
