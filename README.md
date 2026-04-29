# Stripe Payment Module

Stripe payment integration. Node.js backend + vanilla JS frontend.


## Structure

```
backend/
├── server.js
├── routes/
│   ├── payment.js
│   └── webhooks.js
├── middleware/
│   ├── errorHandler.js
│   └── validators.js
└── utils/
    └── logger.js

frontend/
├── index.html
├── payment-form.js
├── styles.css
└── config.js
```


## Config

Create `backend/.env` with your Stripe keys:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:3000
```

Set `STRIPE_PUBLISHABLE_KEY` in `frontend/config.js` or override globally:
```javascript
window.STRIPE_PUBLISHABLE_KEY = 'pk_test_...';
```

Get keys from https://dashboard.stripe.com/apikeys

## Setup

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm start
```

### Frontend
```bash
cd frontend
python -m http.server 3000
```

Open `http://localhost:3000`
