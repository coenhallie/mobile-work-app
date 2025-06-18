import { ref, onMounted, onUnmounted, nextTick } from 'vue';

export function useInfiniteScroll(options = {}) {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    loadMore,
    hasMore = ref(true),
    isLoading = ref(false),
  } = options;

  // Refs
  const triggerElement = ref(null);
  const observer = ref(null);
  const isIntersecting = ref(false);

  // Setup intersection observer
  const setupObserver = () => {
    if (!triggerElement.value || !window.IntersectionObserver) {
      return;
    }

    observer.value = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isIntersecting.value = entry.isIntersecting;

        if (
          entry.isIntersecting &&
          hasMore.value &&
          !isLoading.value &&
          loadMore
        ) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.value.observe(triggerElement.value);
  };

  // Cleanup observer
  const cleanup = () => {
    if (observer.value) {
      observer.value.disconnect();
      observer.value = null;
    }
  };

  // Reconnect observer (useful when trigger element changes)
  const reconnect = async () => {
    cleanup();
    await nextTick();
    setupObserver();
  };

  // Manual trigger for load more
  const triggerLoadMore = () => {
    if (hasMore.value && !isLoading.value && loadMore) {
      loadMore();
    }
  };

  // Setup observer when trigger element is available
  const setTriggerElement = (element) => {
    triggerElement.value = element;
    if (element) {
      setupObserver();
    }
  };

  // Lifecycle
  onMounted(() => {
    if (triggerElement.value) {
      setupObserver();
    }
  });

  onUnmounted(() => {
    cleanup();
  });

  return {
    triggerElement,
    isIntersecting,
    setTriggerElement,
    reconnect,
    triggerLoadMore,
    cleanup,
  };
}
