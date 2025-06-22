<template>
  <div
    class="bg-card payment-item rounded-lg border border-border p-4 transition-shadow duration-200 hover:shadow-md"
  >
    <div class="flex items-start justify-between">
      <!-- Payment Info -->
      <div class="min-w-0 flex-1">
        <div class="mb-2 flex items-center space-x-3">
          <!-- Payment Icon -->
          <div class="flex-shrink-0">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20"
            >
              <svg
                class="h-5 w-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
          </div>

          <!-- Payment Details -->
          <div class="min-w-0 flex-1">
            <h3 class="truncate text-sm font-medium text-foreground">
              {{ jobTitle }}
            </h3>
            <p class="text-xs text-muted-foreground">
              {{ $t('payment.transactionId') }}:
              <span class="font-mono">{{ displayTransactionId }}</span>
            </p>
          </div>
        </div>

        <!-- Job Description (if available) -->
        <p
          v-if="payment.jobs?.description"
          class="line-clamp-2 mb-3 text-sm text-muted-foreground"
        >
          {{ payment.jobs.description }}
        </p>

        <!-- Payment Metadata -->
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-muted-foreground">{{ $t('payment.date') }}:</span>
            <div class="font-medium text-foreground">{{ formattedDate }}</div>
          </div>
          <div>
            <span class="text-muted-foreground"
              >{{ $t('payment.method') }}:</span
            >
            <div class="font-medium text-foreground">{{ paymentMethod }}</div>
          </div>
        </div>
      </div>

      <!-- Amount and Status -->
      <div class="ml-4 flex flex-col items-end space-y-2">
        <!-- Amount -->
        <div class="text-right">
          <div class="text-lg font-bold text-foreground">
            S/ {{ formattedAmount }}
          </div>
          <div
            v-if="payment.currency && payment.currency !== 'PEN'"
            class="text-xs text-muted-foreground"
          >
            {{ payment.currency }}
          </div>
        </div>

        <!-- Status -->
        <PaymentStatusIndicator
          :status="payment.status"
          size="sm"
          class="status-indicator"
        />
      </div>
    </div>

    <!-- Additional Details (Expandable) -->
    <transition name="details">
      <div v-if="showDetails" class="mt-4 border-t border-border pt-4">
        <div class="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          <div v-if="payment.culqi_charge_id">
            <span class="text-muted-foreground"
              >{{ $t('payment.chargeId') }}:</span
            >
            <div class="break-all font-mono text-foreground">
              {{ payment.culqi_charge_id }}
            </div>
          </div>
          <div v-if="payment.created_at">
            <span class="text-muted-foreground"
              >{{ $t('payment.processedAt') }}:</span
            >
            <div class="font-medium text-foreground">
              {{ formattedDateTime }}
            </div>
          </div>
          <div v-if="payment.description">
            <span class="text-muted-foreground"
              >{{ $t('payment.description') }}:</span
            >
            <div class="font-medium text-foreground">
              {{ payment.description }}
            </div>
          </div>
          <div v-if="payment.fee_amount">
            <span class="text-muted-foreground"
              >{{ $t('payment.processingFee') }}:</span
            >
            <div class="font-medium text-foreground">
              S/ {{ (payment.fee_amount / 100).toFixed(2) }}
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 flex justify-end space-x-2">
          <Button
            v-if="payment.status === 'paid' && canRequestRefund"
            variant="outline"
            size="sm"
            @click="$emit('request-refund', payment)"
          >
            {{ $t('payment.requestRefund') }}
          </Button>
          <Button
            v-if="payment.culqi_charge_id"
            variant="outline"
            size="sm"
            @click="$emit('view-receipt', payment)"
          >
            {{ $t('payment.viewReceipt') }}
          </Button>
        </div>
      </div>
    </transition>

    <!-- Toggle Details Button -->
    <div class="mt-3 flex justify-center">
      <Button
        variant="ghost"
        size="sm"
        class="text-xs"
        @click="showDetails = !showDetails"
      >
        {{
          showDetails ? $t('payment.hideDetails') : $t('payment.showDetails')
        }}
        <svg
          :class="[
            'ml-1 h-3 w-3 transition-transform',
            showDetails ? 'rotate-180' : '',
          ]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import PaymentStatusIndicator from './PaymentStatusIndicator.vue';

const { t } = useI18n();

// Props
const props = defineProps({
  payment: {
    type: Object,
    required: true,
  },
  canRequestRefund: {
    type: Boolean,
    default: false,
  },
});

// Emits
defineEmits(['request-refund', 'view-receipt']);

// State
const showDetails = ref(false);

// Computed properties
const jobTitle = computed(() => {
  if (props.payment.jobs?.category_name) {
    return `${props.payment.jobs.category_name} ${t('jobs.serviceRequest')}`;
  }
  return t('payment.jobPayment');
});

const displayTransactionId = computed(() => {
  const id = props.payment.culqi_charge_id || props.payment.id;
  return id ? id.substring(0, 8) + '...' : t('payment.unavailable');
});

const formattedAmount = computed(() => {
  const amount = props.payment.amount / 100; // Convert from cents
  return amount.toFixed(2);
});

const formattedDate = computed(() => {
  if (!props.payment.created_at) return t('payment.unavailable');

  const date = new Date(props.payment.created_at);
  return date.toLocaleDateString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

const formattedDateTime = computed(() => {
  if (!props.payment.created_at) return t('payment.unavailable');

  const date = new Date(props.payment.created_at);
  return date.toLocaleString('es-PE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const paymentMethod = computed(() => {
  // Determine payment method based on available data
  if (props.payment.culqi_charge_id) {
    return t('payment.creditCard');
  }
  return t('payment.unknown');
});
</script>

<style scoped>
/* Line clamp utility for description */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Hover effects */
.payment-item:hover {
  transform: translateY(-1px);
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
}

/* Smooth transitions */
.payment-item {
  transition: all 0.2s ease-in-out;
}

/* Status indicator animations */
.status-indicator {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Details expansion animation */
.details-enter-active,
.details-leave-active {
  transition:
    all 0.3s ease,
    max-height 0.3s ease;
  overflow: hidden;
}
.details-enter-from,
.details-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}
.details-enter-to,
.details-leave-from {
  opacity: 1;
  transform: translateY(0);
  max-height: 200px; /* Adjust as needed */
}
</style>
