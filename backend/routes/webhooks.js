const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const logger = require('../utils/logger');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
router.post('/stripe', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', { message: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      default:
        logger.info('Unhandled event type', { eventType: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing webhook', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
async function handlePaymentIntentSucceeded(paymentIntent) {
  const { id, amount, currency, metadata, charges } = paymentIntent;
  
  logger.info('Payment succeeded', {
    intentId: id,
    amount: amount / 100,
    currency: currency.toUpperCase(),
    metadata,
    chargeId: charges.data[0]?.id
  });
}

async function handlePaymentIntentFailed(paymentIntent) {
  const { id, last_payment_error } = paymentIntent;
  
  logger.warn('Payment failed', {
    intentId: id,
    error: last_payment_error?.message,
    errorCode: last_payment_error?.code
  });
}

async function handleChargeRefunded(charge) {
  const { id, amount, refunded, refunds } = charge;
  
  logger.info('Charge refunded', {
    chargeId: id,
    amountRefunded: refunds.data[0]?.amount / 100,
    totalRefunded: refunded
  });
}

async function handlePaymentIntentCanceled(paymentIntent) {
  const { id, cancellation_reason } = paymentIntent;
  
  logger.info('Payment canceled', {
    intentId: id,
    reason: cancellation_reason
  });
}

module.exports = router;
