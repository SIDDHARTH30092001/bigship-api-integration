import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Hardcoded Bigship token (for testing only)
const TOKEN = 'da93cfe1f14e5be6d00ed24de75bfaa7e0d388e9d7758696c5c7996c0fd0f55d';

// ✅ Enable CORS for all domains
app.use(cors());
app.use(express.json());

// ✅ Health check
app.get('/', (req, res) => {
  res.send('✅ Bigship API is working');
});

// ✅ Tracking endpoint
app.get('/api/track', async (req, res) => {
  const { tracking_type, tracking_id } = req.query;

  if (!tracking_type || !tracking_id) {
    return res.status(400).json({ error: 'Missing query: ?tracking_type=awb|lrn&tracking_id=...' });
  }

  const apiUrl = `https://api.bigship.in/api/tracking?tracking_type=${tracking_type}&tracking_id=${tracking_id}`;

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Use the actual response status if valid, else fallback to 500
      const statusCode = response.status >= 100 && response.status < 600 ? response.status : 500;
      return res.status(statusCode).json({ error: data });
    }

    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// ✅ Fallback 404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
