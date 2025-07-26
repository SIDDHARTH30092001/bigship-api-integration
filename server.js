import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.BIGSHIP_TOKEN;

app.get('/api/track', async (req, res) => {
  const { tracking_type, tracking_id } = req.query;
  if (!tracking_type || !tracking_id) {
    return res.status(400).json({ error: 'Use query ?tracking_type=awb|lrn & tracking_id=...' });
  }
  const url = `https://api.bigship.in/api/tracking?tracking_type=${tracking_type}&tracking_id=${tracking_id}`;
  try {
    const resp = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${TOKEN}`,
      },
    });
    const data = await resp.json();
    if (!resp.ok) return res.status(resp.status).json({ error: data });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => console.log(`Server listening at port ${PORT}`));
