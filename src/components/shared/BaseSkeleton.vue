<template>
  <div :class="containerClasses">
    <!-- Card Layout -->
    <div v-if="layout === 'card'" class="card-skeleton">
      <div class="flex items-start space-x-4">
        <!-- Avatar -->
        <div v-if="showAvatar" :class="avatarClasses"></div>

        <!-- Content -->
        <div class="flex-1 space-y-2">
          <!-- Title -->
          <div v-if="showTitle" :class="titleClasses"></div>

          <!-- Subtitle -->
          <div v-if="showSubtitle" :class="subtitleClasses"></div>

          <!-- Description lines -->
          <div v-if="descriptionLines > 0" class="space-y-2">
            <div
              v-for="(line, index) in descriptionLines"
              :key="index"
              :class="getDescriptionLineClasses(index)"
            ></div>
          </div>
        </div>

        <!-- Action button -->
        <div v-if="showAction" :class="actionClasses"></div>
      </div>

      <!-- Footer elements -->
      <div v-if="footerElements > 0" class="flex space-x-2 mt-4">
        <div
          v-for="element in footerElements"
          :key="element"
          :class="footerElementClasses"
        ></div>
      </div>
    </div>

    <!-- List Layout -->
    <div v-else-if="layout === 'list'" class="list-skeleton">
      <div class="flex items-center space-x-3">
        <div v-if="showAvatar" :class="listAvatarClasses"></div>
        <div class="flex-1 space-y-1">
          <div :class="listTitleClasses"></div>
          <div v-if="showSubtitle" :class="listSubtitleClasses"></div>
        </div>
        <div v-if="showAction" :class="listActionClasses"></div>
      </div>
    </div>

    <!-- Grid Layout -->
    <div v-else-if="layout === 'grid'" class="grid-skeleton">
      <div class="space-y-3">
        <div v-if="showAvatar" :class="gridImageClasses"></div>
        <div class="space-y-2">
          <div :class="gridTitleClasses"></div>
          <div v-if="showSubtitle" :class="gridSubtitleClasses"></div>
        </div>
      </div>
    </div>

    <!-- Custom Layout -->
    <div v-else-if="layout === 'custom'" class="custom-skeleton">
      <slot name="skeleton">
        <!-- Default custom skeleton -->
        <div class="space-y-3">
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </slot>
    </div>

    <!-- Category Layout -->
    <div
      v-else-if="layout === 'category'"
      class="category-skeleton relative overflow-hidden rounded-xl shadow-md bg-muted/50 dark:bg-neutral-800/50"
    >
      <!-- Animated background for skeleton loading effect -->
      <div
        class="absolute inset-0 bg-muted/70 dark:bg-neutral-700/70 animate-pulse"
      ></div>

      <!-- Skeleton content -->
      <div
        class="relative z-10 p-5 flex flex-col items-center justify-end h-full"
      >
        <!-- Badge skeleton -->
        <div
          class="w-16 h-5 bg-muted dark:bg-neutral-600 rounded-full mb-2"
        ></div>

        <!-- Title skeleton -->
        <div class="w-24 h-6 bg-muted dark:bg-neutral-600 rounded"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  layout: {
    type: String,
    default: 'card',
    validator: (value) =>
      ['card', 'list', 'grid', 'custom', 'category'].includes(value),
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  showAvatar: {
    type: Boolean,
    default: true,
  },
  showTitle: {
    type: Boolean,
    default: true,
  },
  showSubtitle: {
    type: Boolean,
    default: true,
  },
  showAction: {
    type: Boolean,
    default: false,
  },
  descriptionLines: {
    type: Number,
    default: 2,
  },
  footerElements: {
    type: Number,
    default: 0,
  },
  animated: {
    type: Boolean,
    default: true,
  },
});

// Computed classes
const containerClasses = computed(() => {
  return [
    'base-skeleton',
    props.animated ? 'animate-pulse' : '',
    `skeleton-${props.size}`,
  ]
    .filter(Boolean)
    .join(' ');
});

const baseSkeletonClass = 'bg-gray-200 dark:bg-gray-700 rounded';

// Card layout classes
const avatarClasses = computed(() => {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  return `${baseSkeletonClass} ${sizes[props.size]}`;
});

const titleClasses = computed(() => {
  const heights = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-5',
  };
  return `${baseSkeletonClass} ${heights[props.size]} w-3/4`;
});

const subtitleClasses = computed(() => {
  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };
  return `${baseSkeletonClass} ${heights[props.size]} w-1/2`;
});

const actionClasses = computed(() => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };
  return `${baseSkeletonClass} ${sizes[props.size]}`;
});

const footerElementClasses = computed(() => {
  const heights = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  };
  return `${baseSkeletonClass} ${heights[props.size]} w-12`;
});

// List layout classes
const listAvatarClasses = computed(() => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  return `${baseSkeletonClass} ${sizes[props.size]} rounded-full`;
});

const listTitleClasses = computed(() => {
  return `${baseSkeletonClass} h-4 w-32`;
});

const listSubtitleClasses = computed(() => {
  return `${baseSkeletonClass} h-3 w-24`;
});

const listActionClasses = computed(() => {
  return `${baseSkeletonClass} h-6 w-16`;
});

// Grid layout classes
const gridImageClasses = computed(() => {
  const heights = {
    sm: 'h-24',
    md: 'h-32',
    lg: 'h-40',
  };
  return `${baseSkeletonClass} w-full ${heights[props.size]}`;
});

const gridTitleClasses = computed(() => {
  return `${baseSkeletonClass} h-4 w-full`;
});

const gridSubtitleClasses = computed(() => {
  return `${baseSkeletonClass} h-3 w-3/4`;
});

// Methods
const getDescriptionLineClasses = (index) => {
  const isLast = index === props.descriptionLines - 1;
  const width = isLast ? 'w-2/3' : 'w-full';
  return `${baseSkeletonClass} h-3 ${width}`;
};
</script>

<style scoped>
.base-skeleton {
  width: 100%;
}

.skeleton-sm {
  padding: 0.75rem;
}

.skeleton-md {
  padding: 1rem;
}

.skeleton-lg {
  padding: 1.5rem;
}

.card-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.list-skeleton {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.grid-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.custom-skeleton {
  padding: 1rem;
}

.category-skeleton {
  aspect-ratio: 1 / 1;
  /* Remove flex properties that might interfere with grid layout */
  /* The parent grid container will handle the layout */
}

/* Pulse animation override for better performance */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
