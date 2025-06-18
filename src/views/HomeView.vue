<template>
  <div class="flex flex-col min-h-screen bg-white dark:bg-gray-900">
    <!-- Welcome Banner -->
    <div class="welcome-banner w-full text-foreground p-6 mb-8 rounded-xl">
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
              <h1 class="text-3xl md:text-5xl font-normal mr-4">
                <!-- Removed mb-1 for better vertical alignment -->
                {{ timeBasedGreeting }}, {{ profileName || 'User' }}!
              </h1>

              <!-- Profile thumbnail - Supabase -->
              <div class="profile-thumbnail-wrapper ml-4">
                <!-- Use getCachedBustedImageUrl from useProfileState -->
                <div
                  v-if="getCachedBustedImageUrl"
                  class="h-14 w-14 rounded-full hover:scale-110 transition-transform overflow-hidden cursor-pointer"
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
                  class="h-14 w-14 rounded-full bg-primary hover:scale-110 transition-transform cursor-pointer flex items-center justify-center text-white font-bold text-lg"
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

      <!-- Contractor View: Job Lists for Logged-In Contractors -->
      <div v-if="isSignedIn && userRole === 'contractor'" class="mb-8">
        <h2 class="text-xl md:text-2xl font-normal mb-6 text-foreground">
          {{ $t('dashboard.jobDashboard') }}
        </h2>

        <!-- Contractor Dashboard Stats -->
        <div class="dashboard-stats mb-8">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <!-- Total Earnings Card -->
            <div
              class="stat-card bg-card p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
              :class="{
                'ring-2 ring-primary bg-primary/5':
                  activeContractorDashboardView === 'earnings',
              }"
              @click="handleContractorDashboardCardClick('earnings')"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="stat-number text-2xl font-bold text-primary">
                    S/{{ contractorTotalEarnings.toLocaleString() }}
                  </div>
                  <div class="stat-label text-sm text-muted-foreground">
                    {{ $t('dashboard.totalEarnings') }}
                  </div>
                </div>
                <Wallet class="w-8 h-8 text-primary/60" />
              </div>
            </div>

            <!-- Active Jobs Card -->
            <div
              class="stat-card bg-card p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
              :class="{
                'ring-2 ring-green-500 bg-green-500/5':
                  activeContractorDashboardView === 'activeJobs',
              }"
              @click="handleContractorDashboardCardClick('activeJobs')"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="stat-number text-2xl font-bold text-green-600">
                    {{ contractorActiveJobsCount }}
                  </div>
                  <div class="stat-label text-sm text-muted-foreground">
                    {{ $t('dashboard.activeJobs') }}
                  </div>
                </div>
                <Activity class="w-8 h-8 text-green-500/60" />
              </div>
            </div>

            <!-- Success Rate Card -->
            <div
              class="stat-card bg-card p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
              :class="{
                'ring-2 ring-blue-500 bg-blue-500/5':
                  activeContractorDashboardView === 'successRate',
              }"
              @click="handleContractorDashboardCardClick('successRate')"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="stat-number text-2xl font-bold text-blue-600">
                    {{ contractorSuccessRate }}%
                  </div>
                  <div class="stat-label text-sm text-muted-foreground">
                    {{ $t('dashboard.successRate') }}
                  </div>
                </div>
                <Target class="w-8 h-8 text-blue-500/60" />
              </div>
            </div>

            <!-- Available Opportunities Card -->
            <div
              class="stat-card bg-card p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105"
              :class="{
                'ring-2 ring-orange-500 bg-orange-500/5':
                  activeContractorDashboardView === 'opportunities',
              }"
              @click="handleContractorDashboardCardClick('opportunities')"
            >
              <div class="flex items-center justify-between">
                <div>
                  <div class="stat-number text-2xl font-bold text-orange-600">
                    {{ contractorAvailableOpportunitiesCount }}
                  </div>
                  <div class="stat-label text-sm text-muted-foreground">
                    {{ $t('dashboard.opportunities') }}
                  </div>
                </div>
                <Sparkles class="w-8 h-8 text-orange-500/60" />
              </div>
            </div>
          </div>
        </div>

        <!-- Unified Job List Section for Contractor -->
        <div>
          <Transition name="fade" mode="out-in">
            <div
              :key="activeContractorDashboardView"
              class="contractor-dashboard-content"
            >
              <div class="flex items-center mb-4">
                <h3 class="text-lg font-medium text-foreground">
                  {{ contractorDashboardTitle }}
                </h3>
                <!-- Loading indicator -->
                <div
                  v-if="
                    refreshingContractorJobs ||
                    refreshingOpenJobs ||
                    isDashboardTransitioning
                  "
                  class="ml-2 animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full text-muted-foreground"
                ></div>
              </div>

              <!-- Earnings View: Show Chart + Custom Job Cards -->
              <div
                v-if="activeContractorDashboardView === 'earnings'"
                class="space-y-6"
              >
                <!-- Earnings Chart -->
                <EarningsChart />

                <!-- Completed Jobs with Earnings -->
                <div>
                  <h4 class="text-md font-medium text-foreground mb-4">
                    {{
                      $t('dashboard.completedJobsCount', {
                        count: filteredContractorDisplayJobs.length,
                      })
                    }}
                  </h4>

                  <div
                    v-if="filteredContractorDisplayJobs.length > 0"
                    class="space-y-4"
                  >
                    <EarningsJobCard
                      v-for="job in filteredContractorDisplayJobs"
                      :key="job.id"
                      :job="job"
                      @view-details="viewJobDetails"
                    />
                  </div>

                  <div v-else class="text-center py-8">
                    <p class="text-muted-foreground">
                      {{ getContractorEmptyMessage() }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Other Views: Use Regular Job List -->
              <JobList
                v-else
                :jobs="filteredContractorDisplayJobs"
                :loading="
                  jobStore.isLoading &&
                  filteredContractorDisplayJobs.length === 0
                "
                :error="jobStore.error"
                :user-role="userRole"
                :empty-message="getContractorEmptyMessage()"
                :show-posted-by="true"
                :show-assigned-to="false"
                :show-actions="true"
                @view="viewJobDetails"
                @action="handleJobAction"
                @applied="handleJobApplied"
                @application-error="handleApplicationError"
              />
            </div>
          </Transition>
        </div>
      </div>

      <!-- Client View: Enhanced Dashboard for Logged-In Clients -->
      <div v-if="isSignedIn && userRole === 'client'" class="mb-8">
        <ClientDashboard :user-id="userId" />
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
import JobList from '../components/jobs/JobList.vue';
import Button from '../components/ui/button/Button.vue';
import { Input } from '../components/ui/input';
import { analyzeCategoryWithLLM } from '@/lib/categoryAnalyzer';
import { formatDisplayName } from '@/lib/nameFormatter';
import EarningsChart from '../components/charts/EarningsChart.vue';
import EarningsJobCard from '../components/charts/EarningsJobCard.vue';
import ClientOnboarding from '../components/onboarding/ClientOnboarding.vue';
import ClientDashboard from '../components/client/ClientDashboard.vue';
import { useSupabaseAuth } from '../composables/useSupabaseAuth';
import { Wallet, Activity, Target, Sparkles } from 'lucide-vue-next';

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
const refreshingContractorJobs = ref(false);
const refreshingOpenJobs = ref(false);
const refreshingUserJobs = ref(false);

// Dashboard state for interactive cards
const activeDashboardView = ref('all'); // 'all', 'active', 'applications', 'completed'
// Contractor Dashboard State
const activeContractorDashboardView = ref('activeJobs'); // 'earnings', 'activeJobs', 'successRate', 'opportunities'

// Transition state for smooth fade effects
const isDashboardTransitioning = ref(false);
const TRANSITION_DURATION = 150; // ms
const contractorProfile = ref(null); // To store contractor's profile including service_areas
const jobApplicationsData = ref({});

// Dummy completed jobs data for earnings demonstration
const dummyCompletedJobs = ref([
  {
    id: 'demo-1',
    category_name: 'Home Cleaning',
    description:
      'Deep cleaning of 3-bedroom house including kitchen, bathrooms, and living areas. Detailed cleaning of all surfaces, floors, and fixtures.',
    location_text: 'Downtown Lima',
    final_payment_amount: 4500,
    completed_at: '2024-12-15T10:00:00Z',
    client_name: 'Maria Rodriguez',
    status: 'completed',
  },
  {
    id: 'demo-2',
    category_name: 'Plumbing Repair',
    description:
      'Fixed leaky kitchen faucet and replaced bathroom sink drain. Included parts and labor for complete repair.',
    location_text: 'Miraflores',
    final_payment_amount: 3200,
    completed_at: '2024-11-28T14:30:00Z',
    client_name: 'Carlos Mendoza',
    status: 'completed',
  },
  {
    id: 'demo-3',
    category_name: 'Garden Maintenance',
    description:
      'Weekly garden maintenance including lawn mowing, hedge trimming, and flower bed weeding for residential property.',
    location_text: 'San Isidro',
    final_payment_amount: 2800,
    completed_at: '2024-11-10T09:15:00Z',
    client_name: 'Ana Silva',
    status: 'completed',
  },
]);

const openJobs = computed(() => jobStore.openJobs);
const contractorJobs = computed(() => {
  const jobs = jobStore.contractorJobs || [];

  // Current jobs are those that are assigned, in progress, completed, etc.
  // ALSO include jobs with 'open' status if the application is 'selected' (temporary fix)
  const filtered = jobs.filter(
    (job) =>
      job.status === 'assigned' ||
      job.status === 'in_progress' ||
      job.status === 'completed' ||
      job.status === 'in_review' ||
      job.status === 'pending_assignment' ||
      (job.status === 'open' && job.application_status === 'selected') // Temporary fix
  );

  return filtered;
});

// Contractor Stats
const contractorTotalEarnings = computed(() => {
  // Combine actual completed jobs with dummy data for demonstration
  const actualEarnings = jobStore.contractorJobs
    .filter(
      (job) =>
        job.status === JOB_STATUS.COMPLETED &&
        typeof job.final_payment_amount === 'number'
    )
    .reduce((sum, job) => sum + job.final_payment_amount, 0);

  // Add dummy earnings for demonstration
  const dummyEarnings = dummyCompletedJobs.value.reduce(
    (sum, job) => sum + job.final_payment_amount,
    0
  );

  return actualEarnings + dummyEarnings;
});

const contractorActiveJobsCount = computed(() => contractorJobs.value.length);

const contractorSuccessRate = computed(() => {
  // Actual calculation: (completed jobs / (completed jobs + cancelled/failed jobs)) * 100
  const completedJobs = jobStore.contractorJobs.filter(
    (job) => job.status === JOB_STATUS.COMPLETED
  ).length;
  // Assuming JOB_STATUS.CANCELLED is a relevant failure/non-success status. Add others if needed.
  const nonSuccessJobs = jobStore.contractorJobs.filter(
    (job) => job.status === JOB_STATUS.CANCELLED
  ).length;
  const totalApplicableJobs = completedJobs + nonSuccessJobs;

  if (totalApplicableJobs === 0) return 0; // Avoid division by zero
  return Math.round((completedJobs / totalApplicableJobs) * 100);
});

// Helper function to filter opportunities based on contractor profile
const getFilteredOpportunities = () => {
  const contractorSkills = contractorProfile.value?.skills || [];
  const contractorServiceAreas = contractorProfile.value?.service_areas || [];

  let filteredJobs = openJobs.value;

  // Filter by skills if contractor has skills defined
  if (contractorSkills.length > 0) {
    filteredJobs = filteredJobs.filter((job) => {
      // Check main category match with improved partial matching
      const categoryMatch = contractorSkills.some((skill) => {
        const skillLower = skill.toLowerCase();
        const categoryLower = job.category_name?.toLowerCase() || '';

        // Extract base skill word (e.g., "Plumbing" from "Plumbing Fixes")
        const baseSkill = skillLower.split(/[\s(]/)[0].trim();
        const baseCategory = categoryLower.split(/[\s(]/)[0].trim();

        return (
          skillLower === categoryLower || // Exact match
          skillLower.includes(categoryLower) || // Skill contains category
          categoryLower.includes(skillLower) || // Category contains skill
          baseSkill === baseCategory || // Base words match
          skillLower.includes(baseCategory) || // Skill contains base category
          categoryLower.includes(baseSkill) // Category contains base skill
        );
      });

      // Check skills in description with improved partial matching
      const descriptionMatch = contractorSkills.some((skill) => {
        const skillLower = skill.toLowerCase();
        const jobDescLower = job.description?.toLowerCase() || '';

        // Extract base skill word (e.g., "Painting" from "Painting (Interior)")
        const baseSkill = skillLower.split('(')[0].trim();

        // Check if job description contains the skill or base skill
        return (
          jobDescLower.includes(skillLower) || // Full skill match
          jobDescLower.includes(baseSkill) || // Base skill match
          skillLower.includes(jobDescLower.replace(/[^a-z\s]/g, '').trim()) // Reverse match
        );
      });

      // Check required_skills array with improved matching
      const requiredSkillsMatch = contractorSkills.some((skill) =>
        job.required_skills?.some((reqSkill) => {
          const skillLower = skill.toLowerCase();
          const reqSkillLower = reqSkill.toLowerCase();
          // Use partial matching: check if either skill contains the other as a keyword
          return (
            skillLower === reqSkillLower || // Exact match
            skillLower.includes(reqSkillLower) || // Contractor skill contains job requirement
            reqSkillLower.includes(skillLower) // Job requirement contains contractor skill
          );
        })
      );

      // Check service_ids match (most reliable matching)
      const serviceIdsMatch = contractorProfile.value?.service_ids?.some(
        (serviceId) => job.service_id === serviceId
      );

      // Check service keywords match
      const serviceKeywordsMatch = contractorSkills.some((skill) => {
        const skillLower = skill.toLowerCase();
        const baseSkill = skillLower.split(/[\s(]/)[0].trim();

        return job.service_keywords?.some((keyword) => {
          const keywordLower = keyword.toLowerCase();
          return (
            skillLower.includes(keywordLower) ||
            keywordLower.includes(skillLower) ||
            baseSkill.includes(keywordLower) ||
            keywordLower.includes(baseSkill)
          );
        });
      });

      return (
        categoryMatch ||
        descriptionMatch ||
        requiredSkillsMatch ||
        serviceIdsMatch ||
        serviceKeywordsMatch
      );
    });
  }

  // Filter by location/service areas if contractor has service areas defined
  if (contractorServiceAreas.length > 0) {
    filteredJobs = filteredJobs.filter((job) => {
      // If job has no location specified, show it (could be remote/flexible)
      if (!job.location_text) {
        return true;
      }

      // Check if job location matches any of contractor's service areas
      const jobLocation = job.location_text.toLowerCase();
      const matchesServiceArea = contractorServiceAreas.some((area) => {
        const serviceArea = area.toLowerCase();

        // Extract location components (district, province, region)
        const jobLocationParts = jobLocation
          .split(/[,-]/)
          .map((part) => part.trim());
        const serviceAreaParts = serviceArea
          .split('-')
          .map((part) => part.trim());

        // Check for exact matches or partial matches
        return (
          jobLocation.includes(serviceArea) ||
          serviceArea.includes(jobLocation) ||
          // Check if any job location part matches any service area part
          jobLocationParts.some((jobPart) =>
            serviceAreaParts.some(
              (areaPart) =>
                jobPart.includes(areaPart) || areaPart.includes(jobPart)
            )
          )
        );
      });

      return matchesServiceArea;
    });
  }

  return filteredJobs;
};

const contractorAvailableOpportunitiesCount = computed(() => {
  return getFilteredOpportunities().length;
});

const handleContractorDashboardCardClick = async (view) => {
  if (
    isDashboardTransitioning.value ||
    activeContractorDashboardView.value === view
  ) {
    return; // Prevent multiple rapid clicks or clicking the same view
  }

  isDashboardTransitioning.value = true;

  // Small delay to allow fade-out to start
  await nextTick();
  setTimeout(() => {
    activeContractorDashboardView.value = view;
    // Allow fade-in to complete
    setTimeout(() => {
      isDashboardTransitioning.value = false;
    }, TRANSITION_DURATION);
  }, TRANSITION_DURATION);
};

const contractorDashboardTitle = computed(() => {
  switch (activeContractorDashboardView.value) {
    case 'earnings':
      return (
        t('dashboard.completedJobs') + ' (' + t('dashboard.totalEarnings') + ')'
      );
    case 'activeJobs':
      return t('dashboard.currentJobs');
    case 'successRate':
      return t('dashboard.applicationHistory');
    case 'opportunities':
      return t('dashboard.availableOpportunities');
    default:
      return t('jobs.myJobs');
  }
});

const filteredContractorDisplayJobs = computed(() => {
  const view = activeContractorDashboardView.value;
  if (view === 'activeJobs') {
    return contractorJobs.value; // Already filtered for active statuses
  }
  if (view === 'opportunities') {
    const contractorSkills = contractorProfile.value?.skills || [];
    const contractorServiceAreas = contractorProfile.value?.service_areas || [];

    console.log('[DEBUG] Filtering opportunities for contractor:', {
      contractorId: contractorProfile.value?.id,
      skills: contractorSkills,
      serviceIds: contractorProfile.value?.service_ids,
      serviceAreas: contractorServiceAreas.slice(0, 5), // Show first 5 for brevity
      totalServiceAreas: contractorServiceAreas.length,
      totalJobs: openJobs.value.length,
    });

    let filteredJobs = openJobs.value;

    // Filter by skills if contractor has skills defined
    if (contractorSkills.length > 0) {
      filteredJobs = filteredJobs.filter((job) => {
        // Check main category match with improved partial matching
        const categoryMatch = contractorSkills.some((skill) => {
          const skillLower = skill.toLowerCase();
          const categoryLower = job.category_name?.toLowerCase() || '';

          // Extract base skill word (e.g., "Plumbing" from "Plumbing Fixes")
          const baseSkill = skillLower.split(/[\s(]/)[0].trim();
          const baseCategory = categoryLower.split(/[\s(]/)[0].trim();

          return (
            skillLower === categoryLower || // Exact match
            skillLower.includes(categoryLower) || // Skill contains category
            categoryLower.includes(skillLower) || // Category contains skill
            baseSkill === baseCategory || // Base words match
            skillLower.includes(baseCategory) || // Skill contains base category
            categoryLower.includes(baseSkill) // Category contains base skill
          );
        });

        // Check skills in description with improved partial matching
        const descriptionMatch = contractorSkills.some((skill) => {
          const skillLower = skill.toLowerCase();
          const jobDescLower = job.description?.toLowerCase() || '';

          // Extract base skill word (e.g., "Painting" from "Painting (Interior)")
          const baseSkill = skillLower.split('(')[0].trim();

          // Check if job description contains the skill or base skill
          return (
            jobDescLower.includes(skillLower) || // Full skill match
            jobDescLower.includes(baseSkill) || // Base skill match
            skillLower.includes(jobDescLower.replace(/[^a-z\s]/g, '').trim()) // Reverse match
          );
        });

        // Check required_skills array with improved matching
        const requiredSkillsMatch = contractorSkills.some((skill) =>
          job.required_skills?.some((reqSkill) => {
            const skillLower = skill.toLowerCase();
            const reqSkillLower = reqSkill.toLowerCase();
            // Use partial matching: check if either skill contains the other as a keyword
            return (
              skillLower === reqSkillLower || // Exact match
              skillLower.includes(reqSkillLower) || // Contractor skill contains job requirement
              reqSkillLower.includes(skillLower) // Job requirement contains contractor skill
            );
          })
        );

        // Check service_ids match (most reliable matching)
        const serviceIdsMatch = contractorProfile.value?.service_ids?.some(
          (serviceId) => job.service_id === serviceId
        );

        // Check service keywords match
        const serviceKeywordsMatch = contractorSkills.some((skill) => {
          const skillLower = skill.toLowerCase();
          const baseSkill = skillLower.split(/[\s(]/)[0].trim();

          return job.service_keywords?.some((keyword) => {
            const keywordLower = keyword.toLowerCase();
            return (
              skillLower.includes(keywordLower) ||
              keywordLower.includes(skillLower) ||
              baseSkill.includes(keywordLower) ||
              keywordLower.includes(baseSkill)
            );
          });
        });

        const matches =
          categoryMatch ||
          descriptionMatch ||
          requiredSkillsMatch ||
          serviceIdsMatch ||
          serviceKeywordsMatch;

        // Debug logging for the painting job
        if (job.description?.toLowerCase().includes('paint')) {
          console.log('[DEBUG] Painting job filtering:', {
            jobId: job.id,
            jobCategory: job.category_name,
            jobDescription: job.description,
            contractorSkills,
            categoryMatch,
            descriptionMatch,
            requiredSkillsMatch,
            finalMatch: matches,
          });
        }

        return matches;
      });
    }

    // Filter by location/service areas if contractor has service areas defined
    if (contractorServiceAreas.length > 0) {
      filteredJobs = filteredJobs.filter((job) => {
        // If job has no location specified, show it (could be remote/flexible)
        if (!job.location_text) {
          console.log('[DEBUG] Job has no location, including:', job.id);
          return true;
        }

        // Check if job location matches any of contractor's service areas
        const jobLocation = job.location_text.toLowerCase();
        const matchesServiceArea = contractorServiceAreas.some((area) => {
          const serviceArea = area.toLowerCase();

          // Extract location components (district, province, region)
          const jobLocationParts = jobLocation
            .split(/[,-]/)
            .map((part) => part.trim());
          const serviceAreaParts = serviceArea
            .split('-')
            .map((part) => part.trim());

          // Check for exact matches or partial matches
          const matches =
            jobLocation.includes(serviceArea) ||
            serviceArea.includes(jobLocation) ||
            // Check if any job location part matches any service area part
            jobLocationParts.some((jobPart) =>
              serviceAreaParts.some(
                (areaPart) =>
                  jobPart.includes(areaPart) || areaPart.includes(jobPart)
              )
            );

          if (matches) {
            console.log('[DEBUG] Location match found:', {
              jobLocation,
              serviceArea,
              jobLocationParts,
              serviceAreaParts,
            });
          }
          return matches;
        });

        if (!matchesServiceArea) {
          console.log('[DEBUG] Job filtered out by location:', {
            jobId: job.id,
            jobLocation: job.location_text,
            contractorServiceAreas,
          });
        }

        return matchesServiceArea;
      });
    }

    console.log('[DEBUG] Final filtered jobs count:', filteredJobs.length);
    return filteredJobs;
  }
  if (view === 'earnings') {
    // Combine actual completed jobs with dummy data for demonstration
    const actualCompletedJobs = jobStore.contractorJobs.filter(
      (job) => job.status === JOB_STATUS.COMPLETED
    );
    return [...actualCompletedJobs, ...dummyCompletedJobs.value];
  }
  if (view === 'successRate') {
    // For now, let's show completed jobs. This can be refined.
    // Or, if jobApplicationsStore is available and populated for contractors,
    // we could show jobs they've applied to.
    return jobStore.contractorJobs.filter(
      (job) => job.status === JOB_STATUS.COMPLETED
    );
  }
  return []; // Default to empty if no view matches
});

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

const userRole = computed(() => authUserRoleGet.value || 'client'); // Use role from auth composable, default to 'client'

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
  const currentUserId = user.value.id; // Renamed for clarity
  isLoadingSupabaseProfile.value = true;
  try {
    const supabase = await getSupabase();
    if (!supabase) return;

    let nameToSet = null;
    let imageUrlToSet = null;

    // Try contractor_profiles first
    const { data: contractorData, error: contractorError } = await supabase
      .from('contractor_profiles')
      .select(
        'full_name, profile_picture_url, service_areas, bio, contact_phone, skills'
      ) // Include service_areas and skills for filtering
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (contractorData && !contractorError) {
      nameToSet = contractorData.full_name;
      imageUrlToSet = contractorData.profile_picture_url;

      contractorProfile.value = {
        ...contractorData,
        skills: contractorData.skills || [], // Use skills array directly
      };

      console.log('[DEBUG] Contractor profile loaded:', {
        name: contractorData.full_name,
        serviceAreas: contractorData.service_areas,
        skills: contractorData.skills || [],
      });
    } else {
      contractorProfile.value = null; // Clear if not found or error
      // Fallback to client_profiles
      const { data: clientData, error: clientError } = await supabase
        .from('client_profiles')
        .select('full_name, display_name, profile_picture_url') // Ensure using profile_picture_url
        .eq('id', currentUserId)
        .single();

      if (clientData && !clientError) {
        nameToSet = clientData.full_name || clientData.display_name;
        imageUrlToSet = clientData.profile_picture_url;
      }
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
    updateProfileImage(imageUrlToSet || null); // Pass null if no image_url

    if (userRole.value === 'contractor') {
      // Use refreshing states if we already have data
      const hasContractorJobs = contractorJobs.value.length > 0;
      const hasOpenJobs = openJobs.value.length > 0;

      if (hasContractorJobs) refreshingContractorJobs.value = true;
      if (hasOpenJobs) refreshingOpenJobs.value = true;

      try {
        await jobStore.fetchContractorJobs(user.value.id);
        await jobStore.fetchOpenJobs();
      } finally {
        refreshingContractorJobs.value = false;
        refreshingOpenJobs.value = false;
      }
    } else if (userRole.value === 'client') {
      const hasUserJobs = userJobs.value.length > 0;
      if (hasUserJobs) refreshingUserJobs.value = true;

      try {
        await jobStore.fetchJobsByUser(user.value.id);
      } finally {
        refreshingUserJobs.value = false;
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
    jobStore.clearContractorJobs();
    contractorProfile.value = null; // Clear contractor profile on sign out
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
            await jobStore.fetchJobsByUser(user.value.id);
            // Check if client needs onboarding
            await checkClientOnboarding();
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

const getContractorEmptyMessage = () => {
  switch (activeContractorDashboardView.value) {
    case 'earnings':
      return t('dashboard.emptyStates.noEarningsYet');
    case 'activeJobs':
      return t('dashboard.emptyStates.noActiveJobsContractor');
    case 'successRate':
      return t('dashboard.emptyStates.noJobHistory');
    case 'opportunities':
      const contractorSkills = contractorProfile.value?.skills || [];

      if (contractorSkills.length > 0) {
        return t('dashboard.emptyStates.noMatchingJobs');
      }
      return t('dashboard.emptyStates.completeProfileForOpportunities');
    default:
      return t('dashboard.emptyStates.noJobsToDisplay');
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
