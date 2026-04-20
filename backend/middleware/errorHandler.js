const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Request error', { 
    type: err.type,
    message: err.message,
    code: err.code,
    stack: err.stack
  });

  if (err.type === 'StripeInvalidRequestError') {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  if (err.type === 'StripeAPIError') {
    return res.status(500).json({
      success: false,
      error: 'Stripe service error',
      message: err.message,
    });
  }

  if (err.type === 'StripeAuthenticationError') {
    logger.error('Stripe authentication failed', { error: err.message });
    return res.status(401).json({
      success: false,
      error: 'Stripe authentication failed',
    });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: err.message,
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected error occurred',
  });
}

module.exports = {
  errorHandler,
};
