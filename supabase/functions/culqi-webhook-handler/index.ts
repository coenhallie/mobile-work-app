import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Culqi webhook secret for signature verification
const CULQI_WEBHOOK_SECRET = Deno.env.get('CULQI_WEBHOOK_SECRET');

interface CulqiWebhookEvent {
  id: string;
  object: string;
  type: string;
  creation_date: number;
  data: {
    id: string;
    object: string;
    amount: number;
    currency_code: string;
    email: string;
    outcome: {
      type: string;
      code: string;
      merchant_message: string;
      user_message: string;
    };
    source: {
      id: string;
      type: string;
      brand: string;
      last_four: string;
    };
    creation_date: number;
    reference_code?: string;
  };
}

// Function to verify webhook signature (if Culqi provides signature verification)
async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Note: This is a placeholder implementation
    // Culqi's actual signature verification method should be implemented here
    // For now, we'll just check if the secret exists
    return !!secret;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    // Get request body as text for signature verification
    const rawBody = await req.text();

    // Verify webhook signature if secret is configured
    if (CULQI_WEBHOOK_SECRET) {
      const signature = req.headers.get('x-culqi-signature') || '';
      const isValidSignature = await verifyWebhookSignature(
        rawBody,
        signature,
        CULQI_WEBHOOK_SECRET
      );

      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }
    }

    // Parse webhook event
    const webhookEvent: CulqiWebhookEvent = JSON.parse(rawBody);

    console.log(
      `Received Culqi webhook: ${webhookEvent.type} for charge ${webhookEvent.data?.id}`
    );

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Handle different webhook event types
    switch (webhookEvent.type) {
      case 'charge.succeeded':
        await handleChargeSucceeded(supabaseClient, webhookEvent);
        break;

      case 'charge.failed':
        await handleChargeFailed(supabaseClient, webhookEvent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(supabaseClient, webhookEvent);
        break;

      default:
        console.log(`Unhandled webhook event type: ${webhookEvent.type}`);
        break;
    }

    // Return success response to Culqi
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function handleChargeSucceeded(
  supabaseClient: any,
  event: CulqiWebhookEvent
) {
  const chargeId = event.data.id;

  console.log(`Processing successful charge: ${chargeId}`);

  // Find the payment record by Culqi charge ID
  const { data: payment, error: paymentError } = await supabaseClient
    .from('payments')
    .select('id, job_id, user_id, status')
    .eq('culqi_charge_id', chargeId)
    .single();

  if (paymentError || !payment) {
    console.error(`Payment not found for charge ID: ${chargeId}`, paymentError);
    return;
  }

  // Update payment status to succeeded if not already
  if (payment.status !== 'succeeded') {
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({ status: 'succeeded' })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment status:', updateError);
    } else {
      console.log(`Payment ${payment.id} marked as succeeded`);
    }
  }

  // Log the webhook event
  await supabaseClient.from('payment_attempts').insert({
    payment_id: payment.id,
    status: 'succeeded',
    culqi_response: event.data,
  });

  console.log(
    `Successfully processed charge.succeeded for payment ${payment.id}`
  );
}

async function handleChargeFailed(
  supabaseClient: any,
  event: CulqiWebhookEvent
) {
  const chargeId = event.data.id;

  console.log(`Processing failed charge: ${chargeId}`);

  // Find the payment record by Culqi charge ID
  const { data: payment, error: paymentError } = await supabaseClient
    .from('payments')
    .select('id, job_id, user_id, status')
    .eq('culqi_charge_id', chargeId)
    .single();

  if (paymentError || !payment) {
    console.error(`Payment not found for charge ID: ${chargeId}`, paymentError);
    return;
  }

  // Update payment status to failed if not already
  if (payment.status !== 'failed') {
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment status:', updateError);
    } else {
      console.log(`Payment ${payment.id} marked as failed`);
    }
  }

  // Log the webhook event
  await supabaseClient.from('payment_attempts').insert({
    payment_id: payment.id,
    status: 'failed',
    error_message: event.data.outcome?.user_message || 'Payment failed',
    culqi_response: event.data,
  });

  console.log(`Successfully processed charge.failed for payment ${payment.id}`);
}

async function handleChargeRefunded(
  supabaseClient: any,
  event: CulqiWebhookEvent
) {
  const chargeId = event.data.id;

  console.log(`Processing refunded charge: ${chargeId}`);

  // Find the payment record by Culqi charge ID
  const { data: payment, error: paymentError } = await supabaseClient
    .from('payments')
    .select('id, job_id, user_id, status')
    .eq('culqi_charge_id', chargeId)
    .single();

  if (paymentError || !payment) {
    console.error(`Payment not found for charge ID: ${chargeId}`, paymentError);
    return;
  }

  // Update payment status to refunded
  const { error: updateError } = await supabaseClient
    .from('payments')
    .update({ status: 'refunded' })
    .eq('id', payment.id);

  if (updateError) {
    console.error('Failed to update payment status:', updateError);
  } else {
    console.log(`Payment ${payment.id} marked as refunded`);
  }

  // Update job posting payment status back to unpaid
  await supabaseClient
    .from('job_postings')
    .update({ payment_status: 'unpaid' })
    .eq('id', payment.job_id);

  // Log the webhook event
  await supabaseClient.from('payment_attempts').insert({
    payment_id: payment.id,
    status: 'refunded',
    culqi_response: event.data,
  });

  console.log(
    `Successfully processed charge.refunded for payment ${payment.id}`
  );
}
