<template>
  <div class="job-posting-wizard max-w-4xl mx-auto p-6">
    <!-- Progress Indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-bold text-foreground">
          {{ $t('jobPosting.createJobPost') }}
        </h2>
        <div class="text-sm text-muted-foreground">
          {{ $t('jobPosting.step') }} {{ currentStep }} {{ $t('common.of') }}
          {{ totalSteps }}
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="w-full bg-muted rounded-full h-2">
        <div
          class="bg-primary h-2 rounded-full transition-all duration-300"
          :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
        ></div>
      </div>

      <!-- Step Labels -->
      <div class="flex justify-between mt-2 text-xs text-muted-foreground">
        <span :class="{ 'text-primary font-medium': currentStep >= 1 }">
          {{ $t('jobPosting.serviceSelection') }}
        </span>
        <span :class="{ 'text-primary font-medium': currentStep >= 2 }">
          {{ $t('jobPosting.jobDetails') }}
        </span>
        <span :class="{ 'text-primary font-medium': currentStep >= 3 }">
          {{ $t('jobPosting.budgetAndTiming') }}
        </span>
        <span :class="{ 'text-primary font-medium': currentStep >= 4 }">
          {{ $t('jobPosting.review') }}
        </span>
      </div>
    </div>

    <!-- Step Content -->
    <div class="min-h-[500px]">
      <!-- Step 1: Service Selection -->
      <div v-if="currentStep === 1" class="space-y-6">
        <div class="text-center mb-8">
          <h3 class="text-xl font-semibold text-foreground mb-2">
            {{ $t('jobPosting.whatServiceNeeded') }}
          </h3>
          <p class="text-muted-foreground">
            {{ $t('jobPosting.selectServiceDescription') }}
          </p>
        </div>

        <!-- Service Categories Grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="service in availableServices"
            :key="service.id"
            class="service-card p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
            :class="{
              'border-primary bg-primary/5': selectedService?.id === service.id,
              'border-border hover:border-primary/50':
                selectedService?.id !== service.id,
            }"
            @click="selectService(service)"
          >
            <div class="text-center">
              <div
                class="w-12 h-12 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <component
                  :is="getServiceIcon(service.category)"
                  class="w-6 h-6 text-primary"
                />
              </div>
              <h4 class="font-medium text-sm text-foreground mb-1">
                {{ service.name_en || service.name_es }}
              </h4>
              <p class="text-xs text-muted-foreground">
                {{ service.description_en || service.description_es }}
              </p>
            </div>
          </div>
        </div>

        <!-- Custom Service Option -->
        <div class="mt-8 p-4 border border-dashed rounded-lg">
          <div class="text-center">
            <Plus class="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <h4 class="font-medium text-foreground mb-1">
              {{ $t('jobPosting.customService') }}
            </h4>
            <p class="text-sm text-muted-foreground mb-3">
              {{ $t('jobPosting.customServiceDescription') }}
            </p>
            <Button variant="outline" @click="showCustomServiceForm = true">
              {{ $t('jobPosting.addCustomService') }}
            </Button>
          </div>
        </div>
      </div>

      <!-- Step 2: Job Details -->
      <div v-if="currentStep === 2" class="space-y-6">
        <div class="text-center mb-8">
          <h3 class="text-xl font-semibold text-foreground mb-2">
            {{ $t('jobPosting.describeYourJob') }}
          </h3>
          <p class="text-muted-foreground">
            {{ $t('jobPosting.provideJobDetails') }}
          </p>
        </div>

        <!-- Job Templates -->
        <div v-if="jobTemplates.length > 0" class="mb-6">
          <Label class="text-sm font-medium mb-3 block">
            {{ $t('jobPosting.useTemplate') }}
          </Label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="template in jobTemplates"
              :key="template.id"
              class="template-card p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
              @click="applyTemplate(template)"
            >
              <h4 class="font-medium text-foreground mb-2">
                {{ template.title }}
              </h4>
              <p class="text-sm text-muted-foreground mb-2">
                {{ template.description }}
              </p>
              <div
                class="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <Clock class="w-3 h-3" />
                <span>{{ template.estimated_duration }}</span>
                <span class="text-green-600 font-medium">
                  S/{{ template.budget_range }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Job Description Form -->
        <div class="space-y-4">
          <div>
            <Label for="job-title" class="text-sm font-medium mb-2 block">
              {{ $t('jobPosting.jobTitle') }}
            </Label>
            <Input
              id="job-title"
              v-model="jobData.title"
              :placeholder="$t('jobPosting.jobTitlePlaceholder')"
              class="w-full"
            />
          </div>

          <div>
            <Label for="job-description" class="text-sm font-medium mb-2 block">
              {{ $t('jobPosting.jobDescription') }}
            </Label>
            <Textarea
              id="job-description"
              v-model="jobData.description"
              :placeholder="$t('jobPosting.jobDescriptionPlaceholder')"
              class="min-h-[120px] w-full"
            />
            <div class="text-xs text-muted-foreground mt-1">
              {{ jobData.description.length }}/500 {{ $t('common.characters') }}
            </div>
          </div>

          <div>
            <Label for="job-location" class="text-sm font-medium mb-2 block">
              {{ $t('jobPosting.jobLocation') }}
            </Label>
            <LocationInput
              v-model="jobData.location"
              :placeholder="$t('jobPosting.jobLocationPlaceholder')"
            />
          </div>

          <!-- Photo Upload -->
          <div>
            <Label class="text-sm font-medium mb-2 block">
              {{ $t('jobPosting.addPhotos') }}
            </Label>
            <PhotoUpload
              v-model="jobData.photos"
              :max-files="5"
              :max-size="2"
              @upload-error="handlePhotoError"
            />
          </div>
        </div>
      </div>

      <!-- Step 3: Budget and Timing -->
      <div v-if="currentStep === 3" class="space-y-6">
        <div class="text-center mb-8">
          <h3 class="text-xl font-semibold text-foreground mb-2">
            {{ $t('jobPosting.setBudgetAndTiming') }}
          </h3>
          <p class="text-muted-foreground">
            {{ $t('jobPosting.budgetTimingDescription') }}
          </p>
        </div>

        <!-- Budget Suggestions -->
        <div v-if="budgetSuggestions.length > 0" class="mb-6">
          <Label class="text-sm font-medium mb-3 block">
            {{ $t('jobPosting.suggestedBudget') }}
          </Label>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div
              v-for="suggestion in budgetSuggestions"
              :key="suggestion.range"
              class="budget-card p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md"
              :class="{
                'border-primary bg-primary/5':
                  selectedBudgetRange === suggestion.range,
                'border-border hover:border-primary/50':
                  selectedBudgetRange !== suggestion.range,
              }"
              @click="selectBudgetRange(suggestion)"
            >
              <div class="text-center">
                <div class="text-lg font-semibold text-foreground">
                  S/{{ suggestion.range }}
                </div>
                <div class="text-xs text-muted-foreground">
                  {{ suggestion.description }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Custom Budget -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label for="budget-min" class="text-sm font-medium mb-2 block">
              {{ $t('jobPosting.minimumBudget') }}
            </Label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                >S/</span
              >
              <Input
                id="budget-min"
                v-model.number="jobData.budgetMin"
                type="number"
                :placeholder="$t('jobPosting.minimumBudgetPlaceholder')"
                class="pl-8"
              />
            </div>
          </div>
          <div>
            <Label for="budget-max" class="text-sm font-medium mb-2 block">
              {{ $t('jobPosting.maximumBudget') }}
            </Label>
            <div class="relative">
              <span
                class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                >S/</span
              >
              <Input
                id="budget-max"
                v-model.number="jobData.budgetMax"
                type="number"
                :placeholder="$t('jobPosting.maximumBudgetPlaceholder')"
                class="pl-8"
              />
            </div>
          </div>
        </div>

        <!-- Timing -->
        <div>
          <Label for="preferred-date" class="text-sm font-medium mb-2 block">
            {{ $t('jobPosting.preferredDate') }}
          </Label>
          <DateTimePicker v-model="jobData.preferredDateTime" />
        </div>

        <!-- Urgency -->
        <div>
          <Label class="text-sm font-medium mb-3 block">
            {{ $t('jobPosting.urgency') }}
          </Label>
          <div class="grid grid-cols-3 gap-3">
            <div
              v-for="urgency in urgencyOptions"
              :key="urgency.value"
              class="urgency-card p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md text-center"
              :class="{
                'border-primary bg-primary/5':
                  jobData.urgency === urgency.value,
                'border-border hover:border-primary/50':
                  jobData.urgency !== urgency.value,
              }"
              @click="jobData.urgency = urgency.value"
            >
              <component
                :is="urgency.icon"
                class="w-6 h-6 mx-auto mb-2 text-primary"
              />
              <div class="font-medium text-sm">{{ urgency.label }}</div>
              <div class="text-xs text-muted-foreground">
                {{ urgency.description }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Review -->
      <div v-if="currentStep === 4" class="space-y-6">
        <div class="text-center mb-8">
          <h3 class="text-xl font-semibold text-foreground mb-2">
            {{ $t('jobPosting.reviewYourJob') }}
          </h3>
          <p class="text-muted-foreground">
            {{ $t('jobPosting.reviewDescription') }}
          </p>
        </div>

        <!-- Job Preview -->
        <div class="bg-card border rounded-lg p-6">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h4 class="text-lg font-semibold text-foreground mb-2">
                {{ jobData.title || selectedService?.name_en }}
              </h4>
              <div
                class="flex items-center gap-4 text-sm text-muted-foreground"
              >
                <span class="flex items-center gap-1">
                  <MapPin class="w-4 h-4" />
                  {{ jobData.location }}
                </span>
                <span class="flex items-center gap-1">
                  <Calendar class="w-4 h-4" />
                  {{ formatDate(jobData.preferredDateTime) }}
                </span>
                <span class="flex items-center gap-1">
                  <DollarSign class="w-4 h-4" />
                  S/{{ jobData.budgetMin }} - S/{{ jobData.budgetMax }}
                </span>
              </div>
            </div>
            <Badge :variant="getUrgencyVariant(jobData.urgency)">
              {{ getUrgencyLabel(jobData.urgency) }}
            </Badge>
          </div>

          <p class="text-foreground mb-4">{{ jobData.description }}</p>

          <!-- Photos Preview -->
          <div v-if="jobData.photos.length > 0" class="mb-4">
            <Label class="text-sm font-medium mb-2 block">
              {{ $t('jobPosting.attachedPhotos') }}
            </Label>
            <div class="flex gap-2">
              <img
                v-for="(photo, index) in jobData.photos.slice(0, 4)"
                :key="index"
                :src="photo"
                :alt="`Photo ${index + 1}`"
                class="w-16 h-16 rounded-lg object-cover border"
              />
              <div
                v-if="jobData.photos.length > 4"
                class="w-16 h-16 rounded-lg border bg-muted flex items-center justify-center text-xs text-muted-foreground"
              >
                +{{ jobData.photos.length - 4 }}
              </div>
            </div>
          </div>

          <!-- Estimated Responses -->
          <div class="bg-muted/50 rounded-lg p-4">
            <div class="flex items-center gap-2 mb-2">
              <Users class="w-4 h-4 text-primary" />
              <span class="font-medium text-foreground">
                {{ $t('jobPosting.estimatedResponses') }}
              </span>
            </div>
            <p class="text-sm text-muted-foreground">
              {{
                $t('jobPosting.estimatedResponsesDescription', {
                  count: estimatedResponses,
                })
              }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div
      class="flex items-center justify-between mt-8 pt-6 border-t border-border"
    >
      <Button
        variant="outline"
        @click="previousStep"
        :disabled="currentStep === 1"
      >
        <ChevronLeft class="w-4 h-4 mr-2" />
        {{ $t('common.previous') }}
      </Button>

      <div class="flex items-center gap-3">
        <Button variant="outline" @click="saveDraft" :disabled="isSubmitting">
          {{ $t('jobPosting.saveDraft') }}
        </Button>

        <Button
          v-if="currentStep < totalSteps"
          @click="nextStep"
          :disabled="!canProceed"
        >
          {{ $t('common.next') }}
          <ChevronRight class="w-4 h-4 ml-2" />
        </Button>

        <Button
          v-else
          @click="submitJob"
          :disabled="!canSubmit || isSubmitting"
          class="bg-primary hover:bg-primary/90"
        >
          <div
            v-if="isSubmitting"
            class="animate-spin w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full"
          ></div>
          {{
            isSubmitting ? $t('jobPosting.posting') : $t('jobPosting.postJob')
          }}
        </Button>
      </div>
    </div>

    <!-- Custom Service Modal -->
    <CustomServiceModal
      v-if="showCustomServiceForm"
      @close="showCustomServiceForm = false"
      @service-created="handleCustomServiceCreated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Clock,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Home,
  Car,
  Paintbrush,
  Zap,
  Droplets,
} from 'lucide-vue-next';
import LocationInput from '@/components/ui/LocationInput.vue';
import DateTimePicker from '@/components/ui/DateTimePicker.vue';
import PhotoUpload from '@/components/ui/PhotoUpload.vue';
import CustomServiceModal from './CustomServiceModal.vue';

const { t } = useI18n();
const router = useRouter();

// Component state
const currentStep = ref(1);
const totalSteps = 4;
const isSubmitting = ref(false);
const showCustomServiceForm = ref(false);

// Job data
const jobData = ref({
  title: '',
  description: '',
  location: '',
  photos: [],
  budgetMin: null,
  budgetMax: null,
  preferredDateTime: '',
  urgency: 'normal',
});

const selectedService = ref(null);
const selectedBudgetRange = ref('');

// Mock data - replace with actual API calls
const availableServices = ref([
  {
    id: 1,
    name_en: 'Plumbing',
    category: 'home',
    description_en: 'Pipes, leaks, installations',
  },
  {
    id: 2,
    name_en: 'Electrical',
    category: 'electrical',
    description_en: 'Wiring, outlets, repairs',
  },
  {
    id: 3,
    name_en: 'Painting',
    category: 'painting',
    description_en: 'Interior and exterior painting',
  },
  {
    id: 4,
    name_en: 'Cleaning',
    category: 'cleaning',
    description_en: 'House and office cleaning',
  },
]);

const jobTemplates = ref([
  {
    id: 1,
    title: 'Bathroom Plumbing Repair',
    description: 'Fix leaky faucet and replace toilet',
    estimated_duration: '2-4 hours',
    budget_range: '150-300',
  },
  {
    id: 2,
    title: 'Room Painting',
    description: 'Paint bedroom walls with primer',
    estimated_duration: '1-2 days',
    budget_range: '200-500',
  },
]);

const budgetSuggestions = ref([
  { range: '50-150', description: 'Small repairs' },
  { range: '150-300', description: 'Medium projects' },
  { range: '300-500', description: 'Large projects' },
]);

const urgencyOptions = ref([
  {
    value: 'low',
    label: t('jobPosting.flexible'),
    description: t('jobPosting.flexibleDescription'),
    icon: Clock,
  },
  {
    value: 'normal',
    label: t('jobPosting.normal'),
    description: t('jobPosting.normalDescription'),
    icon: Calendar,
  },
  {
    value: 'urgent',
    label: t('jobPosting.urgent'),
    description: t('jobPosting.urgentDescription'),
    icon: Zap,
  },
]);

// Computed properties
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return selectedService.value !== null;
    case 2:
      return jobData.value.description.length > 10 && jobData.value.location;
    case 3:
      return jobData.value.budgetMin && jobData.value.budgetMax;
    case 4:
      return true;
    default:
      return false;
  }
});

const canSubmit = computed(() => {
  return (
    selectedService.value &&
    jobData.value.description &&
    jobData.value.location &&
    jobData.value.budgetMin &&
    jobData.value.budgetMax
  );
});

const estimatedResponses = computed(() => {
  // Simple algorithm to estimate responses based on budget and urgency
  let base = 3;
  if (jobData.value.budgetMax > 300) base += 2;
  if (jobData.value.urgency === 'urgent') base += 1;
  return `${base}-${base + 3}`;
});

// Methods
const selectService = (service) => {
  selectedService.value = service;
};

const getServiceIcon = (category) => {
  const icons = {
    home: Home,
    electrical: Zap,
    plumbing: Droplets,
    painting: Paintbrush,
    cleaning: Home,
    automotive: Car,
  };
  return icons[category] || Wrench;
};

const applyTemplate = (template) => {
  jobData.value.title = template.title;
  jobData.value.description = template.description;
  const [min, max] = template.budget_range.split('-');
  jobData.value.budgetMin = parseInt(min);
  jobData.value.budgetMax = parseInt(max);
};

const selectBudgetRange = (suggestion) => {
  selectedBudgetRange.value = suggestion.range;
  const [min, max] = suggestion.range.split('-');
  jobData.value.budgetMin = parseInt(min);
  jobData.value.budgetMax = parseInt(max);
};

const nextStep = () => {
  if (canProceed.value && currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const saveDraft = async () => {
  // Implement save draft functionality
  console.log('Saving draft...', jobData.value);
};

const submitJob = async () => {
  if (!canSubmit.value) return;

  isSubmitting.value = true;
  try {
    // Implement job submission
    console.log('Submitting job...', {
      service: selectedService.value,
      ...jobData.value,
    });

    // Redirect to job details or dashboard
    router.push('/dashboard');
  } catch (error) {
    console.error('Error submitting job:', error);
  } finally {
    isSubmitting.value = false;
  }
};

const handlePhotoError = (error) => {
  console.error('Photo upload error:', error);
};

const handleCustomServiceCreated = (service) => {
  availableServices.value.push(service);
  selectedService.value = service;
  showCustomServiceForm.value = false;
};

const formatDate = (dateString) => {
  if (!dateString) return t('jobPosting.asap');
  return new Date(dateString).toLocaleDateString();
};

const getUrgencyVariant = (urgency) => {
  switch (urgency) {
    case 'urgent':
      return 'destructive';
    case 'normal':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getUrgencyLabel = (urgency) => {
  const option = urgencyOptions.value.find((opt) => opt.value === urgency);
  return option?.label || urgency;
};

// Lifecycle
onMounted(() => {
  // Load any existing draft or service from route params
});
</script>

<style scoped>
.service-card:hover {
  transform: translateY(-2px);
}

.template-card:hover,
.budget-card:hover,
.urgency-card:hover {
  transform: translateY(-1px);
}
</style>
