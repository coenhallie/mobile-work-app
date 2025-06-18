# Process Payment Edge Function

This Edge Function handles payment processing using the Culqi payment gateway for job postings.

## Overview

The `process-payment` function:

1. Validates payment requests
2. Creates payment records in the database
3. Processes payments through Culqi API
4. Updates payment and job status based on results
5. Logs all payment attempts for audit purposes

## Environment Variables Required

Set these secrets in your Supabase project:

```bash
# Culqi secret key for API authentication
supabase secrets set CULQI_SECRET_KEY your_culqi_secret_key_here

# Standard Supabase environment variables (automatically available)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

## Request Format

**Endpoint:** `POST /functions/v1/process-payment`

**Headers:**

- `Content-Type: application/json`
- `Authorization: Bearer <supabase_anon_key>` (optional, for user context)

**Request Body:**

```json
{
  "culqiToken": "tkn_test_xxxxxxxxxx",
  "jobId": "uuid-of-job-posting",
  "amount": 100.5
}
```

## Response Format

**Success Response (200):**

```json
{
  "success": true,
  "message": "Payment processed successfully",
  "payment": {
    "id": "payment-uuid",
    "culqi_charge_id": "chr_test_xxxxxxxxxx",
    "amount": 100.5,
    "status": "succeeded"
  }
}
```

**Error Response (400/500):**

```json
{
  "error": "Payment failed",
  "message": "Detailed error message",
  "details": {
    // Culqi API response details
  }
}
```

## Database Operations

The function performs the following database operations:

1. **Validates job existence** and ownership
2. **Creates payment record** in `payments` table
3. **Logs payment attempt** in `payment_attempts` table
4. **Updates payment status** based on Culqi response
5. **Updates job payment status** via database trigger

## Error Handling

The function handles various error scenarios:

- Missing or invalid request parameters
- Job not found or already paid
- User not found
- Culqi API errors
- Database operation failures

## Security Features

- Validates job ownership before processing payment
- Uses service role for database operations
- Logs all payment attempts for audit trail
- Handles sensitive payment data securely

## Testing

To test the function locally:

```bash
# Start Supabase locally
supabase start

# Deploy the function
supabase functions deploy process-payment

# Test with curl
curl -X POST 'http://localhost:54321/functions/v1/process-payment' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -d '{
    "culqiToken": "tkn_test_xxxxxxxxxx",
    "jobId": "your-job-uuid",
    "amount": 100.50
  }'
```

## Integration Notes

- Ensure the `payments` and `payment_attempts` tables exist before deployment
- Configure Culqi webhook handler for real-time status updates
- Set up proper RLS policies for payment data access
- Monitor function logs for payment processing issues
