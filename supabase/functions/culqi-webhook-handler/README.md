# Culqi Webhook Handler Edge Function

This Edge Function handles webhook events from Culqi to update payment statuses in real-time.

## Overview

The `culqi-webhook-handler` function:

1. Receives webhook events from Culqi
2. Verifies webhook signatures (if configured)
3. Updates payment statuses based on event types
4. Logs webhook events for audit purposes
5. Handles charge success, failure, and refund events

## Environment Variables Required

Set these secrets in your Supabase project:

```bash
# Optional: Culqi webhook secret for signature verification
supabase secrets set CULQI_WEBHOOK_SECRET your_webhook_secret_here

# Standard Supabase environment variables (automatically available)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Webhook Configuration

Configure this endpoint in your Culqi dashboard:

**Webhook URL:** `https://your-project.supabase.co/functions/v1/culqi-webhook-handler`

**Events to subscribe to:**

- `charge.succeeded` - Payment successful
- `charge.failed` - Payment failed
- `charge.refunded` - Payment refunded

## Supported Event Types

### charge.succeeded

- Updates payment status to `succeeded`
- Triggers job payment status update to `paid`
- Logs successful payment attempt

### charge.failed

- Updates payment status to `failed`
- Triggers job payment status update to `failed`
- Logs failed payment attempt with error details

### charge.refunded

- Updates payment status to `refunded`
- Resets job payment status to `unpaid`
- Logs refund event

## Request Format

Culqi sends webhook events in this format:

```json
{
  "id": "evt_test_xxxxxxxxxx",
  "object": "event",
  "type": "charge.succeeded",
  "creation_date": 1640995200,
  "data": {
    "id": "chr_test_xxxxxxxxxx",
    "object": "charge",
    "amount": 10050,
    "currency_code": "PEN",
    "email": "user@example.com",
    "outcome": {
      "type": "venta_exitosa",
      "code": "AUT0000",
      "merchant_message": "La operación de venta ha sido autorizada exitosamente",
      "user_message": "Su compra ha sido exitosa."
    },
    "source": {
      "id": "src_test_xxxxxxxxxx",
      "type": "card",
      "brand": "Visa",
      "last_four": "1111"
    },
    "creation_date": 1640995200
  }
}
```

## Response Format

**Success Response (200):**

```json
{
  "received": true
}
```

**Error Response (401/500):**

```json
{
  "error": "Invalid signature",
  "message": "Webhook signature verification failed"
}
```

## Security Features

- **Signature Verification**: Validates webhook authenticity (if secret configured)
- **Service Role Access**: Uses service role for secure database operations
- **Event Logging**: Records all webhook events for audit trail
- **Error Handling**: Graceful handling of malformed or invalid webhooks

## Database Operations

For each webhook event, the function:

1. **Finds payment record** by Culqi charge ID
2. **Updates payment status** in `payments` table
3. **Updates job payment status** via database trigger
4. **Logs webhook event** in `payment_attempts` table

## Error Handling

The function handles various scenarios:

- Invalid webhook signatures
- Missing or malformed webhook data
- Payment records not found
- Database operation failures
- Unknown event types (logged but ignored)

## Testing

To test the webhook handler:

```bash
# Start Supabase locally
supabase start

# Deploy the function
supabase functions deploy culqi-webhook-handler

# Test with curl (simulate Culqi webhook)
curl -X POST 'http://localhost:54321/functions/v1/culqi-webhook-handler' \
  -H 'Content-Type: application/json' \
  -H 'x-culqi-signature: test-signature' \
  -d '{
    "id": "evt_test_123",
    "object": "event",
    "type": "charge.succeeded",
    "creation_date": 1640995200,
    "data": {
      "id": "chr_test_123",
      "object": "charge",
      "amount": 10050,
      "currency_code": "PEN",
      "outcome": {
        "type": "venta_exitosa",
        "code": "AUT0000",
        "user_message": "Su compra ha sido exitosa."
      }
    }
  }'
```

## Monitoring

Monitor webhook processing through:

- Supabase function logs
- `payment_attempts` table records
- Payment status changes in `payments` table
- Job payment status updates in `job_postings` table

## Integration Notes

- Configure webhook URL in Culqi dashboard after deployment
- Ensure payment records exist before webhook events arrive
- Set up monitoring for failed webhook processing
- Consider implementing retry logic for failed database operations
- Test webhook handling in staging environment before production

## Troubleshooting

Common issues and solutions:

1. **Payment not found**: Ensure `process-payment` function creates payment records before webhooks arrive
2. **Signature verification fails**: Check `CULQI_WEBHOOK_SECRET` configuration
3. **Database errors**: Verify RLS policies allow service role access
4. **Webhook not received**: Check Culqi dashboard webhook configuration and URL
