import { useAuth } from '../composables/useAuth';

/**
 * Analyzes a search query using an LLM to determine the appropriate service category
 *
 * @param {string} searchQuery - The user's search query describing their issue
 * @param {function} getToken - Function to get the authentication token
 * @returns {Promise<Object>} - Object containing category, confidence, and explanation
 */
export async function analyzeCategoryWithLLM(searchQuery, getToken) {
  // Create Supabase client with proper token handling
  let supabaseClient;

  try {
    // Handle different token formats
    // Get Supabase client from auth composable
    const auth = useAuth();
    supabaseClient = auth.getSupabaseClient();
    console.log(
      '[CATEGORY_ANALYZER] Using Supabase client from auth composable'
    );

    // Call the Supabase Edge Function for category analysis
    const { data, error } = await supabaseClient.functions.invoke(
      'analyze-category',
      {
        body: { query: searchQuery },
      }
    );

    if (error) throw error;

    return {
      category: data.category,
      confidence: data.confidence,
      explanation: data.explanation,
    };
  } catch (error) {
    console.error('Error analyzing category with LLM:', error);

    // Fallback to simple keyword matching if the LLM service fails
    return fallbackCategoryAnalysis(searchQuery);
  }
}

/**
 * Fallback function that uses simple keyword matching when the LLM service is unavailable
 *
 * @param {string} searchQuery - The user's search query describing their issue
 * @returns {Object} - Object containing category, confidence, and explanation
 */
function fallbackCategoryAnalysis(searchQuery) {
  const query = searchQuery.toLowerCase();
  const categoryKeywords = {
    plumbing: [
      'plumbing',
      'pipe',
      'leak',
      'faucet',
      'toilet',
      'sink',
      'drain',
      'water',
    ],
    electrical: [
      'electrical',
      'light',
      'outlet',
      'switch',
      'power',
      'wiring',
      'circuit',
      'breaker',
    ],
    gardening: [
      'garden',
      'lawn',
      'plant',
      'trim',
      'mow',
      'landscape',
      'weed',
      'grass',
    ],
    painting: ['paint', 'wall', 'ceiling', 'color', 'brush', 'roller', 'stain'],
    cleaning: [
      'clean',
      'dust',
      'vacuum',
      'mop',
      'wash',
      'sanitize',
      'disinfect',
    ],
    carpentry: [
      'wood',
      'cabinet',
      'shelf',
      'door',
      'furniture',
      'carpenter',
      'build',
    ],
    ac_repair: [
      'ac',
      'air conditioning',
      'cooling',
      'hvac',
      'temperature',
      'heat',
      'thermostat',
    ],
  };

  // Check each category for keyword matches
  let bestCategory = 'contractor'; // Default category
  let highestMatchCount = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const matchCount = keywords.filter((keyword) =>
      query.includes(keyword)
    ).length;

    if (matchCount > highestMatchCount) {
      highestMatchCount = matchCount;
      bestCategory = category;
    }
  }

  // Calculate a simple confidence score based on match count
  const confidence =
    highestMatchCount > 0 ? Math.min(0.5 + highestMatchCount * 0.1, 0.9) : 0.5;

  return {
    category: bestCategory,
    confidence: confidence,
    explanation: `Fallback categorization: ${bestCategory} (based on keyword matching)`,
  };
}
