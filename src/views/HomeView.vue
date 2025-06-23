<template>
  <div class="flex flex-col min-h-screen bg-white dark:bg-gray-900">
    <!-- Welcome Banner -->
    <div class="welcome-banner w-full text-foreground p-6 mb-3 rounded-xl">
      <div class="max-w-6xl mx-auto">
        <!-- Content -->
        <div>
          <div
            v-if="!isLoaded && !showFallbackContent"
            class="flex items-center space-x-2"
          >
            <div class="skeleton w-32 h-6 rounded bg-white/30"></div>
            <div class="skeleton w-24 h-4 rounded bg-white/30"></div>
          </div>
          <div
            v-else-if="isLoaded || showFallbackContent"
            class="animate-slide-up"
          >
            <div
              v-if="isSignedIn"
              class="flex align-middle items-center justify-between"
            >
              <h1
                class="text-3xl md:text-5xl font-normal mr-4 text-black dark:text-white"
              >
                <!-- Removed mb-1 for better vertical alignment -->
                {{ timeBasedGreeting }}, {{ profileName || 'User' }}!
              </h1>

              <!-- Profile thumbnail - Supabase -->
              <div class="profile-thumbnail-wrapper ml-4">
                <!-- Use getCachedBustedImageUrl from useProfileState -->
                <div
                  v-if="getCachedBustedImageUrl"
                  class="h-20 w-20 rounded-full hover:scale-110 transition-transform overflow-hidden cursor-pointer"
                  @click="navigateToUserProfile"
                >
                  <img
                    :src="getCachedBustedImageUrl"
                    alt="Profile"
                    class="w-full h-full object-cover"
                    @error="handleSupabaseImageError"
                  />
                </div>
                <!-- Otherwise fall back to a simple profile button -->
                <div
                  v-else
                  class="h-20 w-20 rounded-full bg-primary hover:scale-110 transition-transform cursor-pointer flex items-center justify-center text-white font-bold text-xl"
                  @click="navigateToUserProfile"
                >
                  {{
                    (profileName ||
                      user?.email?.split('@')[0] ||
                      'U')[0].toUpperCase()
                  }}
                </div>
              </div>
            </div>
            <h1 v-else class="text-3xl md:text-5xl font-normal mb-1">
              {{ $t('home.welcomeToApp') }}
            </h1>
          </div>
        </div>

        <!-- No search bar in header -->
      </div>
    </div>

    <!-- Main Content Area - Simplified Conditionals -->
    <div class="space-y-8">
      <!-- Default View: Search Interface for Non-Logged-In Users -->
      <div v-if="!isSignedIn" class="mb-8">
        <h2
          class="text-xl md:text-2xl font-normal mb-6 text-center text-foreground"
        >
          {{ $t('home.findProfessional') }}
        </h2>

        <div class="max-w-2xl mx-auto bg-card p-6 rounded-xl shadow-md">
          <form @submit.prevent="handleSearch" class="space-y-4">
            <!-- Search Field -->
            <div>
              <label
                for="search-query"
                class="block text-sm font-medium text-foreground mb-1"
              >
                {{ $t('home.describeIssue') }}
              </label>
              <Input
                id="search-query"
                v-model="searchQuery"
                :placeholder="$t('home.issuePlaceholder')"
                :error="searchQueryError"
              />
            </div>

            <!-- Zipcode Field -->
            <div>
              <label
                for="zipcode"
                class="block text-sm font-medium text-foreground mb-1"
              >
                {{ $t('home.yourZipcode') }}
              </label>
              <Input
                id="zipcode"
                v-model="zipcode"
                :placeholder="$t('home.zipcodePlaceholder')"
                :error="zipcodeError"
              />
            </div>

            <!-- Search Button -->
            <div class="pt-2">
              <Button type="submit" class="w-full" :disabled="isSearching">
                <span v-if="isSearching">{{ $t('home.searching') }}</span>
                <span v-else>{{ $t('home.findContractors') }}</span>
              </Button>
            </div>
          </form>
        </div>

        <!-- How It Works Section -->
        <div class="mt-12">
          <h3 class="text-lg font-normal mb-4 text-center text-foreground">
            {{ $t('home.howItWorks') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="text-center p-4">
              <div
                class="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <span class="text-primary font-bold">1</span>
              </div>
              <h4 class="font-medium mb-1 text-foreground">
                {{ $t('home.step1Title') }}
              </h4>
              <p class="text-sm text-muted-foreground">
                {{ $t('home.step1Description') }}
              </p>
            </div>
            <div class="text-center p-4">
              <div
                class="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <span class="text-primary font-bold">2</span>
              </div>
              <h4 class="font-medium mb-1 text-foreground">
                {{ $t('home.step2Title') }}
              </h4>
              <p class="text-sm text-muted-foreground">
                {{ $t('home.step2Description') }}
              </p>
            </div>
            <div class="text-center p-4">
              <div
                class="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              >
                <span class="text-primary font-bold">3</span>
              </div>
              <h4 class="font-medium mb-1 text-foreground">
                {{ $t('home.step3Title') }}
              </h4>
              <p class="text-sm text-muted-foreground">
                {{ $t('home.step3Description') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State: Show when user is signed in but role is not yet determined -->
      <div v-if="isSignedIn && !userRole" class="mb-8">
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"
            ></div>
            <div class="text-muted-foreground">Loading user profile...</div>
          </div>
        </div>
      </div>

      <!-- Client View: Enhanced Dashboard for Logged-In Clients -->
      <div v-else-if="isSignedIn && userRole === 'client'" class="mb-8">
        <ClientDashboard :user-id="userId" />
      </div>

      <!-- Contractor View: Enhanced Dashboard for Logged-In Contractors -->
      <div v-else-if="isSignedIn && userRole === 'contractor'" class="mb-8">
        <ContractorDashboard :user-id="userId" />
      </div>
    </div>
    <!-- Client Onboarding Modal -->
    <ClientOnboarding
      v-if="showClientOnboarding"
      :user-name="profileName || user?.email?.split('@')[0] || 'User'"
      @complete="handleOnboardingComplete"
      @skip="handleOnboardingSkip"
    />
  </div>
</template>

<script setup>
import { useAuth } from '../composables/useAuth';
import { useProfileState } from '../composables/useProfileState';
import { useI18n } from '../composables/useI18n';
import {
  computed,
  onMounted,
  onBeforeUnmount,
  onActivated,
  onDeactivated,
  watch,
  ref,
  nextTick,
  shallowRef,
} from 'vue';
import { useRouter } from 'vue-router';
import { useJobStore, JOB_STATUS } from '../stores/job';
import { useJobApplicationsStore } from '../stores/jobApplications';
import Button from '../components/ui/button/Button.vue';
import { Input } from '../components/ui/input';
import { analyzeCategoryWithLLM } from '@/lib/categoryAnalyzer';
import { formatDisplayName } from '@/lib/nameFormatter';
import ClientOnboarding from '../components/onboarding/ClientOnboarding.vue';
import ClientDashboard from '../components/client/ClientDashboard.vue';
import ContractorDashboard from '../components/contractors/ContractorDashboard.vue';
import { useSupabaseAuth } from '../composables/useSupabaseAuth';

const router = useRouter();
const auth = useAuth();
const jobStore = useJobStore();
const jobApplicationsStore = useJobApplicationsStore();
const { t } = useI18n();
const { getUserProfile } = useSupabaseAuth();

// Client onboarding state
const showClientOnboarding = ref(false);
const isCheckingOnboarding = ref(false);

// Dynamic greeting based on time of day
const timeBasedGreeting = computed(() => {
  const currentHour = new Date().getHours();

  if (currentHour >= 5 && currentHour < 12) {
    return t('home.goodMorning');
  } else if (currentHour >= 12 && currentHour < 17) {
    return t('home.goodAfternoon');
  } else if (currentHour >= 17 && currentHour < 21) {
    return t('home.goodEvening');
  } else {
    return t('home.goodNight');
  }
});

const {
  user,
  userId,
  isLoaded,
  isSignedIn,
  isAuthReady,
  isAuthenticated,
  userRole: authUserRoleGet,
  getToken,
  getSupabaseClient,
} = auth;

// Profile state composable
const {
  getCachedBustedImageUrl,
  profileName, // Use this directly for display
  updateProfileImage,
  updateProfileName,
} = useProfileState();

const isLoadingSupabaseProfile = ref(false);

// Refreshing states for smooth loading indicators
const refreshingUserJobs = ref(false);

// Dashboard state for interactive cards
const activeDashboardView = ref('all'); // 'all', 'active', 'applications', 'completed'

// Transition state for smooth fade effects
const isDashboardTransitioning = ref(false);
const jobApplicationsData = ref({});

const userJobs = computed(() => jobStore.userJobs);

// Dashboard stats for client view
const activeJobsCount = computed(() => {
  return userJobs.value.filter(
    (job) =>
      job.status === 'open' ||
      job.status === 'assigned' ||
      job.status === 'in_progress'
  ).length;
});

const completedJobsCount = computed(() => {
  return userJobs.value.filter((job) => job.status === 'completed').length;
});

const totalApplicationsCount = computed(() => {
  return userJobs.value.reduce((total, job) => {
    return total + (job.applicant_count || 0);
  }, 0);
});

// Computed properties for filtered jobs based on dashboard view
const filteredUserJobs = computed(() => {
  switch (activeDashboardView.value) {
    case 'active':
      return userJobs.value.filter(
        (job) =>
          job.status === 'open' ||
          job.status === 'assigned' ||
          job.status === 'in_progress'
      );
    case 'completed':
      return userJobs.value.filter((job) => job.status === 'completed');
    case 'applications':
      // For applications view, we'll show jobs with applications
      return userJobs.value.filter((job) => (job.applicant_count || 0) > 0);
    case 'all':
    default:
      return userJobs.value;
  }
});

// Dashboard view titles
const dashboardViewTitle = computed(() => {
  switch (activeDashboardView.value) {
    case 'active':
      return t('dashboard.activeJobs');
    case 'completed':
      return t('dashboard.completedJobs');
    case 'applications':
      return (
        t('jobs.title') +
        ' ' +
        t('common.with') +
        ' ' +
        t('dashboard.applications')
      );
    case 'all':
    default:
      return t('jobs.myJobs');
  }
});

// Check if we should show applications list instead of job list
const shouldShowApplicationsList = computed(() => {
  return activeDashboardView.value === 'applications';
});

const isLoadingOverall = computed(
  () => jobStore.isLoading || isLoadingSupabaseProfile.value
);

const shouldShowSkeleton = computed(() => {
  return isSignedIn.value && (!isAuthReady.value || isLoadingOverall.value);
});

const isContentReady = computed(() => {
  return isAuthReady.value && !isLoadingOverall.value;
});

const searchQuery = ref('');
const zipcode = ref('');
const searchQueryError = ref('');
const zipcodeError = ref('');
const isSearching = ref(false);
const showFallbackContent = ref(false);
const supabaseRef = shallowRef(null);

const userRole = computed(() => authUserRoleGet.value); // Use role from auth composable, no fallback

const initSupabase = async () => {
  try {
    if (isLoaded.value && !supabaseRef.value) {
      supabaseRef.value = await getSupabaseClient();
      if (supabaseRef.value) {
      } else {
      }
    }
  } catch (error) {
    console.error('[HomeView] Error initializing Supabase client:', error);
  }
};

const getSupabase = async () => {
  if (supabaseRef.value) return supabaseRef.value;
  try {
    const client = await getSupabaseClient(false); // Allow unauthenticated client for public data
    supabaseRef.value = client;
    return client;
  } catch (error) {
    console.error('[HomeView] Error getting Supabase client:', error);
    throw error;
  }
};

const placeholderImages = [
  'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1374&q=80',
];
const selectedImage = ref('');
const preloadImages = () => {
  placeholderImages.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
};

const userRoleDisplay = computed(() => {
  if (!userRole.value) return '';
  const roles = {
    client: 'Client',
    contractor: 'Contractor',
    admin: 'Administrator',
  };
  return roles[userRole.value] || userRole.value;
});

const currentDate = computed(() => {
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return new Date().toLocaleDateString(undefined, options);
});

const handleSearch = async () => {
  searchQueryError.value = '';
  zipcodeError.value = '';
  if (!searchQuery.value.trim() || !zipcode.value.trim()) {
    if (!searchQuery.value.trim())
      searchQueryError.value = 'Please describe your issue.';
    if (!zipcode.value.trim())
      zipcodeError.value = 'Please enter your zipcode.';
    return;
  }
  isSearching.value = true;
  try {
    const currentToken = await getToken(); // Get current token for the call
    const category = await analyzeCategoryWithLLM(
      searchQuery.value,
      currentToken
    ); // Pass token if required by analyzeCategoryWithLLM
    router.push({
      name: 'FindContractor',
      query: {
        service: category || 'any',
        zipcode: zipcode.value,
        fromSearch: 'true',
        query: searchQuery.value,
      },
    });
  } catch (error) {
    console.error('[HOME] Error during search analysis:', error);
    router.push({
      name: 'FindContractor',
      query: {
        service: 'any',
        zipcode: zipcode.value,
        fromSearch: 'true',
        query: searchQuery.value,
      },
    });
  } finally {
    isSearching.value = false;
  }
};

const fetchUserData = async () => {
  if (!isSignedIn.value || !user.value?.id) {
    updateProfileName(null);
    updateProfileImage(null);
    return;
  }
  const currentUserId = user.value.id;
  isLoadingSupabaseProfile.value = true;
  try {
    const supabase = await getSupabase();
    if (!supabase) return;

    let nameToSet = null;
    let imageUrlToSet = null;

    // Load profile data based on user role
    try {
      if (userRole.value === 'client') {
        const { data: clientData, error: clientError } = await supabase
          .from('client_profiles')
          .select('full_name, display_name, profile_picture_url')
          .eq('id', currentUserId)
          .maybeSingle();

        if (clientData && !clientError) {
          nameToSet = clientData.full_name || clientData.display_name;
          imageUrlToSet = clientData.profile_picture_url;
        } else if (clientError) {
          console.warn('[HOME] Client profile query error:', clientError);
        }
      } else if (userRole.value === 'contractor') {
        const { data: contractorData, error: contractorError } = await supabase
          .from('contractor_profiles')
          .select('full_name, display_name, profile_picture_url')
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (contractorData && !contractorError) {
          nameToSet = contractorData.full_name || contractorData.display_name;
          imageUrlToSet = contractorData.profile_picture_url;
        } else if (contractorError) {
          console.warn(
            '[HOME] Contractor profile query error:',
            contractorError
          );
        }
      }
    } catch (profileError) {
      console.warn('[HOME] Profile loading error:', profileError);
    }

    // If no profile data from tables, use user metadata or email as fallback for name
    if (!nameToSet) {
      nameToSet =
        user.value?.user_metadata?.full_name ||
        user.value?.email?.split('@')[0] ||
        'User';
    }

    // Update global state
    updateProfileName(nameToSet);
    updateProfileImage(imageUrlToSet || null);

    // Load client jobs if user is a client
    if (userRole.value === 'client') {
      const hasUserJobs = userJobs.value.length > 0;
      if (hasUserJobs) refreshingUserJobs.value = true;

      try {
        await jobStore.fetchJobsByUser(user.value.id);
      } finally {
        refreshingUserJobs.value = false;
      }
    }

    // Load contractor jobs if user is a contractor
    if (userRole.value === 'contractor') {
      try {
        await jobStore.fetchContractorJobs(user.value.id);
        await jobStore.fetchOpenJobs(); // Also fetch available opportunities
      } catch (error) {
        console.error('[HOME] Error fetching contractor jobs:', error);
      }
    }
  } catch (err) {
    console.error('[HOME] Error in fetchUserData:', err.message);
  } finally {
    isLoadingSupabaseProfile.value = false;
  }
};

const initializeUserData = async () => {
  if (isSignedIn.value && isLoaded.value) {
    await initSupabase();
    await fetchUserData();
  } else if (!isSignedIn.value && isLoaded.value) {
    // Clear global profile state if user signs out or is not signed in but auth is loaded
    updateProfileName(null);
    updateProfileImage(null);
    jobStore.clearUserJobs();
  }
};

watch(
  [isSignedIn, isLoaded, userRole],
  async ([newIsSignedIn, newIsLoaded, newUserRole]) => {
    if (newIsLoaded) {
      showFallbackContent.value = false;
      await initializeUserData();
    }
  },
  { immediate: true }
);

const handleWindowFocus = async () => {
  if (isSignedIn.value && isLoaded.value && !isLoadingOverall.value) {
    await initializeUserData();
  }
};

onMounted(() => {
  window.addEventListener('popstate', handlePopState);
  window.addEventListener('focus', handleWindowFocus);

  const fallbackTimer = setTimeout(() => {
    if (!isLoaded.value) showFallbackContent.value = true;
  }, 2000);
  const emergencyFallbackTimer = setTimeout(() => {
    if (!isLoaded.value && !isContentReady.value)
      showFallbackContent.value = true;
  }, 5000);

  const clearTimers = () => {
    clearTimeout(fallbackTimer);
    clearTimeout(emergencyFallbackTimer);
  };

  // Set up watcher for auth loading - this must be done synchronously in onMounted
  const stopWatcher = watch(
    isLoaded,
    async (newVal) => {
      if (newVal) {
        clearTimers();
        await initSupabase();

        // Force fetch jobs if user is signed in
        if (isSignedIn.value && user.value?.id) {
          try {
            if (userRole.value === 'client') {
              await jobStore.fetchJobsByUser(user.value.id);
              // Check if client needs onboarding
              await checkClientOnboarding();
            } else if (userRole.value === 'contractor') {
              await jobStore.fetchContractorJobs(user.value.id);
              await jobStore.fetchOpenJobs();
            }
          } catch (error) {
            console.error('[HOME] Error fetching jobs on mount:', error);
          }
        }
        stopWatcher(); // Stop watching once loaded
      }
    },
    { immediate: true }
  );

  if (!selectedImage.value) {
    selectedImage.value =
      placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
  }
  preloadImages();
});

// Watch for auth state changes during navigation
watch(
  [isSignedIn, isLoaded, isAuthReady],
  (
    [newSignedIn, newLoaded, newAuthReady],
    [oldSignedIn, oldLoaded, oldAuthReady]
  ) => {},
  { immediate: false }
);

// Watch for user role changes to check onboarding
watch(
  [userRole, isSignedIn, isLoaded],
  async ([newRole, newSignedIn, newLoaded]) => {
    if (newSignedIn && newLoaded && newRole === 'client') {
      await checkClientOnboarding();
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  window.removeEventListener('popstate', handlePopState);
  window.removeEventListener('focus', handleWindowFocus);
});

onActivated(async () => {
  // Simplified: just initialize if signed in and loaded
  if (isSignedIn.value && isLoaded.value) {
    await initializeUserData();
  }
});

onDeactivated(() => {});

const navigateToUserProfile = () => router.push({ name: 'UserProfile' });
const viewJobDetails = (job) =>
  router.push({ name: 'JobDetails', params: { jobId: job.id } });

const handleJobAction = (action, jobId) => {};
const handleJobApplied = (details) => {};
const handleApplicationError = (details) => {
  console.error('Job application error:', details);
};
const handlePopState = () => {};

const handleSupabaseImageError = (event) => {
  console.warn(
    `[HOME] Supabase Image load error for src: ${event.target.src}. Clearing global image.`
  );
  // event.target.style.display = 'none'; // Let Vue's reactivity handle v-if
  updateProfileImage(null); // Clear the global image URL
};

// Client onboarding functions
const checkClientOnboarding = async () => {
  if (!isSignedIn.value || !user.value?.id || userRole.value !== 'client') {
    return;
  }

  isCheckingOnboarding.value = true;

  try {
    const { data: profile } = await getUserProfile(user.value.id);

    // Show onboarding if client hasn't completed it
    if (!profile?.has_completed_client_onboarding) {
      showClientOnboarding.value = true;
    }
  } catch (error) {
    console.error('Error checking client onboarding:', error);
  } finally {
    isCheckingOnboarding.value = false;
  }
};

const handleOnboardingComplete = (action) => {
  showClientOnboarding.value = false;

  // Navigate based on the action taken
  switch (action) {
    case 'job-post':
      router.push('/services');
      break;
    case 'browse-contractors':
      router.push('/contractors');
      break;
    case 'home':
    default:
      // Stay on home page
      break;
  }
};

const handleOnboardingSkip = () => {
  showClientOnboarding.value = false;
};

// Dashboard card click handlers
const handleDashboardCardClick = async (viewType) => {
  if (
    isDashboardTransitioning.value ||
    activeDashboardView.value === viewType
  ) {
    return; // Prevent multiple rapid clicks or clicking the same view
  }

  isDashboardTransitioning.value = true;

  // Small delay to allow fade-out to start
  await nextTick();
  setTimeout(async () => {
    activeDashboardView.value = viewType;

    // If switching to applications view, fetch applications data for jobs with applications
    if (viewType === 'applications') {
      await fetchJobApplicationsData();
    }

    // Allow fade-in to complete
    setTimeout(() => {
      isDashboardTransitioning.value = false;
    }, TRANSITION_DURATION);
  }, TRANSITION_DURATION);
};

// Fetch applications data for jobs that have applications
const fetchJobApplicationsData = async () => {
  const jobsWithApplications = userJobs.value.filter(
    (job) => (job.applicant_count || 0) > 0
  );

  for (const job of jobsWithApplications) {
    try {
      const applications = await jobApplicationsStore.getJobApplications(
        job.id
      );
      jobApplicationsData.value[job.id] = applications;
    } catch (error) {
      console.error(`Error fetching applications for job ${job.id}:`, error);
    }
  }
};

// Get appropriate empty message based on current view
const getEmptyMessage = () => {
  switch (activeDashboardView.value) {
    case 'active':
      return t('dashboard.emptyStates.noActiveJobs');
    case 'completed':
      return t('dashboard.emptyStates.noCompletedJobs');
    case 'applications':
      return t('dashboard.emptyStates.noJobsWithApplications');
    case 'all':
    default:
      return t('dashboard.emptyStates.noJobsPosted');
  }
};

// Handle profile updates from other components
const handleProfileUpdated = async (updateData) => {
  // Force refresh the user data to get the latest profile information
  await fetchUserData();

  // If it's an image update, force a cache bust
  if (updateData?.type === 'image' && updateData?.profileImageUrl) {
    const cacheBustedUrl = `${updateData.profileImageUrl}?t=${Date.now()}`;
    supabaseProfileImageUrl.value = cacheBustedUrl;
    updateProfileImage(updateData.profileImageUrl);
  }
};

// Watch isLoaded to ensure Supabase client is initialized (might be redundant)
watch(
  isLoaded,
  async (newValue) => {
    if (newValue && !supabaseRef.value) {
      await initSupabase();
    }
  },
  { immediate: false }
);
</script>

<style scoped>
/* Profile thumbnail styling */
.profile-thumbnail-wrapper {
  /* Renamed from .clerk-thumbnail-wrapper if that was Clerk specific */
  /* Add any specific styles if needed, or remove if it was purely for Clerk */
}
.profile-thumbnail-link {
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  display: block;
  border-radius: 50%;
}

.profile-thumbnail-link:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px var(--ring);
}

.profile-thumbnail-link:active {
  transform: scale(0.95);
}
/* Card hover effect */
.card-link {
  transition: all 0.3s ease;
}

.card-link:hover {
  transform: translateY(-4px);
}

/* Main welcome banner - simplified styling */
.welcome-banner {
  border: none;
  position: relative;
}

/* Skeleton loading animations */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--muted) 25%,
    var(--border) 50%,
    var(--muted) 75%
  );
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Enhanced skeleton for main content */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* Slide up animation for content */
.animate-slide-up {
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Fade transition styles for dashboard content */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* Dashboard content containers */
.client-dashboard-content,
.contractor-dashboard-content {
  min-height: 200px; /* Prevent layout shift during transitions */
}

/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }

  .fade-enter-from,
  .fade-leave-to,
  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
  }
}
</style>
