// Follow this setup guide to integrate the Deno runtime into your Supabase project:
// https://deno.land/manual/getting_started/setup_your_environment

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1';

// Initialize OpenAI client
// Using Supabase secrets for secure API key management
// Set it using: supabase secrets set OPENAI_API_KEY=your_key
const openaiApiKey = (globalThis as any).Deno?.env?.get('OPENAI_API_KEY');

if (!openaiApiKey) {
  throw new Error(
    'OPENAI_API_KEY environment variable is not set. Please configure it using: supabase secrets set OPENAI_API_KEY=your_key'
  );
}

const configuration = new Configuration({
  apiKey: openaiApiKey,
});
const openai = new OpenAIApi(configuration);

// Define service categories
const validCategories = [
  'plumbing',
  'electrical',
  'gardening',
  'painting',
  'cleaning',
  'carpentry',
  'ac_repair',
  'contractor',
];

// Define category descriptions for better matching
const categoryDescriptions = {
  plumbing:
    'Water-related issues, pipes, leaks, toilets, sinks, faucets, drains, water heaters',
  electrical:
    'Electrical issues, wiring, outlets, switches, lights, power, circuits, breakers',
  gardening:
    'Yard work, lawn care, plants, trees, landscaping, mowing, trimming, weeding',
  painting:
    'Interior or exterior painting, walls, ceilings, trim, staining, color changes',
  cleaning:
    'House cleaning, deep cleaning, carpet cleaning, window washing, sanitizing',
  carpentry:
    'Woodworking, furniture repair, cabinets, shelving, doors, trim work',
  ac_repair:
    'Air conditioning, heating, HVAC, temperature control, ventilation',
  contractor: 'General contracting, remodeling, construction, multiple trades',
};

serve(async (req) => {
  try {
    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':
        'authorization, x-client-info, apikey, content-type',
    };

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers });
    }

    // Parse request body
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({
          error:
            "Invalid request. 'query' parameter is required and must be a string.",
        }),
        { status: 400, headers }
      );
    }

    console.log(`Analyzing query: "${query}"`);

    // Create the prompt for the LLM
    const prompt = `
You are a home service categorization expert. Analyze the following request and categorize it into exactly one of these categories:
${validCategories.map((cat) => `- ${cat}: ${categoryDescriptions[cat]}`).join('\n')}

Request: "${query}"

Respond with only the category name, nothing else. If the request doesn't clearly fit any category, use "contractor".
`;

    // Call OpenAI API
    const response = await openai.createCompletion({
      model: 'gpt-3.5-turbo-instruct',
      prompt: prompt,
      max_tokens: 50,
      temperature: 0.3,
    });

    // Extract and validate the category
    let category = response.data.choices[0].text.trim().toLowerCase();

    // Clean up the response (remove any punctuation or extra text)
    category = category.replace(/[^a-z_]/g, '');

    // Ensure the category is valid
    if (!validCategories.includes(category)) {
      console.log(
        `Invalid category detected: "${category}". Defaulting to "contractor".`
      );
      category = 'contractor';
    }

    // Calculate a confidence score (simplified)
    const confidence = 0.9; // In a real implementation, this would be based on the LLM's confidence

    // Return the result
    return new Response(
      JSON.stringify({
        category: category,
        confidence: confidence,
        explanation: `The query was categorized as ${category} based on LLM analysis.`,
      }),
      { headers }
    );
  } catch (error) {
    console.error('Error processing request:', error);

    return new Response(
      JSON.stringify({
        error: error.message || 'An error occurred during processing',
        category: 'contractor', // Default fallback
        confidence: 0.5,
        explanation:
          'Error in analysis, defaulting to general contractor category.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers':
            'authorization, x-client-info, apikey, content-type',
        },
      }
    );
  }
});
