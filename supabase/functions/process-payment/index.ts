import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Culqi API configuration
const CULQI_API_URL = 'https://api.culqi.com/v2/charges';
const CULQI_SECRET_KEY = Deno.env.get('CULQI_SECRET_KEY');

interface ProcessPaymentRequest {
  culqiToken: string;
  jobId: string;
  amount: number;
}

interface CulqiChargeRequest {
  amount: number;
  currency_code: string;
  email: string;
  source_id: string;
  description?: string;
}

interface CulqiChargeResponse {
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

    // Validate Culqi secret key
    if (!CULQI_SECRET_KEY) {
      console.error('CULQI_SECRET_KEY environment variable not set');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const requestBody: ProcessPaymentRequest = await req.json();
    const { culqiToken, jobId, amount } = requestBody;

    // Validate required fields
    if (!culqiToken || !jobId || !amount) {
      return new Response(
        JSON.stringify({
          error:
            'Missing required fields: culqiToken, jobId, and amount are required',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Validate amount
    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than 0' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    console.log(`Processing payment for job ${jobId}, amount: ${amount}`);

    // Get job details and verify ownership
    const { data: job, error: jobError } = await supabaseClient
      .from('job_postings')
      .select('id, posted_by_user_id, title, payment_status')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Check if job already has a successful payment
    if (job.payment_status === 'paid') {
      return new Response(
        JSON.stringify({ error: 'Job has already been paid for' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Get user details for the payment
    const { data: user, error: userError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', job.posted_by_user_id)
      .single();

    if (userError || !user) {
      console.error('User not found:', userError);
      return new Response(JSON.stringify({ error: 'User not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .insert({
        job_id: jobId,
        user_id: job.posted_by_user_id,
        amount: amount,
        currency: 'PEN',
        status: 'pending',
      })
      .select()
      .single();

    if (paymentError || !payment) {
      console.error('Failed to create payment record:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment record' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Log initial payment attempt
    const { error: attemptError } = await supabaseClient
      .from('payment_attempts')
      .insert({
        payment_id: payment.id,
        status: 'initiated',
      });

    if (attemptError) {
      console.error('Failed to log payment attempt:', attemptError);
    }

    // Prepare Culqi charge request
    const culqiChargeData: CulqiChargeRequest = {
      amount: Math.round(amount * 100), // Convert to cents
      currency_code: 'PEN',
      email: user.email,
      source_id: culqiToken,
      description: `Payment for job: ${job.title}`,
    };

    console.log('Sending charge request to Culqi...');

    // Make request to Culqi API
    const culqiResponse = await fetch(CULQI_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CULQI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(culqiChargeData),
    });

    const culqiResponseData = await culqiResponse.json();

    // Log payment attempt with Culqi response
    await supabaseClient.from('payment_attempts').insert({
      payment_id: payment.id,
      status: culqiResponse.ok ? 'processing' : 'failed',
      error_message: culqiResponse.ok
        ? null
        : culqiResponseData.user_message || 'Payment failed',
      culqi_response: culqiResponseData,
    });

    if (!culqiResponse.ok) {
      console.error('Culqi API error:', culqiResponseData);

      // Update payment status to failed
      await supabaseClient
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      return new Response(
        JSON.stringify({
          error: 'Payment failed',
          message:
            culqiResponseData.user_message || 'Payment processing failed',
          details: culqiResponseData,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const chargeResponse: CulqiChargeResponse = culqiResponseData;

    // Check if charge was successful
    const isSuccessful = chargeResponse.outcome?.type === 'venta_exitosa';
    const newStatus = isSuccessful ? 'succeeded' : 'failed';

    // Update payment record with Culqi charge ID and status
    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        culqi_charge_id: chargeResponse.id,
        status: newStatus,
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment record:', updateError);
    }

    // Log final payment attempt
    await supabaseClient.from('payment_attempts').insert({
      payment_id: payment.id,
      status: newStatus,
      error_message: isSuccessful ? null : chargeResponse.outcome?.user_message,
      culqi_response: chargeResponse,
    });

    if (isSuccessful) {
      console.log(
        `Payment successful for job ${jobId}, charge ID: ${chargeResponse.id}`
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment processed successfully',
          payment: {
            id: payment.id,
            culqi_charge_id: chargeResponse.id,
            amount: amount,
            status: 'succeeded',
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } else {
      console.log(`Payment failed for job ${jobId}:`, chargeResponse.outcome);

      return new Response(
        JSON.stringify({
          error: 'Payment failed',
          message:
            chargeResponse.outcome?.user_message ||
            'Payment was not successful',
          payment: {
            id: payment.id,
            status: 'failed',
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
  } catch (error) {
    console.error('Error processing payment:', error);
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
