<template>
  <div class="space-y-6 py-4">
    <!-- Header with Job Context -->
    <div class="text-center space-y-4">
      <div
        class="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center"
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">
          Almost there! Complete to apply for this job
        </h2>
        <p class="text-gray-600">Just a few quick details to get you started</p>
      </div>
    </div>

    <!-- Selected Job Reminder -->
    <div
      v-if="selectedJob"
      class="bg-blue-50 border border-blue-200 rounded-xl p-4"
    >
      <div class="flex items-center space-x-3">
        <div
          class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"
        >
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
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V8m8 0V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2"
            />
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="font-semibold text-blue-900">{{ selectedJob.title }}</h4>
          <p class="text-sm text-blue-700">
            {{ selectedJob.budget }} • {{ selectedJob.location }}
          </p>
        </div>
      </div>
    </div>

    <!-- Form -->
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Full Name -->
      <div class="space-y-2">
        <label for="fullName" class="block text-sm font-medium text-gray-700">
          Full Name <span class="text-red-500">*</span>
        </label>
        <input
          id="fullName"
          v-model="formData.fullName"
          type="text"
          required
          placeholder="Enter your full name"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          :class="{ 'border-red-500': errors.fullName }"
        />
        <p v-if="errors.fullName" class="text-sm text-red-600">
          {{ errors.fullName }}
        </p>
      </div>

      <!-- Phone Number -->
      <div class="space-y-2">
        <label for="phone" class="block text-sm font-medium text-gray-700">
          Phone Number <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          >
            <span class="text-gray-500 text-sm">+51</span>
          </div>
          <input
            id="phone"
            v-model="formData.phone"
            type="tel"
            required
            placeholder="999 999 999"
            class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            :class="{ 'border-red-500': errors.phone }"
          />
        </div>
        <p v-if="errors.phone" class="text-sm text-red-600">
          {{ errors.phone }}
        </p>
      </div>

      <!-- Years of Experience -->
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">
          Years of Experience <span class="text-red-500">*</span>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <ExperienceOption
            v-for="option in experienceOptions"
            :key="option.value"
            :option="option"
            :selected="formData.yearsExperience === option.value"
            @click="formData.yearsExperience = option.value"
          />
        </div>
        <p v-if="errors.yearsExperience" class="text-sm text-red-600">
          {{ errors.yearsExperience }}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="space-y-3 pt-4">
        <button
          type="submit"
          :disabled="!isFormValid || isSubmitting"
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:transform-none disabled:shadow-none"
        >
          <span
            v-if="isSubmitting"
            class="flex items-center justify-center space-x-2"
          >
            <div
              class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"
            ></div>
            <span>Submitting Application...</span>
          </span>
          <span v-else>Complete & Apply</span>
        </button>

        <button
          type="button"
          @click="$emit('save-later')"
          class="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors"
        >
          Save for Later
        </button>
      </div>
    </form>

    <!-- Trust Indicator -->
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div class="flex items-center space-x-2">
        <svg
          class="w-5 h-5 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <p class="text-sm text-gray-600">
          🔒 Your information is secure and will only be shared with potential
          clients
        </p>
      </div>
    </div>

    <!-- Progress Indicator -->
    <div class="text-center">
      <div class="inline-flex items-center space-x-2 text-sm text-gray-500">
        <div class="flex space-x-1">
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
          <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
        </div>
        <span>Step 5 of 6</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import ExperienceOption from './ExperienceOption.vue';

// Props
const props = defineProps({
  selectedJob: {
    type: Object,
    default: null,
  },
});

// Emits
const emit = defineEmits(['profile-completed', 'save-later']);

// Reactive state
const isSubmitting = ref(false);
const formData = reactive({
  fullName: '',
  phone: '',
  yearsExperience: '',
});

const errors = reactive({
  fullName: '',
  phone: '',
  yearsExperience: '',
});

// Experience options
const experienceOptions = [
  { value: '0-1', label: '0-1 years', description: 'Just starting out' },
  { value: '1-3', label: '1-3 years', description: 'Some experience' },
  { value: '3-5', label: '3-5 years', description: 'Experienced' },
  { value: '5+', label: '5+ years', description: 'Very experienced' },
];

// Computed
const isFormValid = computed(() => {
  return (
    formData.fullName.trim() &&
    formData.phone.trim() &&
    formData.yearsExperience &&
    !Object.values(errors).some((error) => error)
  );
});

// Methods
const validateForm = () => {
  // Reset errors
  Object.keys(errors).forEach((key) => (errors[key] = ''));

  let isValid = true;

  // Validate full name
  if (!formData.fullName.trim()) {
    errors.fullName = 'Full name is required';
    isValid = false;
  } else if (formData.fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters';
    isValid = false;
  }

  // Validate phone
  if (!formData.phone.trim()) {
    errors.phone = 'Phone number is required';
    isValid = false;
  } else if (!/^\d{9}$/.test(formData.phone.replace(/\s/g, ''))) {
    errors.phone = 'Please enter a valid 9-digit phone number';
    isValid = false;
  }

  // Validate experience
  if (!formData.yearsExperience) {
    errors.yearsExperience = 'Please select your years of experience';
    isValid = false;
  }

  return isValid;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  isSubmitting.value = true;

  try {
    // Format phone number
    const formattedPhone = `+51${formData.phone.replace(/\s/g, '')}`;

    const profileData = {
      fullName: formData.fullName.trim(),
      phone: formattedPhone,
      yearsExperience: formData.yearsExperience,
    };

    emit('profile-completed', profileData);
  } catch (error) {
    console.error('Form submission error:', error);
  } finally {
    isSubmitting.value = false;
  }
};

// Auto-format phone number as user types
const formatPhoneNumber = (value) => {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');

  // Limit to 9 digits
  const limited = digits.slice(0, 9);

  // Format as XXX XXX XXX
  if (limited.length >= 6) {
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6)}`;
  } else if (limited.length >= 3) {
    return `${limited.slice(0, 3)} ${limited.slice(3)}`;
  }

  return limited;
};

// Watch phone input for formatting
import { watch } from 'vue';
watch(
  () => formData.phone,
  (newValue) => {
    formData.phone = formatPhoneNumber(newValue);
  }
);
</script>

<style scoped>
/* Custom input focus styles */
input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Smooth transitions for all interactive elements */
* {
  transition-property:
    color, background-color, border-color, transform, box-shadow;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}

/* Ensure proper button states */
button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

button:disabled:hover {
  transform: none !important;
}
</style>
