import { ref, computed } from 'vue';
import { useAuthenticatedDataFetching } from './useAuth';

export function useBudgetProposals() {
  const auth = useAuthenticatedDataFetching();
  const isLoading = ref(false);
  const error = ref(null);
  const proposals = ref([]);

  // Get the current user ID from auth
  const currentUserId = computed(() => auth.user.value?.id);

  /**
   * Fetch accepted budget proposals for a specific job
   * @param {string} jobId - The job ID to fetch proposals for
   * @param {string} roomId - Optional room ID to also search by
   * @returns {Promise<Object|null>} The accepted proposal or null if none found
   */
  const fetchAcceptedBudgetProposal = async (jobId, roomId = null) => {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    if (!currentUserId.value) {
      throw new Error('User must be authenticated');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const supabase = auth.getSupabaseClient();

      // First try to fetch by job_id
      let { data, error: fetchError } = await supabase
        .from('budget_proposals')
        .select('*')
        .eq('job_id', jobId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        throw new Error(
          `Failed to fetch budget proposal: ${fetchError.message}`
        );
      }

      // If no data found by job_id and we have a room_id, try searching by room_id
      if (!data && roomId) {
        console.log(
          '[useBudgetProposals] No proposal found by job_id, trying room_id:',
          roomId
        );
        const { data: roomData, error: roomError } = await supabase
          .from('budget_proposals')
          .select('*')
          .eq('room_id', roomId)
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (roomError) {
          console.warn(
            '[useBudgetProposals] Error fetching by room_id:',
            roomError
          );
        } else {
          data = roomData;
        }
      }

      return data;
    } catch (err) {
      console.error(
        '[useBudgetProposals] Error fetching accepted proposal:',
        err
      );
      error.value = err.message || 'Failed to fetch budget proposal';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Fetch all budget proposals for a specific job
   * @param {string} jobId - The job ID to fetch proposals for
   * @returns {Promise<Array>} Array of budget proposals
   */
  const fetchJobBudgetProposals = async (jobId) => {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    if (!currentUserId.value) {
      throw new Error('User must be authenticated');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const supabase = auth.getSupabaseClient();

      const { data, error: fetchError } = await supabase
        .from('budget_proposals')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(
          `Failed to fetch budget proposals: ${fetchError.message}`
        );
      }

      proposals.value = data || [];
      return data || [];
    } catch (err) {
      console.error('[useBudgetProposals] Error fetching proposals:', err);
      error.value = err.message || 'Failed to fetch budget proposals';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Format currency amount with proper symbol
   * @param {number} amount - The amount to format
   * @param {string} currency - The currency code (PEN, USD, etc.)
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount, currency = 'PEN') => {
    if (!amount && amount !== 0) return '';

    const currencySymbols = {
      PEN: 'S/',
      USD: '$',
      EUR: '€',
    };

    const symbol = currencySymbols[currency] || currency;

    // Format with proper decimal places and thousands separator
    const formattedAmount = new Intl.NumberFormat('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol} ${formattedAmount}`;
  };

  /**
   * Format budget range for display
   * @param {number} minAmount - Minimum amount
   * @param {number} maxAmount - Maximum amount
   * @param {string} currency - Currency code
   * @returns {string} Formatted range string
   */
  const formatBudgetRange = (minAmount, maxAmount, currency = 'PEN') => {
    if (!minAmount && !maxAmount) return '';

    if (minAmount === maxAmount) {
      return formatCurrency(minAmount, currency);
    }

    if (!minAmount) {
      return `${formatCurrency(maxAmount, currency)} máx.`;
    }

    if (!maxAmount) {
      return `${formatCurrency(minAmount, currency)} mín.`;
    }

    return `${formatCurrency(minAmount, currency)} - ${formatCurrency(maxAmount, currency)}`;
  };

  /**
   * Get the negotiated amount from a proposal
   * @param {Object} proposal - The budget proposal object
   * @returns {Object} Object with amount and formatted string
   */
  const getNegotiatedAmount = (proposal) => {
    if (!proposal) return null;

    const { amount_min, amount_max, currency } = proposal;

    return {
      min: amount_min,
      max: amount_max,
      currency,
      formatted: formatBudgetRange(amount_min, amount_max, currency),
      single: amount_min === amount_max ? amount_min : null,
    };
  };

  return {
    // State
    isLoading,
    error,
    proposals,

    // Actions
    fetchAcceptedBudgetProposal,
    fetchJobBudgetProposals,

    // Utilities
    formatCurrency,
    formatBudgetRange,
    getNegotiatedAmount,
  };
}
