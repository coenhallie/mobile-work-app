/**
 * useCulqi - Culqi payment integration composable
 *
 * Provides a unified interface for:
 * 1. Culqi SDK initialization and configuration
 * 2. Token creation from card details
 * 3. Payment processing through Supabase Edge Functions
 * 4. Error handling and validation
 */

import { ref, computed } from 'vue';
import { useAuth } from './useAuth';

// Culqi configuration
const CULQI_PUBLIC_KEY = import.meta.env.VITE_CULQI_PUBLIC_KEY;
const isInitialized = ref(false);
const isLoading = ref(false);
const error = ref(null);

export function useCulqi() {
  const { getSupabaseClient, userId } = useAuth();

  /**
   * Initialize Culqi SDK
   */
  const initializeCulqi = async () => {
    if (isInitialized.value) return true;

    try {
      // Check if Culqi is already loaded
      if (typeof window.Culqi !== 'undefined') {
        window.Culqi.publicKey = CULQI_PUBLIC_KEY;
        isInitialized.value = true;
        return true;
      }

      // Load Culqi SDK dynamically
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.culqi.com/js/v4';
        script.async = true;

        script.onload = () => {
          if (typeof window.Culqi !== 'undefined') {
            window.Culqi.publicKey = CULQI_PUBLIC_KEY;
            isInitialized.value = true;
            resolve(true);
          } else {
            reject(new Error('Culqi SDK failed to load'));
          }
        };

        script.onerror = () => {
          reject(new Error('Failed to load Culqi SDK'));
        };

        document.head.appendChild(script);
      });
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  /**
   * Create a Culqi token from card details
   */
  const createToken = async (cardData) => {
    if (!isInitialized.value) {
      await initializeCulqi();
    }

    return new Promise((resolve, reject) => {
      try {
        // Validate card data
        if (
          !cardData.card_number ||
          !cardData.cvv ||
          !cardData.expiration_month ||
          !cardData.expiration_year ||
          !cardData.email
        ) {
          reject(new Error('Missing required card information'));
          return;
        }

        // Set up Culqi callbacks
        window.Culqi.createToken = function (token) {
          resolve(token);
        };

        window.Culqi.error = function (error) {
          reject(
            new Error(error.user_message || 'Error creating payment token')
          );
        };

        // Create token with Culqi
        window.Culqi.createToken({
          card_number: cardData.card_number.replace(/\s/g, ''), // Remove spaces
          cvv: cardData.cvv,
          expiration_month: cardData.expiration_month,
          expiration_year: cardData.expiration_year,
          email: cardData.email,
        });
      } catch (err) {
        reject(err);
      }
    });
  };

  /**
   * Process payment through Supabase Edge Function
   */
  const processPayment = async (paymentData) => {
    if (!userId.value) {
      throw new Error('User must be authenticated to process payment');
    }

    isLoading.value = true;
    error.value = null;

    try {
      const supabase = getSupabaseClient();

      const { data, error: functionError } = await supabase.functions.invoke(
        'process-payment',
        {
          body: {
            token_id: paymentData.token_id,
            job_id: paymentData.job_id,
            amount: paymentData.amount,
            currency: paymentData.currency || 'PEN',
            description:
              paymentData.description ||
              `Payment for job ${paymentData.job_id}`,
            user_id: userId.value,
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message || 'Payment processing failed');
      }

      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Complete payment flow: create token and process payment
   */
  const completePayment = async (cardData, paymentData) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Step 1: Create Culqi token
      const token = await createToken(cardData);

      // Step 2: Process payment with token
      const result = await processPayment({
        ...paymentData,
        token_id: token.id,
      });

      return {
        success: true,
        payment: result,
        token: token,
      };
    } catch (err) {
      error.value = err.message;
      return {
        success: false,
        error: err.message,
      };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Validate card number using Luhn algorithm
   */
  const validateCardNumber = (cardNumber) => {
    const num = cardNumber.replace(/\s/g, '');
    if (!/^\d+$/.test(num)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  };

  /**
   * Format card number with spaces
   */
  const formatCardNumber = (value) => {
    const num = value.replace(/\s/g, '');
    return num.replace(/(.{4})/g, '$1 ').trim();
  };

  /**
   * Get card type from number
   */
  const getCardType = (cardNumber) => {
    const num = cardNumber.replace(/\s/g, '');

    if (/^4/.test(num)) return 'visa';
    if (/^5[1-5]/.test(num)) return 'mastercard';
    if (/^3[47]/.test(num)) return 'amex';
    if (/^6(?:011|5)/.test(num)) return 'discover';

    return 'unknown';
  };

  /**
   * Validate expiry date
   */
  const validateExpiry = (month, year) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const expMonth = parseInt(month);
    const expYear = parseInt(year);

    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  };

  /**
   * Fetch payment history for current user
   */
  const fetchPaymentHistory = async () => {
    if (!userId.value) {
      throw new Error('User must be authenticated to fetch payment history');
    }

    try {
      const supabase = getSupabaseClient();

      const { data, error: fetchError } = await supabase
        .from('payments')
        .select(
          `
          *,
          job_postings (
            id,
            category_name,
            description
          )
        `
        )
        .eq('user_id', userId.value)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      return data || [];
    } catch (err) {
      error.value = err.message;
      throw err;
    }
  };

  return {
    // State
    isInitialized: computed(() => isInitialized.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Methods
    initializeCulqi,
    createToken,
    processPayment,
    completePayment,
    fetchPaymentHistory,

    // Utilities
    validateCardNumber,
    formatCardNumber,
    getCardType,
    validateExpiry,

    // Clear error
    clearError: () => {
      error.value = null;
    },
  };
}
