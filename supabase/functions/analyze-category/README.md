# Category Analysis Edge Function

This Supabase Edge Function analyzes a search query using OpenAI's GPT model to determine the appropriate service category for a home service request.

## Functionality

The function:

1. Receives a search query from the client
2. Sends the query to OpenAI's API for analysis
3. Extracts and validates the category from the response
4. Returns the category, confidence score, and explanation

## Deployment Instructions

### Prerequisites

1. Supabase CLI installed
2. OpenAI API key

### Setup

1. Set up your OpenAI API key as a secret:

```bash
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

2. Deploy the function:

```bash
supabase functions deploy analyze-category
```

3. Test the function:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/analyze-category \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"query": "My garden needs trimming"}'
```

## Usage in the Application

The function is called from the `categoryAnalyzer.js` file in the application. It receives a search query and returns the appropriate service category.

Example response:

```json
{
  "category": "gardening",
  "confidence": 0.9,
  "explanation": "The query was categorized as gardening based on LLM analysis."
}
```

## Notes

- The TypeScript errors in VS Code are expected and won't affect the functionality when deployed to Supabase.
- The function includes error handling and will default to the "contractor" category if analysis fails.
- The confidence score is currently simplified and set to 0.9 for successful analyses.
