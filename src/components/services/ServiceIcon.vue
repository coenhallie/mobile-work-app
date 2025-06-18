<template>
  <div class="service-icon" :class="colorClass">
    <!-- Plumbing Icon -->
    <svg
      v-if="category === 'plumbing'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    >
      <path d="M12 2v5"></path>
      <path d="M6 7h12"></path>
      <path d="M17 7v4"></path>
      <path d="M7 7v4"></path>
      <path d="M17 11a5 5 0 0 1-10 0"></path>
      <path d="M12 16v6"></path>
    </svg>

    <!-- Electrical Icon -->
    <svg
      v-else-if="category === 'electrical'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    >
      <path d="M14.5 6.5l-5 5.5"></path>
      <path d="M18 2l-4 4"></path>
      <path d="M10 10l-4 4"></path>
      <path d="M2 18l4-4"></path>
      <path d="M14 18l4-4"></path>
      <path d="M18 14l4-4"></path>
    </svg>

    <!-- Painting Icon -->
    <svg
      v-else-if="category === 'painting'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    >
      <path
        d="M19 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"
      ></path>
      <path d="M12 22V2"></path>
      <path d="M2 12h20"></path>
      <path d="M7 12a5 5 0 0 0 0-5"></path>
      <path d="M17 7a5 5 0 0 1 0 5"></path>
    </svg>

    <!-- Gardening Icon -->
    <svg
      v-else-if="category === 'gardening'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    >
      <path d="M12 22a9 9 0 0 0 9-9"></path>
      <path d="M3 13a9 9 0 0 1 9-9"></path>
      <path d="M12 12h.01"></path>
      <path d="M12 9a3 3 0 0 0-3 3v10"></path>
      <path
        d="M9 13c-2.148.625-4 2.331-4 3.5C5 18.433 8 20 12 20s7-1.567 7-3.5c0-1.169-1.852-2.875-4-3.5"
      ></path>
    </svg>

    <!-- Cleaning Icon -->
    <svg
      v-else-if="category === 'cleaning'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    >
      <path d="M3 5v14"></path>
      <path d="M21 5v14"></path>
      <path d="M3 5h18"></path>
      <path d="M3 19h18"></path>
      <path d="m9 5 1 14"></path>
      <path d="m14 5-1 14"></path>
    </svg>

    <!-- Contractor Icon -->
    <svg
      v-else-if="category === 'contractor'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    >
      <path d="M2 20h20"></path>
      <path d="M5 20v-4a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v4"></path>
      <path d="M12 3v4"></path>
      <path d="M10 7h4"></path>
    </svg>

    <!-- Carpentry Icon -->
    <svg
      v-else-if="category === 'carpentry'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    >
      <path d="m18 6-3-3H7L4 6"></path>
      <path d="M4 6v4"></path>
      <path d="M18 6v4"></path>
      <path d="M4 10h14"></path>
      <path d="M4 10v8h16v-8Z"></path>
    </svg>

    <!-- AC Repair Icon -->
    <svg
      v-else-if="category === 'ac_repair'"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    >
      <path
        d="M4 10a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v4a6 6 0 0 1-6 6H10a6 6 0 0 1-6-6v-4z"
      ></path>
      <path
        d="M8 10a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-4z"
      ></path>
      <path d="M12 4v16"></path>
      <path d="M4 12h16"></path>
    </svg>

    <!-- Default Icon -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-full h-full"
    >
      <path
        d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"
      ></path>
      <path d="M12 8v4"></path>
      <path d="M12 16h.01"></path>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  category: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: 'md',
  },
  colorScheme: {
    type: String,
    default: 'blue',
  },
});

// Color classes based on the color scheme
const colorClass = computed(() => {
  const colorSchemes = {
    blue: 'text-blue-500 bg-blue-100',
    green: 'text-green-500 bg-green-100',
    red: 'text-red-500 bg-red-100',
    yellow: 'text-yellow-500 bg-yellow-100',
    purple: 'text-purple-500 bg-purple-100',
    indigo: 'text-indigo-500 bg-indigo-100',
    pink: 'text-pink-500 bg-pink-100',
    teal: 'text-teal-500 bg-teal-100',
  };

  return colorSchemes[props.colorScheme] || colorSchemes.blue;
});
</script>

<style scoped>
.service-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 1.5rem;
  width: 100%;
  height: 100%;
  aspect-ratio: 1 / 1;
  transition: all 0.3s ease;
}

.service-icon:hover {
  transform: scale(1.05);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>
