<template>
  <div
    class="relative bg-white rounded-xl p-4 border-2 transition-all duration-200 cursor-pointer group"
    :class="[
      selected
        ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
        : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:transform hover:scale-102',
      `hover:border-${skill.color}-300`,
    ]"
    @click="$emit('click')"
  >
    <!-- Selection Indicator -->
    <div
      v-if="selected"
      class="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg"
    >
      <svg
        class="w-4 h-4 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M5 13l4 4L19 7"
        />
      </svg>
    </div>

    <!-- Content -->
    <div class="text-center space-y-3">
      <!-- Icon -->
      <div
        class="w-12 h-12 mx-auto rounded-lg flex items-center justify-center transition-colors"
        :class="[
          selected
            ? `bg-${skill.color}-100`
            : `bg-gray-100 group-hover:bg-${skill.color}-50`,
        ]"
      >
        <span class="text-2xl">{{ skill.icon }}</span>
      </div>

      <!-- Skill Name -->
      <div>
        <h3
          class="font-semibold transition-colors"
          :class="[
            selected
              ? `text-${skill.color}-700`
              : `text-gray-900 group-hover:text-${skill.color}-700`,
          ]"
        >
          {{ skill.name }}
        </h3>

        <!-- Description -->
        <p
          class="text-xs mt-1 transition-colors"
          :class="[
            selected
              ? `text-${skill.color}-600`
              : `text-gray-500 group-hover:text-${skill.color}-600`,
          ]"
        >
          {{ skill.description }}
        </p>
      </div>

      <!-- Job Count -->
      <div class="flex items-center justify-center space-x-1">
        <svg
          class="w-3 h-3 transition-colors"
          :class="[
            selected
              ? `text-${skill.color}-500`
              : `text-gray-400 group-hover:text-${skill.color}-500`,
          ]"
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
        <span
          class="text-xs font-medium transition-colors"
          :class="[
            selected
              ? `text-${skill.color}-600`
              : `text-gray-500 group-hover:text-${skill.color}-600`,
          ]"
        >
          {{ skill.jobCount }} job{{ skill.jobCount !== 1 ? 's' : '' }}
        </span>
      </div>
    </div>

    <!-- Hover Effect Overlay -->
    <div
      class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
      :class="`bg-${skill.color}-500`"
    ></div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  skill: {
    type: Object,
    required: true,
  },
  selected: {
    type: Boolean,
    default: false,
  },
});

// Emits
defineEmits(['click']);
</script>

<style scoped>
/* Custom color classes for different skills */
.border-blue-300 {
  border-color: #93c5fd;
}
.border-yellow-300 {
  border-color: #fcd34d;
}
.border-purple-300 {
  border-color: #c4b5fd;
}
.border-amber-300 {
  border-color: #fcd34d;
}
.border-green-300 {
  border-color: #86efac;
}
.border-cyan-300 {
  border-color: #67e8f9;
}
.border-red-300 {
  border-color: #fca5a5;
}
.border-gray-300 {
  border-color: #d1d5db;
}

.bg-blue-50 {
  background-color: #eff6ff;
}
.bg-blue-100 {
  background-color: #dbeafe;
}
.bg-yellow-50 {
  background-color: #fefce8;
}
.bg-yellow-100 {
  background-color: #fef3c7;
}
.bg-purple-50 {
  background-color: #faf5ff;
}
.bg-purple-100 {
  background-color: #e9d5ff;
}
.bg-amber-50 {
  background-color: #fffbeb;
}
.bg-amber-100 {
  background-color: #fef3c7;
}
.bg-green-50 {
  background-color: #f0fdf4;
}
.bg-green-100 {
  background-color: #dcfce7;
}
.bg-cyan-50 {
  background-color: #ecfeff;
}
.bg-cyan-100 {
  background-color: #cffafe;
}
.bg-red-50 {
  background-color: #fef2f2;
}
.bg-red-100 {
  background-color: #fee2e2;
}
.bg-gray-50 {
  background-color: #f9fafb;
}
.bg-gray-100 {
  background-color: #f3f4f6;
}

.text-blue-700 {
  color: #1d4ed8;
}
.text-blue-600 {
  color: #2563eb;
}
.text-blue-500 {
  color: #3b82f6;
}
.text-yellow-700 {
  color: #a16207;
}
.text-yellow-600 {
  color: #ca8a04;
}
.text-yellow-500 {
  color: #eab308;
}
.text-purple-700 {
  color: #7c3aed;
}
.text-purple-600 {
  color: #9333ea;
}
.text-purple-500 {
  color: #a855f7;
}
.text-amber-700 {
  color: #a16207;
}
.text-amber-600 {
  color: #d97706;
}
.text-amber-500 {
  color: #f59e0b;
}
.text-green-700 {
  color: #15803d;
}
.text-green-600 {
  color: #16a34a;
}
.text-green-500 {
  color: #22c55e;
}
.text-cyan-700 {
  color: #0e7490;
}
.text-cyan-600 {
  color: #0891b2;
}
.text-cyan-500 {
  color: #06b6d4;
}
.text-red-700 {
  color: #b91c1c;
}
.text-red-600 {
  color: #dc2626;
}
.text-red-500 {
  color: #ef4444;
}
.text-gray-700 {
  color: #374151;
}
.text-gray-600 {
  color: #4b5563;
}
.text-gray-500 {
  color: #6b7280;
}

.bg-blue-500 {
  background-color: #3b82f6;
}
.bg-yellow-500 {
  background-color: #eab308;
}
.bg-purple-500 {
  background-color: #a855f7;
}
.bg-amber-500 {
  background-color: #f59e0b;
}
.bg-green-500 {
  background-color: #22c55e;
}
.bg-cyan-500 {
  background-color: #06b6d4;
}
.bg-red-500 {
  background-color: #ef4444;
}
.bg-gray-500 {
  background-color: #6b7280;
}

/* Smooth transitions */
.transform {
  transition: transform 0.2s ease-in-out;
}

.scale-102 {
  transform: scale(1.02);
}

.scale-105 {
  transform: scale(1.05);
}

/* Ensure proper hover states */
.group:hover .group-hover\:bg-blue-50 {
  background-color: #eff6ff;
}
.group:hover .group-hover\:bg-yellow-50 {
  background-color: #fefce8;
}
.group:hover .group-hover\:bg-purple-50 {
  background-color: #faf5ff;
}
.group:hover .group-hover\:bg-amber-50 {
  background-color: #fffbeb;
}
.group:hover .group-hover\:bg-green-50 {
  background-color: #f0fdf4;
}
.group:hover .group-hover\:bg-cyan-50 {
  background-color: #ecfeff;
}
.group:hover .group-hover\:bg-red-50 {
  background-color: #fef2f2;
}
.group:hover .group-hover\:bg-gray-50 {
  background-color: #f9fafb;
}

.group:hover .group-hover\:text-blue-700 {
  color: #1d4ed8;
}
.group:hover .group-hover\:text-yellow-700 {
  color: #a16207;
}
.group:hover .group-hover\:text-purple-700 {
  color: #7c3aed;
}
.group:hover .group-hover\:text-amber-700 {
  color: #a16207;
}
.group:hover .group-hover\:text-green-700 {
  color: #15803d;
}
.group:hover .group-hover\:text-cyan-700 {
  color: #0e7490;
}
.group:hover .group-hover\:text-red-700 {
  color: #b91c1c;
}
.group:hover .group-hover\:text-gray-700 {
  color: #374151;
}

.group:hover .group-hover\:text-blue-600 {
  color: #2563eb;
}
.group:hover .group-hover\:text-yellow-600 {
  color: #ca8a04;
}
.group:hover .group-hover\:text-purple-600 {
  color: #9333ea;
}
.group:hover .group-hover\:text-amber-600 {
  color: #d97706;
}
.group:hover .group-hover\:text-green-600 {
  color: #16a34a;
}
.group:hover .group-hover\:text-cyan-600 {
  color: #0891b2;
}
.group:hover .group-hover\:text-red-600 {
  color: #dc2626;
}
.group:hover .group-hover\:text-gray-600 {
  color: #4b5563;
}

.group:hover .group-hover\:text-blue-500 {
  color: #3b82f6;
}
.group:hover .group-hover\:text-yellow-500 {
  color: #eab308;
}
.group:hover .group-hover\:text-purple-500 {
  color: #a855f7;
}
.group:hover .group-hover\:text-amber-500 {
  color: #f59e0b;
}
.group:hover .group-hover\:text-green-500 {
  color: #22c55e;
}
.group:hover .group-hover\:text-cyan-500 {
  color: #06b6d4;
}
.group:hover .group-hover\:text-red-500 {
  color: #ef4444;
}
.group:hover .group-hover\:text-gray-500 {
  color: #6b7280;
}
</style>
