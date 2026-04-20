const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const paymentRoutes = require('./routes/payment');
const webhookRoutes = require('./routes/webhooks');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({
    message: 'Stripe Payment Module API',
    version: '1.0.0',
    endpoints: {
      payment: '/api/payment/create-intent',
      webhooks: '/api/webhooks/stripe'
    }
  });
});

app.use('/api/payment', paymentRoutes);
app.use('/api/webhooks', webhookRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Stripe Payment Module server running on port ${PORT}`);
  });
}

module.exports = app;
