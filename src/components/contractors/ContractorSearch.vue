<template>
  <div class="contractor-search relative">
    <div class="relative">
      <!-- Search Input -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search contractors by name, skill, or location..."
        class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        @input="handleInput"
        @focus="showSuggestions = true"
        @blur="hideSuggestions"
      />

      <!-- Search Icon -->
      <div
        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
      >
        <svg
          class="w-5 h-5 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </div>

      <!-- Clear Button -->
      <button
        v-if="searchQuery"
        @click="clearSearch"
        class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <span class="text-lg">✕</span>
      </button>
    </div>

    <!-- Search Suggestions -->
    <div
      v-if="showSuggestions && suggestions.length > 0"
      class="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
    >
      <div
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        @mousedown="selectSuggestion(suggestion)"
        class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
      >
        <div class="flex items-center space-x-3">
          <span class="text-lg">{{ suggestion.icon }}</span>
          <div>
            <div class="font-medium text-gray-900 dark:text-white">
              {{ suggestion.title }}
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">
              {{ suggestion.subtitle }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'search']);

// State
const searchQuery = ref(props.modelValue);
const showSuggestions = ref(false);
const suggestions = ref([]);

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    searchQuery.value = newValue;
  }
);

watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue);
  if (newValue.length > 2) {
    generateSuggestions(newValue);
  } else {
    suggestions.value = [];
  }
});

// Methods
const handleInput = () => {
  emit('search', searchQuery.value);
};

const clearSearch = () => {
  searchQuery.value = '';
  suggestions.value = [];
  emit('search', '');
};

const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion.title;
  showSuggestions.value = false;
  emit('search', suggestion.title);
};

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

const generateSuggestions = (query) => {
  // Mock suggestions - replace with actual API call
  suggestions.value = [
    {
      id: 1,
      title: 'Plumber',
      subtitle: 'Service category',
      icon: '🔧',
    },
    {
      id: 2,
      title: 'Lima',
      subtitle: 'Location',
      icon: '📍',
    },
    {
      id: 3,
      title: 'Electrician',
      subtitle: 'Service category',
      icon: '⚡',
    },
  ].filter((item) => item.title.toLowerCase().includes(query.toLowerCase()));
};
</script>
