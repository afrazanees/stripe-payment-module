function validatePaymentIntent(req, res, next) {
  const { amount, currency } = req.body;

  if (!amount) {
    return res.status(400).json({
      success: false,
      error: 'Amount is required',
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Amount must be a positive number (in cents)',
    });
  }

  if (amount < 50) {
    return res.status(400).json({
      success: false,
      error: 'Minimum amount is $0.50 (50 cents)',
    });
  }

  if (currency && typeof currency !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Currency must be a string (e.g., "usd", "eur")',
    });
  }

  next();
}

function validatePaymentConfirm(req, res, next) {
  const { paymentIntentId, paymentMethodId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({
      success: false,
      error: 'paymentIntentId is required',
    });
  }

  if (!paymentMethodId) {
    return res.status(400).json({
      success: false,
      error: 'paymentMethodId is required',
    });
  }

  next();
}

module.exports = {
  validatePaymentIntent,
  validatePaymentConfirm,
};
