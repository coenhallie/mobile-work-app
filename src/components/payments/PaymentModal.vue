<template>
  <Dialog :open="isOpen" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center space-x-2">
          <svg
            class="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            ></path>
          </svg>
          <span>{{ $t('payment.securePayment') }}</span>
        </DialogTitle>
        <DialogDescription>
          {{ $t('payment.modalDescription') }}
        </DialogDescription>
      </DialogHeader>

      <!-- Payment States -->
      <div class="py-4">
        <!-- Loading State -->
        <div v-if="paymentState === 'loading'" class="text-center py-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4"
          >
            <svg
              class="w-8 h-8 text-blue-600 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-foreground mb-2">
            {{ $t('payment.processing') }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ $t('payment.processingDescription') }}
          </p>
        </div>

        <!-- Success State -->
        <div v-else-if="paymentState === 'success'" class="text-center py-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4"
          >
            <svg
              class="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-foreground mb-2">
            {{ $t('payment.paymentSuccessful') }}
          </h3>
          <p class="text-sm text-muted-foreground mb-4">
            {{ $t('payment.successDescription') }}
          </p>
          <div
            v-if="paymentResult"
            class="bg-muted/50 rounded-lg p-3 text-left"
          >
            <div class="flex justify-between items-center text-sm">
              <span class="text-muted-foreground"
                >{{ $t('payment.transactionId') }}:</span
              >
              <span class="font-mono text-xs">{{
                paymentResult.transaction_id || paymentResult.id
              }}</span>
            </div>
            <div class="flex justify-between items-center text-sm mt-1">
              <span class="text-muted-foreground"
                >{{ $t('payment.amount') }}:</span
              >
              <span class="font-semibold"
                >S/ {{ (paymentResult.amount / 100).toFixed(2) }}</span
              >
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="paymentState === 'error'" class="text-center py-8">
          <div
            class="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-4"
          >
            <svg
              class="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-foreground mb-2">
            {{ $t('payment.paymentFailed') }}
          </h3>
          <p class="text-sm text-muted-foreground mb-4">
            {{ errorMessage || $t('payment.errorDescription') }}
          </p>
          <Button @click="resetPayment" variant="outline" class="w-full">
            {{ $t('payment.tryAgain') }}
          </Button>
        </div>

        <!-- Payment Form State -->
        <div v-else>
          <PaymentForm
            :job-id="jobId"
            :amount="amount"
            :description="description"
            @success="handlePaymentSuccess"
            @error="handlePaymentError"
          />
        </div>
      </div>

      <!-- Footer Actions -->
      <div
        v-if="paymentState === 'form'"
        class="flex justify-between items-center pt-4 border-t border-border"
      >
        <Button @click="handleCancel" variant="ghost" size="sm">
          {{ $t('buttons.cancel') }}
        </Button>
        <div class="flex items-center space-x-2 text-xs text-muted-foreground">
          <svg
            class="w-3 h-3"
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
          <span>{{ $t('payment.poweredByCulqi') }}</span>
        </div>
      </div>

      <!-- Success/Error Footer -->
      <div
        v-else-if="paymentState === 'success' || paymentState === 'error'"
        class="flex justify-end pt-4 border-t border-border"
      >
        <Button @click="handleClose" class="w-full">
          {{
            paymentState === 'success' ? $t('buttons.close') : $t('buttons.ok')
          }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import PaymentForm from './PaymentForm.vue';

const { t } = useI18n();

// Props
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
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
const emit = defineEmits(['update:open', 'success', 'error', 'cancel']);

// State
const paymentState = ref('form'); // 'form', 'loading', 'success', 'error'
const paymentResult = ref(null);
const errorMessage = ref('');

// Computed
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

// Methods
const handleOpenChange = (open) => {
  if (!open) {
    handleClose();
  }
  emit('update:open', open);
};

const handlePaymentSuccess = (result) => {
  paymentState.value = 'success';
  paymentResult.value = result;
  emit('success', result);
};

const handlePaymentError = (error) => {
  paymentState.value = 'error';
  errorMessage.value = error;
  emit('error', error);
};

const handleCancel = () => {
  emit('cancel');
  handleClose();
};

const handleClose = () => {
  // Reset state when closing
  setTimeout(() => {
    if (!props.open) {
      resetPayment();
    }
  }, 300); // Wait for modal close animation

  emit('update:open', false);
};

const resetPayment = () => {
  paymentState.value = 'form';
  paymentResult.value = null;
  errorMessage.value = '';
};

// Watch for modal opening to reset state
watch(
  () => props.open,
  (newValue) => {
    if (newValue) {
      resetPayment();
    }
  }
);

// Expose methods for parent components
defineExpose({
  resetPayment,
  setLoading: () => {
    paymentState.value = 'loading';
  },
  setSuccess: (result) => {
    paymentState.value = 'success';
    paymentResult.value = result;
  },
  setError: (error) => {
    paymentState.value = 'error';
    errorMessage.value = error;
  },
});
</script>

<style scoped>
/* Custom animations for payment states */
.payment-state-enter-active,
.payment-state-leave-active {
  transition: all 0.3s ease;
}

.payment-state-enter-from,
.payment-state-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Success checkmark animation */
@keyframes checkmark {
  0% {
    stroke-dasharray: 0 50;
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dasharray: 50 50;
    stroke-dashoffset: -50;
  }
}

.success-checkmark {
  animation: checkmark 0.6s ease-in-out;
}

/* Loading spinner enhancement */
.payment-loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Error shake animation */
@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-2px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(2px);
  }
}

.error-shake {
  animation: shake 0.5s ease-in-out;
}
</style>
