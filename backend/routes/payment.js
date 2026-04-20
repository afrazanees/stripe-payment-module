const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { validatePaymentIntent, validatePaymentConfirm } = require('../middleware/validators');

router.post('/create-intent', validatePaymentIntent, async (req, res, next) => {
  try {
    const { amount, currency = 'usd', description, metadata } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      description,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/confirm-intent', validatePaymentConfirm, async (req, res, next) => {
  try {
    const { paymentIntentId, paymentMethodId } = req.body;

    const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
      return_url: `${process.env.FRONTEND_URL}/payment-success`,
    });

    res.status(200).json({
      success: true,
      status: paymentIntent.status,
      intentId: paymentIntent.id,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action || null,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/intent/:intentId', async (req, res, next) => {
  try {
    const { intentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(intentId);

    res.status(200).json({
      success: true,
      status: paymentIntent.status,
      intentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      charges: paymentIntent.charges.data,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/create-payment-method', async (req, res, next) => {
  try {
    const { card, billingDetails } = req.body;

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        token: card.token,
      },
      billing_details: billingDetails,
    });

    res.status(200).json({
      success: true,
      paymentMethodId: paymentMethod.id,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
