<template>
  <div class="w-full">
    <!-- Section Header -->
    <div class="mb-6">
      <h3 class="text-xl font-semibold text-foreground mb-2">Portfolio</h3>
      <p class="text-sm text-muted-foreground">
        Recent work and completed projects
      </p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <div
        class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
      ></div>
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!workItems || workItems.length === 0"
      class="text-center py-12"
    >
      <div class="text-muted-foreground">
        <svg
          class="mx-auto h-12 w-12 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p class="text-sm">No portfolio items available</p>
      </div>
    </div>

    <!-- Work Showcase Carousel -->
    <div v-else class="relative">
      <Carousel
        class="w-full"
        :opts="{
          align: 'start',
          loop: true,
        }"
        @init-api="setApi"
      >
        <CarouselContent class="-ml-2 md:-ml-4">
          <CarouselItem
            v-for="(item, index) in workItems"
            :key="index"
            class="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3"
          >
            <Card
              class="overflow-hidden group transition-all duration-300 bg-transparent border border-gray-100 dark:border-gray-800"
            >
              <!-- Image Container -->
              <div class="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.description"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  @error="handleImageError"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50"
                >
                  <svg
                    class="h-12 w-12 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              <!-- Simple Description -->
              <CardContent class="p-3">
                <p
                  class="text-sm text-muted-foreground line-clamp-2 leading-relaxed"
                >
                  {{ item.description }}
                </p>
              </CardContent>
            </Card>
          </CarouselItem>
        </CarouselContent>

        <!-- Navigation Buttons -->
        <CarouselPrevious
          class="left-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background"
        />
        <CarouselNext
          class="right-2 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-background"
        />
      </Carousel>

      <!-- Dots Indicator -->
      <div class="flex justify-center mt-4 space-x-2">
        <button
          v-for="(item, index) in workItems"
          :key="index"
          class="w-2 h-2 rounded-full transition-all duration-200"
          :class="
            currentSlide === index ? 'bg-primary' : 'bg-muted-foreground/30'
          "
          @click="goToSlide(index)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/composables/useAuth';

const props = defineProps({
  contractorId: {
    type: String,
    required: true,
  },
});

const { getSupabaseClient } = useAuth();
const supabase = getSupabaseClient();

const workItems = ref([]);
const isLoading = ref(true);
const currentSlide = ref(0);
const carouselApi = ref(null);

onMounted(async () => {
  await loadWorkItems();
});

const loadWorkItems = async () => {
  try {
    isLoading.value = true;

    console.log('Loading work items for contractor:', props.contractorId);

    const { data, error } = await supabase
      .from('contractor_work_portfolio')
      .select('*')
      .eq('contractor_id', props.contractorId)
      .order('completed_date', { ascending: false });

    if (error) {
      console.error('Error fetching work portfolio:', error);
      workItems.value = [];
    } else {
      console.log('Fetched work items:', data);
      // Transform the data to match our component's expected format
      workItems.value = data.map((item) => ({
        id: item.id,
        description: item.description,
        image: item.image_url,
      }));
    }
  } catch (error) {
    console.error('Error loading work items:', error);
    workItems.value = [];
  } finally {
    isLoading.value = false;
  }
};

const handleImageError = (event) => {
  // Hide broken image and show placeholder
  event.target.style.display = 'none';
};

const goToSlide = (index) => {
  if (carouselApi.value) {
    carouselApi.value.scrollTo(index);
  }
};

// Track current slide for dots indicator
const setApi = (api) => {
  carouselApi.value = api;
  if (api) {
    api.on('select', () => {
      currentSlide.value = api.selectedScrollSnap();
    });
  }
};
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
