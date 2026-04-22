let stripe;
let elements;
let cardElement;

const form = document.getElementById('payment-form');
const amountInput = document.getElementById('amount');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const addressInput = document.getElementById('address');
const cityInput = document.getElementById('city');
const stateInput = document.getElementById('state');
const zipInput = document.getElementById('zip');
const countryInput = document.getElementById('country');
const descriptionInput = document.getElementById('description');
const submitBtn = document.getElementById('submit-btn');
const cardErrors = document.getElementById('card-errors');
const paymentMessage = document.getElementById('payment-message');
const processingStatus = document.getElementById('processing-status');
const statusIndicator = document.getElementById('status-indicator');
const buttonText = document.getElementById('button-text');
const spinner = document.getElementById('spinner');

const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';

function initializeStripe() {
  const stripeKey = window.STRIPE_PUBLISHABLE_KEY;
  
  if (!stripeKey) {
    console.error('Stripe key not configured');
    submitBtn.disabled = true;
    return;
  }
  
  try {
    stripe = Stripe(stripeKey);
    elements = stripe.elements();
    
    cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '14px',
          color: '#111827',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", sans-serif',
          '::placeholder': {
            color: '#9ca3af',
          },
        },
        invalid: {
          color: '#ef4444',
        },
      },
    });

    cardElement.mount('#card-element');

    cardElement.on('change', (event) => {
      const displayError = document.getElementById('card-errors');
      if (event.error) {
        displayError.textContent = event.error.message;
        displayError.classList.add('show');
      } else {
        displayError.textContent = '';
        displayError.classList.remove('show');
      }
    });
    
  } catch (error) {
    console.error('Stripe init failed:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initializeStripe, 500);
});

async function createPaymentIntent(amount, description, metadata = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/payment/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100),
        currency: 'usd',
        description,
        metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Create PaymentIntent Error:', error);
    throw error;
  }
}

async function confirmPaymentWithStripe(clientSecret, paymentMethod) {
  try {
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod,
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    return result;
  } catch (error) {
    console.error('Confirm Payment Error:', error);
    throw error;
  }
}

function validateForm() {
  const errors = [];

  if (!amountInput.value || parseFloat(amountInput.value) < 0.50) {
    errors.push('Amount must be at least $0.50');
  }

  if (!nameInput.value.trim()) {
    errors.push('Full name is required');
  }

  if (!emailInput.value.trim() || !isValidEmail(emailInput.value)) {
    errors.push('Valid email is required');
  }

  if (!addressInput.value.trim()) {
    errors.push('Address is required');
  }

  if (!cityInput.value.trim()) {
    errors.push('City is required');
  }

  if (!stateInput.value.trim()) {
    errors.push('State/Province is required');
  }

  if (!zipInput.value.trim()) {
    errors.push('Zip/Postal code is required');
  }

  if (!countryInput.value.trim()) {
    errors.push('Country is required');
  }

  return errors;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(message) {
  paymentMessage.textContent = message;
  paymentMessage.classList.remove('hidden', 'success');
  paymentMessage.classList.add('show', 'error');
}

function showSuccess(message) {
  paymentMessage.textContent = message;
  paymentMessage.classList.remove('hidden', 'error');
  paymentMessage.classList.add('show', 'success');
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  if (isLoading) {
    buttonText.classList.add('hidden');
    spinner.classList.remove('hidden');
    processingStatus.classList.remove('hidden');
  } else {
    buttonText.classList.remove('hidden');
    spinner.classList.add('hidden');
    processingStatus.classList.add('hidden');
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const validationErrors = validateForm();
  if (validationErrors.length > 0) {
    showError(validationErrors.join('\n'));
    return;
  }

  if (!cardElement) {
    console.error('Card element not initialized');
    showError('Card element not ready. Please refresh the page.');
    return;
  }

  if (!stripe) {
    console.error('Stripe not initialized');
    showError('Stripe not initialized. Please refresh the page.');
    return;
  }

  try {
    setLoading(true);
    paymentMessage.classList.add('hidden');

    const amount = parseFloat(amountInput.value);
    const description = descriptionInput.value || `Payment from ${nameInput.value}`;

    const intentResponse = await createPaymentIntent(amount, description, {
      customer_name: nameInput.value,
      customer_email: emailInput.value,
    });

    if (!intentResponse.success) {
      throw new Error(intentResponse.error || 'Failed to create payment intent');
    }

    const { clientSecret, intentId } = intentResponse;

    const { paymentMethod, error: paymentMethodError } =
      await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: nameInput.value,
          email: emailInput.value,
          address: {
            line1: addressInput.value,
            city: cityInput.value,
            state: stateInput.value,
            postal_code: zipInput.value,
            country: countryInput.value,
          },
        },
      });

    if (paymentMethodError) {
      throw new Error(paymentMethodError.message);
    }

    const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: paymentMethod.id,
      }
    );

    if (confirmError) {
      throw new Error(confirmError.message);
    }

    if (paymentIntent.status === 'succeeded') {
      showSuccess(`✓ Payment successful! Transaction ID: ${paymentIntent.id}`);
      form.reset();
      cardElement.clear();
    } else if (paymentIntent.status === 'requires_action') {
      showError('Payment requires additional authentication. Please complete the verification.');
    } else {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }
  } catch (error) {
    console.error('Payment Error:', error);
    showError(`✗ Payment failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
});

amountInput.addEventListener('blur', () => {
  if (amountInput.value) {
    const value = parseFloat(amountInput.value);
    if (!isNaN(value)) {
      amountInput.value = value.toFixed(2);
    }
  }
});
