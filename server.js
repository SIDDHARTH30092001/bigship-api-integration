const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Bigship API URLs
const loginUrl = 'https://api.bigship.in/api/login/user';
const trackingUrl = 'https://api.bigship.in/api/tracking';

// Production Credentials (You should move these to environment variables later)
const credentials = {
  user_name: '8318023338',
  password: 'Kajala@2919',
  access_key: 'da93cfe1f14e5be6d00ed24de75bfaa7e0d388e9d7758696c5c7996c0fd0f55d'
};

// Format Bigship date into readable string
function formatDate(dateStr) {
  const [day, month, yearAndTime] = dateStr.split('-');
  const [year, time] = yearAndTime.split(' ');
  const date = new Date(`${year}-${month}-${day}T${time}`);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Production route: /api/track?tracking_id=12345
app.get('/api/track', async (req, res) => {
  const trackingId = req.query.tracking_id;
  if (!trackingId) {
    return res.status(400).json({ error: 'Missing tracking_id query param' });
  }

  try {
    // Step 1: Login to Bigship
    const loginResp = await axios.post(loginUrl, credentials, {
      headers: { 'Content-Type': 'application/json' }
    });

    const token = loginResp.data?.data?.token;
    if (!token) {
      return res.status(401).json({ error: 'Failed to get token from Bigship' });
    }

    // Step 2: Fetch tracking data
    const trackResp = await axios.get(trackingUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        tracking_type: 'awb',
        tracking_id: trackingId
      }
    });

    const order = trackResp.data?.data?.order_detail;
    const scans = trackResp.data?.data?.scan_histories || [];

    if (!order) {
      return res.status(404).json({ error: 'No order found for this AWB' });
    }

    // Define known Bigship statuses for frontend progress
    const stages = ['Order Placed', 'In-Transit', 'Out for Delivery', 'Delivered'];
    const scanStatuses = scans.map(scan => scan.scan_status);

    const progress = stages.map(stage => ({
      status: stage,
      reached: stage === 'Order Placed' || scanStatuses.includes(stage)
    }));

    // Final API response
    return res.json({
      courier: order.courier_name,
      tracking_id: order.tracking_id,
      order_id: order.invoice_id,
      last_update: `${order.current_tracking_status} on ${formatDate(order.current_tracking_datetime)}`,
      order_date: formatDate(order.order_manifest_datetime),
      progress,
      scan_history: scans
    });

  } catch (error) {
    console.error('❌ Server error:', error?.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to fetch tracking data',
      details: error?.response?.data || error.message
    });
  }
});

// Fallback 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Bigship Tracker API running on port ${PORT}`);
});
