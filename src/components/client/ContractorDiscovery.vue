<template>
  <div class="contractor-discovery">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-foreground">
          {{ $t('contractorDiscovery.findContractors') }}
        </h2>
        <p class="text-muted-foreground mt-1">
          {{ $t('contractorDiscovery.discoverAndInvite') }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <!-- View Toggle -->
        <div class="flex bg-muted rounded-lg p-1">
          <button
            @click="viewMode = 'grid'"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              viewMode === 'grid'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            <Grid3X3 class="w-4 h-4" />
          </button>
          <button
            @click="viewMode = 'list'"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ]"
          >
            <List class="w-4 h-4" />
          </button>
        </div>

        <!-- Filters Button -->
        <Button variant="outline" @click="showFilters = !showFilters">
          <Filter class="w-4 h-4 mr-2" />
          {{ $t('common.filters') }}
          <Badge v-if="activeFiltersCount > 0" variant="secondary" class="ml-2">
            {{ activeFiltersCount }}
          </Badge>
        </Button>
      </div>
    </div>

    <!-- Filters Panel -->
    <Collapsible v-model:open="showFilters">
      <CollapsibleContent>
        <div class="bg-card border rounded-lg p-6 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Service Filter -->
            <div>
              <Label class="text-sm font-medium mb-2 block">
                {{ $t('contractorDiscovery.service') }}
              </Label>
              <Select v-model="filters.service">
                <SelectTrigger>
                  <SelectValue
                    :placeholder="$t('contractorDiscovery.selectService')"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{{ $t('common.all') }}</SelectItem>
                  <SelectItem
                    v-for="service in availableServices"
                    :key="service.id"
                    :value="service.id"
                  >
                    {{ service.name_en }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <!-- Location Filter -->
            <div>
              <Label class="text-sm font-medium mb-2 block">
                {{ $t('contractorDiscovery.location') }}
              </Label>
              <Input
                v-model="filters.location"
                :placeholder="$t('contractorDiscovery.enterLocation')"
              />
            </div>

            <!-- Rating Filter -->
            <div>
              <Label class="text-sm font-medium mb-2 block">
                {{ $t('contractorDiscovery.minimumRating') }}
              </Label>
              <Select v-model="filters.minRating">
                <SelectTrigger>
                  <SelectValue
                    :placeholder="$t('contractorDiscovery.anyRating')"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{{
                    $t('contractorDiscovery.anyRating')
                  }}</SelectItem>
                  <SelectItem value="4"
                    >4+ {{ $t('contractorDiscovery.stars') }}</SelectItem
                  >
                  <SelectItem value="4.5"
                    >4.5+ {{ $t('contractorDiscovery.stars') }}</SelectItem
                  >
                  <SelectItem value="4.8"
                    >4.8+ {{ $t('contractorDiscovery.stars') }}</SelectItem
                  >
                </SelectContent>
              </Select>
            </div>

            <!-- Availability Filter -->
            <div>
              <Label class="text-sm font-medium mb-2 block">
                {{ $t('contractorDiscovery.availability') }}
              </Label>
              <Select v-model="filters.availability">
                <SelectTrigger>
                  <SelectValue
                    :placeholder="$t('contractorDiscovery.anyTime')"
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{{
                    $t('contractorDiscovery.anyTime')
                  }}</SelectItem>
                  <SelectItem value="today">{{
                    $t('contractorDiscovery.today')
                  }}</SelectItem>
                  <SelectItem value="this_week">{{
                    $t('contractorDiscovery.thisWeek')
                  }}</SelectItem>
                  <SelectItem value="this_month">{{
                    $t('contractorDiscovery.thisMonth')
                  }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Advanced Filters -->
          <div class="mt-4 pt-4 border-t border-border">
            <div class="flex items-center gap-4">
              <div class="flex items-center space-x-2">
                <Checkbox
                  id="verified-only"
                  v-model:checked="filters.verifiedOnly"
                />
                <Label for="verified-only" class="text-sm">
                  {{ $t('contractorDiscovery.verifiedOnly') }}
                </Label>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox
                  id="online-only"
                  v-model:checked="filters.onlineOnly"
                />
                <Label for="online-only" class="text-sm">
                  {{ $t('contractorDiscovery.onlineOnly') }}
                </Label>
              </div>
              <div class="flex items-center space-x-2">
                <Checkbox
                  id="has-portfolio"
                  v-model:checked="filters.hasPortfolio"
                />
                <Label for="has-portfolio" class="text-sm">
                  {{ $t('contractorDiscovery.hasPortfolio') }}
                </Label>
              </div>
            </div>
          </div>

          <!-- Filter Actions -->
          <div
            class="flex items-center justify-between mt-4 pt-4 border-t border-border"
          >
            <Button variant="ghost" @click="clearFilters">
              {{ $t('common.clearAll') }}
            </Button>
            <div class="text-sm text-muted-foreground">
              {{ filteredContractors.length }}
              {{ $t('contractorDiscovery.contractorsFound') }}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>

    <!-- Sorting -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <Label class="text-sm font-medium">{{ $t('common.sortBy') }}:</Label>
        <Select v-model="sortBy">
          <SelectTrigger class="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">{{
              $t('contractorDiscovery.highestRated')
            }}</SelectItem>
            <SelectItem value="distance">{{
              $t('contractorDiscovery.nearest')
            }}</SelectItem>
            <SelectItem value="price">{{
              $t('contractorDiscovery.lowestPrice')
            }}</SelectItem>
            <SelectItem value="reviews">{{
              $t('contractorDiscovery.mostReviews')
            }}</SelectItem>
            <SelectItem value="recent">{{
              $t('contractorDiscovery.recentlyActive')
            }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Bulk Actions -->
      <div
        v-if="selectedContractors.length > 0"
        class="flex items-center gap-2"
      >
        <span class="text-sm text-muted-foreground">
          {{ selectedContractors.length }}
          {{ $t('contractorDiscovery.selected') }}
        </span>
        <Button variant="outline" size="sm" @click="inviteSelected">
          <UserPlus class="w-4 h-4 mr-2" />
          {{ $t('contractorDiscovery.inviteSelected') }}
        </Button>
        <Button variant="outline" size="sm" @click="addToFavorites">
          <Heart class="w-4 h-4 mr-2" />
          {{ $t('contractorDiscovery.addToFavorites') }}
        </Button>
      </div>
    </div>

    <!-- Contractors Grid/List -->
    <div class="contractors-container">
      <!-- Loading State -->
      <div v-if="isLoading" class="space-y-4">
        <div v-for="i in 6" :key="i" class="animate-pulse">
          <div class="bg-muted h-48 rounded-lg"></div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredContractors.length === 0"
        class="text-center py-12"
      >
        <div
          class="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4"
        >
          <Users class="w-12 h-12 text-muted-foreground" />
        </div>
        <h3 class="text-lg font-semibold text-foreground mb-2">
          {{ $t('contractorDiscovery.noContractorsFound') }}
        </h3>
        <p class="text-muted-foreground mb-6">
          {{ $t('contractorDiscovery.tryAdjustingFilters') }}
        </p>
        <Button @click="clearFilters">
          {{ $t('contractorDiscovery.clearFilters') }}
        </Button>
      </div>

      <!-- Contractors List -->
      <div
        v-else
        :class="[
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4',
        ]"
      >
        <ContractorDiscoveryCard
          v-for="contractor in paginatedContractors"
          :key="contractor.id"
          :contractor="contractor"
          :view-mode="viewMode"
          :is-selected="selectedContractors.includes(contractor.id)"
          :is-favorited="favoritedContractors.includes(contractor.id)"
          @select="toggleContractorSelection"
          @favorite="toggleContractorFavorite"
          @invite="inviteContractor"
          @view-profile="viewContractorProfile"
          @start-chat="startChat"
        />
      </div>

      <!-- Load More -->
      <div v-if="hasMoreContractors" class="text-center mt-8">
        <Button
          variant="outline"
          @click="loadMoreContractors"
          :disabled="isLoadingMore"
        >
          <div
            v-if="isLoadingMore"
            class="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full"
          ></div>
          {{ isLoadingMore ? $t('common.loading') : $t('common.loadMore') }}
        </Button>
      </div>
    </div>

    <!-- Invite Modal -->
    <InviteContractorModal
      v-if="showInviteModal"
      :contractors="contractorsToInvite"
      :available-jobs="userJobs"
      @close="showInviteModal = false"
      @invite-sent="handleInviteSent"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Grid3X3, List, Filter, Users, UserPlus, Heart } from 'lucide-vue-next';
import ContractorDiscoveryCard from './ContractorDiscoveryCard.vue';
import InviteContractorModal from './InviteContractorModal.vue';

const { t } = useI18n();
const router = useRouter();

// Component state
const viewMode = ref('grid');
const showFilters = ref(false);
const sortBy = ref('rating');
const isLoading = ref(false);
const isLoadingMore = ref(false);
const hasMoreContractors = ref(true);
const showInviteModal = ref(false);
const contractorsToInvite = ref([]);

// Filters
const filters = ref({
  service: '',
  location: '',
  minRating: '',
  availability: '',
  verifiedOnly: false,
  onlineOnly: false,
  hasPortfolio: false,
});

// Selection state
const selectedContractors = ref([]);
const favoritedContractors = ref([]);

// Data
const contractors = ref([]);
const availableServices = ref([]);
const userJobs = ref([]);
const currentPage = ref(1);
const itemsPerPage = 12;

// Computed properties
const activeFiltersCount = computed(() => {
  let count = 0;
  if (filters.value.service) count++;
  if (filters.value.location) count++;
  if (filters.value.minRating) count++;
  if (filters.value.availability) count++;
  if (filters.value.verifiedOnly) count++;
  if (filters.value.onlineOnly) count++;
  if (filters.value.hasPortfolio) count++;
  return count;
});

const filteredContractors = computed(() => {
  let filtered = [...contractors.value];

  // Apply filters
  if (filters.value.service) {
    filtered = filtered.filter((contractor) =>
      contractor.services?.includes(filters.value.service)
    );
  }

  if (filters.value.location) {
    filtered = filtered.filter((contractor) =>
      contractor.location
        ?.toLowerCase()
        .includes(filters.value.location.toLowerCase())
    );
  }

  if (filters.value.minRating) {
    const minRating = parseFloat(filters.value.minRating);
    filtered = filtered.filter((contractor) => contractor.rating >= minRating);
  }

  if (filters.value.availability) {
    filtered = filtered.filter(
      (contractor) => contractor.availability === filters.value.availability
    );
  }

  if (filters.value.verifiedOnly) {
    filtered = filtered.filter((contractor) => contractor.verified);
  }

  if (filters.value.onlineOnly) {
    filtered = filtered.filter((contractor) => contractor.is_online);
  }

  if (filters.value.hasPortfolio) {
    filtered = filtered.filter(
      (contractor) => contractor.portfolio && contractor.portfolio.length > 0
    );
  }

  // Apply sorting
  switch (sortBy.value) {
    case 'rating':
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'distance':
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      break;
    case 'price':
      filtered.sort((a, b) => (a.hourly_rate || 0) - (b.hourly_rate || 0));
      break;
    case 'reviews':
      filtered.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
      break;
    case 'recent':
      filtered.sort(
        (a, b) => new Date(b.last_active) - new Date(a.last_active)
      );
      break;
  }

  return filtered;
});

const paginatedContractors = computed(() => {
  const start = 0;
  const end = currentPage.value * itemsPerPage;
  return filteredContractors.value.slice(start, end);
});

// Methods
const toggleContractorSelection = (contractorId) => {
  const index = selectedContractors.value.indexOf(contractorId);
  if (index > -1) {
    selectedContractors.value.splice(index, 1);
  } else {
    selectedContractors.value.push(contractorId);
  }
};

const toggleContractorFavorite = (contractorId) => {
  const index = favoritedContractors.value.indexOf(contractorId);
  if (index > -1) {
    favoritedContractors.value.splice(index, 1);
  } else {
    favoritedContractors.value.push(contractorId);
  }
  // TODO: Persist to backend
};

const inviteContractor = (contractor) => {
  contractorsToInvite.value = [contractor];
  showInviteModal.value = true;
};

const inviteSelected = () => {
  const contractors = selectedContractors.value
    .map((id) => contractors.value.find((c) => c.id === id))
    .filter(Boolean);
  contractorsToInvite.value = contractors;
  showInviteModal.value = true;
};

const addToFavorites = () => {
  selectedContractors.value.forEach((contractorId) => {
    if (!favoritedContractors.value.includes(contractorId)) {
      favoritedContractors.value.push(contractorId);
    }
  });
  selectedContractors.value = [];
  // TODO: Persist to backend
};

const viewContractorProfile = (contractor) => {
  router.push(`/contractors/${contractor.id}`);
};

const startChat = async (contractor) => {
  // TODO: Implement chat functionality
  console.log('Starting chat with contractor:', contractor.id);
};

const clearFilters = () => {
  filters.value = {
    service: '',
    location: '',
    minRating: '',
    availability: '',
    verifiedOnly: false,
    onlineOnly: false,
    hasPortfolio: false,
  };
};

const loadMoreContractors = () => {
  if (hasMoreContractors.value && !isLoadingMore.value) {
    isLoadingMore.value = true;
    currentPage.value++;

    // Simulate loading delay
    setTimeout(() => {
      isLoadingMore.value = false;
      // Check if we've reached the end
      if (
        paginatedContractors.value.length >= filteredContractors.value.length
      ) {
        hasMoreContractors.value = false;
      }
    }, 1000);
  }
};

const handleInviteSent = (result) => {
  showInviteModal.value = false;
  contractorsToInvite.value = [];
  selectedContractors.value = [];
  console.log('Invitations sent:', result);
};

// Lifecycle
onMounted(async () => {
  isLoading.value = true;
  try {
    // TODO: Load contractors, services, and user jobs from API
    await Promise.all([loadContractors(), loadServices(), loadUserJobs()]);
  } finally {
    isLoading.value = false;
  }
});

const loadContractors = async () => {
  // Mock data - replace with actual API call
  contractors.value = [
    {
      id: 1,
      name: 'John Smith',
      avatar_url: '/images/contractor-default.svg',
      rating: 4.8,
      review_count: 127,
      services: ['plumbing', 'electrical'],
      location: 'Lima, Peru',
      hourly_rate: 50,
      verified: true,
      is_online: true,
      portfolio: ['image1.jpg', 'image2.jpg'],
      last_active: new Date().toISOString(),
      distance: 2.5,
    },
    // Add more mock contractors...
  ];
};

const loadServices = async () => {
  // Mock data - replace with actual API call
  availableServices.value = [
    { id: 'plumbing', name_en: 'Plumbing' },
    { id: 'electrical', name_en: 'Electrical' },
    { id: 'painting', name_en: 'Painting' },
  ];
};

const loadUserJobs = async () => {
  // Mock data - replace with actual API call
  userJobs.value = [
    { id: 1, title: 'Bathroom Repair', status: 'open' },
    { id: 2, title: 'Kitchen Renovation', status: 'open' },
  ];
};

// Watch for filter changes to reset pagination
watch(
  filters,
  () => {
    currentPage.value = 1;
    hasMoreContractors.value = true;
  },
  { deep: true }
);
</script>

<style scoped>
.contractors-container {
  min-height: 400px;
}
</style>
