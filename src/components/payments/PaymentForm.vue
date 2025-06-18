<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Card Number -->
    <div class="space-y-2">
      <label for="cardNumber" class="block text-sm font-medium text-foreground">
        {{ $t('payment.cardNumber') }}
      </label>
      <div class="relative">
        <Input
          id="cardNumber"
          v-model="formData.cardNumber"
          type="text"
          :placeholder="$t('payment.cardNumberPlaceholder')"
          :class="[
            'pr-12',
            errors.cardNumber
              ? 'border-destructive focus:border-destructive'
              : '',
          ]"
          maxlength="19"
          @input="handleCardNumberInput"
          @blur="validateCardNumber"
          autocomplete="cc-number"
        />
        <!-- Card type icon -->
        <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div v-if="cardType" class="w-6 h-4 flex items-center justify-center">
            <svg v-if="cardType === 'visa'" class="w-6 h-4" viewBox="0 0 24 16">
              <rect width="24" height="16" rx="2" fill="#1a1f71" />
              <text
                x="12"
                y="11"
                text-anchor="middle"
                fill="white"
                font-size="8"
                font-weight="bold"
              >
                VISA
              </text>
            </svg>
            <svg
              v-else-if="cardType === 'mastercard'"
              class="w-6 h-4"
              viewBox="0 0 24 16"
            >
              <rect width="24" height="16" rx="2" fill="#eb001b" />
              <circle cx="9" cy="8" r="5" fill="#ff5f00" />
              <circle cx="15" cy="8" r="5" fill="#f79e1b" />
            </svg>
            <svg v-else class="w-6 h-4" viewBox="0 0 24 16">
              <rect
                width="24"
                height="16"
                rx="2"
                fill="#6b7280"
                stroke="#9ca3af"
              />
            </svg>
          </div>
        </div>
      </div>
      <p v-if="errors.cardNumber" class="text-sm text-destructive">
        {{ errors.cardNumber }}
      </p>
    </div>

    <!-- Expiry Date and CVV -->
    <div class="grid grid-cols-2 gap-4">
      <!-- Expiry Date -->
      <div class="space-y-2">
        <label
          for="expiryDate"
          class="block text-sm font-medium text-foreground"
        >
          {{ $t('payment.expiryDate') }}
        </label>
        <Input
          id="expiryDate"
          v-model="formData.expiryDate"
          type="text"
          placeholder="MM/YY"
          :class="
            errors.expiryDate
              ? 'border-destructive focus:border-destructive'
              : ''
          "
          maxlength="5"
          @input="handleExpiryInput"
          @blur="validateExpiryDate"
          autocomplete="cc-exp"
        />
        <p v-if="errors.expiryDate" class="text-sm text-destructive">
          {{ errors.expiryDate }}
        </p>
      </div>

      <!-- CVV -->
      <div class="space-y-2">
        <label for="cvv" class="block text-sm font-medium text-foreground">
          {{ $t('payment.cvv') }}
        </label>
        <Input
          id="cvv"
          v-model="formData.cvv"
          type="text"
          placeholder="123"
          :class="
            errors.cvv ? 'border-destructive focus:border-destructive' : ''
          "
          :maxlength="cardType === 'amex' ? 4 : 3"
          @input="handleCvvInput"
          @blur="validateCvv"
          autocomplete="cc-csc"
        />
        <p v-if="errors.cvv" class="text-sm text-destructive">
          {{ errors.cvv }}
        </p>
      </div>
    </div>

    <!-- Cardholder Name -->
    <div class="space-y-2">
      <label
        for="cardholderName"
        class="block text-sm font-medium text-foreground"
      >
        {{ $t('payment.cardholderName') }}
      </label>
      <Input
        id="cardholderName"
        v-model="formData.cardholderName"
        type="text"
        :placeholder="$t('payment.cardholderNamePlaceholder')"
        :class="
          errors.cardholderName
            ? 'border-destructive focus:border-destructive'
            : ''
        "
        @blur="validateCardholderName"
        autocomplete="cc-name"
      />
      <p v-if="errors.cardholderName" class="text-sm text-destructive">
        {{ errors.cardholderName }}
      </p>
    </div>

    <!-- Email -->
    <div class="space-y-2">
      <label for="email" class="block text-sm font-medium text-foreground">
        {{ $t('payment.email') }}
      </label>
      <Input
        id="email"
        v-model="formData.email"
        type="email"
        :placeholder="$t('payment.emailPlaceholder')"
        :class="
          errors.email ? 'border-destructive focus:border-destructive' : ''
        "
        @blur="validateEmail"
        autocomplete="email"
      />
      <p v-if="errors.email" class="text-sm text-destructive">
        {{ errors.email }}
      </p>
    </div>

    <!-- Payment Amount Display -->
    <div class="bg-muted/50 rounded-lg p-4 border">
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-muted-foreground">
          {{ $t('payment.totalAmount') }}
        </span>
        <span class="text-lg font-bold text-foreground">
          S/ {{ amount.toFixed(2) }}
        </span>
      </div>
      <p class="text-xs text-muted-foreground mt-1">
        {{ description }}
      </p>
    </div>

    <!-- Security Notice -->
    <div
      class="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3"
    >
      <div class="flex items-start space-x-2">
        <svg
          class="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          ></path>
        </svg>
        <div>
          <p class="text-xs font-medium text-blue-800 dark:text-blue-200">
            {{ $t('payment.securePayment') }}
          </p>
          <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
            {{ $t('payment.securityNotice') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Submit Button -->
    <Button
      type="submit"
      :loading="isProcessing"
      :disabled="!isFormValid || isProcessing"
      class="w-full"
      size="lg"
      haptic-feedback="success"
    >
      <svg
        v-if="!isProcessing"
        class="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        ></path>
      </svg>
      {{ isProcessing ? $t('payment.processing') : $t('payment.payNow') }}
    </Button>

    <!-- Error Message -->
    <div
      v-if="paymentError"
      class="bg-destructive/10 border border-destructive/20 rounded-lg p-3"
    >
      <div class="flex items-start space-x-2">
        <svg
          class="w-4 h-4 text-destructive mt-0.5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <div>
          <p class="text-sm font-medium text-destructive">
            {{ $t('payment.paymentFailed') }}
          </p>
          <p class="text-sm text-destructive/80 mt-1">
            {{ paymentError }}
          </p>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useCulqi } from '@/composables/useCulqi';
import { useAuth } from '@/composables/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const { t } = useI18n();
const { userEmail } = useAuth();
const {
  formatCardNumber,
  getCardType,
  validateCardNumber: validateCardNum,
  validateExpiry,
  completePayment,
  isLoading,
  error,
  clearError,
} = useCulqi();

// Props
const props = defineProps({
  jobId: {
    type: [String, Number],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
});

// Emits
const emit = defineEmits(['success', 'error', 'cancel']);

// Form data
const formData = ref({
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  cardholderName: '',
  email: userEmail.value || '',
});

// Form validation errors
const errors = ref({
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  cardholderName: '',
  email: '',
});

// Processing state
const isProcessing = ref(false);
const paymentError = ref('');

// Computed properties
const cardType = computed(() => {
  return getCardType(formData.value.cardNumber);
});

const isFormValid = computed(() => {
  return (
    formData.value.cardNumber &&
    formData.value.expiryDate &&
    formData.value.cvv &&
    formData.value.cardholderName &&
    formData.value.email &&
    !Object.values(errors.value).some((error) => error)
  );
});

// Input handlers
const handleCardNumberInput = (event) => {
  const formatted = formatCardNumber(event.target.value);
  formData.value.cardNumber = formatted;
  if (errors.value.cardNumber) {
    validateCardNumber();
  }
};

const handleExpiryInput = (event) => {
  let value = event.target.value.replace(/\D/g, '');
  if (value.length >= 2) {
    value = value.substring(0, 2) + '/' + value.substring(2, 4);
  }
  formData.value.expiryDate = value;
  if (errors.value.expiryDate) {
    validateExpiryDate();
  }
};

const handleCvvInput = (event) => {
  const value = event.target.value.replace(/\D/g, '');
  formData.value.cvv = value;
  if (errors.value.cvv) {
    validateCvv();
  }
};

// Validation functions
const validateCardNumber = () => {
  const isValid = validateCardNum(formData.value.cardNumber);
  errors.value.cardNumber = isValid
    ? ''
    : t('payment.errors.invalidCardNumber');
};

const validateExpiryDate = () => {
  const [month, year] = formData.value.expiryDate.split('/');
  if (!month || !year) {
    errors.value.expiryDate = t('payment.errors.invalidExpiryDate');
    return;
  }

  const fullYear = parseInt('20' + year);
  const isValid = validateExpiry(month, fullYear);
  errors.value.expiryDate = isValid ? '' : t('payment.errors.expiredCard');
};

const validateCvv = () => {
  const minLength = cardType.value === 'amex' ? 4 : 3;
  const isValid = formData.value.cvv.length >= minLength;
  errors.value.cvv = isValid ? '' : t('payment.errors.invalidCvv');
};

const validateCardholderName = () => {
  const isValid = formData.value.cardholderName.trim().length >= 2;
  errors.value.cardholderName = isValid
    ? ''
    : t('payment.errors.invalidCardholderName');
};

const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(formData.value.email);
  errors.value.email = isValid ? '' : t('payment.errors.invalidEmail');
};

// Form submission
const handleSubmit = async () => {
  // Clear previous errors
  paymentError.value = '';
  clearError();

  // Validate all fields
  validateCardNumber();
  validateExpiryDate();
  validateCvv();
  validateCardholderName();
  validateEmail();

  if (!isFormValid.value) {
    return;
  }

  isProcessing.value = true;

  try {
    // Prepare card data for Culqi
    const [month, year] = formData.value.expiryDate.split('/');
    const cardData = {
      card_number: formData.value.cardNumber,
      cvv: formData.value.cvv,
      expiration_month: month,
      expiration_year: '20' + year,
      email: formData.value.email,
    };

    // Prepare payment data
    const paymentData = {
      job_id: props.jobId,
      amount: Math.round(props.amount * 100), // Convert to cents
      currency: 'PEN',
      description: props.description || `Payment for job ${props.jobId}`,
    };

    // Process payment
    const result = await completePayment(cardData, paymentData);

    if (result.success) {
      emit('success', result.payment);
    } else {
      paymentError.value = result.error;
      emit('error', result.error);
    }
  } catch (err) {
    paymentError.value = err.message;
    emit('error', err.message);
  } finally {
    isProcessing.value = false;
  }
};

// Watch for external errors
watch(error, (newError) => {
  if (newError) {
    paymentError.value = newError;
  }
});

// Auto-fill email if user is authenticated
watch(userEmail, (newEmail) => {
  if (newEmail && !formData.value.email) {
    formData.value.email = newEmail;
  }
});
</script>

<style scoped>
/* Custom input focus styles for payment form */
.payment-input:focus {
  @apply border-2;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Card type icons animation */
.card-icon {
  transition: all 0.2s ease-in-out;
}

/* Security badge styling */
.security-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}
</style>
