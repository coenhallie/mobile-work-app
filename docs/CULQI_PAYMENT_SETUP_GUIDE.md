# Culqi Payment System Setup Guide

This guide covers the complete setup of the Culqi payment integration for the mobile work app.

## Overview

The Culqi payment system consists of:

- Database schema for payments and payment attempts
- Edge Functions for payment processing and webhook handling
- Row Level Security (RLS) policies for data protection
- Frontend integration points

## Prerequisites

1. **Culqi Account**: Sign up at [culqi.com](https://culqi.com)
2. **Supabase Project**: Ensure your Supabase project is set up
3. **API Keys**: Obtain Culqi test/production API keys

## 1. Database Setup

### Apply Migrations

Run the following migrations in order:

```bash
# Create payment tables and basic RLS policies
supabase db push --file supabase/migrations/20250108000000_create_payments_system.sql

# Apply additional RLS policies
supabase db push --file supabase/migrations/20250108000001_payments_rls_policies.sql
```

### Verify Tables

After migration, verify these tables exist:

- `payments` - Stores payment transactions
- `payment_attempts` - Logs all payment attempts
- `job_postings` - Updated with `payment_status` column

## 2. Environment Variables

Set the required secrets in your Supabase project:

```bash
# Required: Culqi secret key for API calls
supabase secrets set CULQI_SECRET_KEY sk_test_your_secret_key_here

# Optional: Webhook signature verification
supabase secrets set CULQI_WEBHOOK_SECRET your_webhook_secret_here
```

For production, replace `sk_test_` with your production secret key `sk_live_`.

## 3. Deploy Edge Functions

Deploy both Edge Functions:

```bash
# Deploy payment processing function
supabase functions deploy process-payment

# Deploy webhook handler
supabase functions deploy culqi-webhook-handler
```

### Function URLs

After deployment, your functions will be available at:

- `https://your-project.supabase.co/functions/v1/process-payment`
- `https://your-project.supabase.co/functions/v1/culqi-webhook-handler`

## 4. Culqi Dashboard Configuration

### API Keys

1. Log into your Culqi dashboard
2. Navigate to **Developers > API Keys**
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
4. Copy your **Public Key** (starts with `pk_test_` or `pk_live_`)

### Webhook Configuration

1. Go to **Developers > Webhooks**
2. Create a new webhook with:
   - **URL**: `https://your-project.supabase.co/functions/v1/culqi-webhook-handler`
   - **Events**: Select these events:
     - `charge.succeeded`
     - `charge.failed`
     - `charge.refunded`
3. Save the webhook secret for signature verification

## 5. Frontend Integration

### Install Culqi SDK

```bash
npm install @culqi/culqi-js
```

### Basic Implementation

```javascript
// Initialize Culqi with your public key
import Culqi from '@culqi/culqi-js';

Culqi.publicKey = 'pk_test_your_public_key_here';

// Create token from card data
const tokenData = {
  card_number: '4111111111111111',
  cvv: '123',
  expiration_month: '09',
  expiration_year: '2025',
  email: 'user@example.com',
};

Culqi.createToken(tokenData, (token) => {
  if (token.id) {
    // Send token to your backend
    processPayment(token.id, jobId, amount);
  } else {
    console.error('Token creation failed:', token);
  }
});

// Process payment via your Edge Function
async function processPayment(culqiToken, jobId, amount) {
  const response = await fetch('/functions/v1/process-payment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      culqiToken,
      jobId,
      amount,
    }),
  });

  const result = await response.json();

  if (result.success) {
    console.log('Payment successful:', result.payment);
    // Redirect to success page
  } else {
    console.error('Payment failed:', result.error);
    // Show error message
  }
}
```

## 6. Testing

### Test Cards

Use these test cards in development:

| Card Number      | Brand      | Result   |
| ---------------- | ---------- | -------- |
| 4111111111111111 | Visa       | Success  |
| 4000000000000002 | Visa       | Declined |
| 5555555555554444 | Mastercard | Success  |

### Test Flow

1. **Create a job posting** in your app
2. **Generate a Culqi token** using test card data
3. **Call process-payment** Edge Function with the token
4. **Verify payment record** is created in database
5. **Check webhook handling** by triggering test events

### Monitoring

Monitor payments through:

- Supabase dashboard (payments table)
- Culqi dashboard (transactions)
- Edge Function logs
- Webhook delivery logs

## 7. Security Considerations

### API Key Security

- **Never expose secret keys** in frontend code
- **Use environment variables** for all sensitive data
- **Rotate keys regularly** in production
- **Use test keys** only in development

### Database Security

- **RLS policies** restrict payment data access
- **Service role** used for Edge Function operations
- **Audit trail** maintained in payment_attempts table

### Webhook Security

- **Signature verification** prevents fake webhooks
- **HTTPS only** for webhook endpoints
- **Idempotency** handling for duplicate events

## 8. Production Deployment

### Checklist

- [ ] Replace test API keys with production keys
- [ ] Update webhook URLs to production endpoints
- [ ] Test payment flow end-to-end
- [ ] Set up monitoring and alerting
- [ ] Configure backup and recovery procedures
- [ ] Review security settings

### Environment Variables

```bash
# Production secrets
supabase secrets set CULQI_SECRET_KEY sk_live_your_production_key
supabase secrets set CULQI_WEBHOOK_SECRET your_production_webhook_secret
```

## 9. Troubleshooting

### Common Issues

**Payment fails with "Invalid token"**

- Check if Culqi public key is correct
- Verify token creation parameters
- Ensure token hasn't expired

**Webhook not received**

- Verify webhook URL in Culqi dashboard
- Check Edge Function deployment status
- Review function logs for errors

**Database permission errors**

- Verify RLS policies are correctly applied
- Check service role permissions
- Ensure user authentication is working

**Payment status not updating**

- Check if database triggers are working
- Verify webhook handler is processing events
- Review payment_attempts table for errors

### Debug Commands

```bash
# Check function logs
supabase functions logs process-payment

# Check webhook logs
supabase functions logs culqi-webhook-handler

# Query payment records
supabase db query "SELECT * FROM payments ORDER BY created_at DESC LIMIT 10"

# Check payment attempts
supabase db query "SELECT * FROM payment_attempts ORDER BY created_at DESC LIMIT 10"
```

## 10. Support

For additional help:

- **Culqi Documentation**: [docs.culqi.com](https://docs.culqi.com)
- **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
- **Edge Functions Guide**: [supabase.com/docs/guides/functions](https://supabase.com/docs/guides/functions)

## Next Steps

After completing this setup:

1. Implement frontend payment UI components
2. Add payment status tracking for users
3. Set up email notifications for payment events
4. Implement refund functionality if needed
5. Add payment analytics and reporting
