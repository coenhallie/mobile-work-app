<template>
  <div
    class="w-full max-w-7xl mx-auto px-4 py-6 bg-white dark:bg-gray-900 min-h-screen"
  >
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-normal text-gray-900 dark:text-white mb-2">
        Post a Job
      </h1>
      <p class="text-gray-600 dark:text-gray-400 text-sm">
        Create a new job posting to find the right contractor
      </p>
    </div>

    <div
      class="max-w-lg mx-auto bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow"
    >
      <form @submit.prevent="submitForm">
        <div class="grid gap-2 mb-4">
          <Label for="description">Job Description</Label>
          <Textarea
            id="description"
            v-model="description"
            required
            :placeholder="t('jobs.describeWorkPlaceholder')"
            class="min-h-[80px]"
          />
        </div>

        <!-- Location Input -->
        <div class="grid gap-2 mb-4">
          <LocationInput
            v-model="locationText"
            label="Job Location"
            :placeholder="
              clientLocation
                ? `Default: ${clientLocation}`
                : 'Enter job location'
            "
            help-text="Specify where the work needs to be done. This helps contractors find jobs in their service area."
          />
        </div>

        <div class="mb-4">
          <div class="grid gap-2">
            <Label for="photos">Upload Photos (Optional)</Label>
            <div
              class="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              :class="{
                'border-primary': isDragging,
                'border-border': !isDragging,
                'opacity-50': isLoading,
              }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop"
              @click="$refs.photosInput.click()"
              :aria-disabled="isLoading"
            >
              <input
                ref="photosInput"
                type="file"
                id="photos"
                class="hidden"
                accept="image/*"
                multiple
                @change="handleFileChange"
                :disabled="isLoading"
              />

              <div v-if="photosPreviews.length === 0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-10 w-10 mx-auto text-muted-foreground"
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
                <p class="mt-2 text-sm text-gray-500">
                  Drag and drop images here, or click to select
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  JPG, PNG or GIF (max 2MB each)
                </p>
              </div>
            </div>
            <p class="text-xs text-muted-foreground">
              You can upload up to 5 images to help describe your job.
            </p>
          </div>

          <!-- Photo previews grid -->
          <div v-if="photosPreviews.length > 0" class="mt-4">
            <h4 class="text-sm font-medium mb-2">
              Selected Photos ({{ photosPreviews.length }})
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                v-for="(preview, index) in photosPreviews"
                :key="index"
                class="relative aspect-square rounded-md overflow-hidden border"
              >
                <img
                  :src="preview"
                  alt="Job photo preview"
                  class="w-full h-full object-cover"
                />
                <button
                  type="button"
                  @click.prevent="removePhoto(index)"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  title="Remove photo"
                  :disabled="isLoading"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Upload status message -->
          <div v-if="photoUploadStatus" class="mt-2">
            <p
              :class="[
                'text-sm px-3 py-2 rounded-md',
                photoUploadStatus.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700',
              ]"
            >
              {{ photoUploadStatus.message }}
            </p>
          </div>
        </div>

        <div class="grid gap-2 mb-6">
          <Label for="datetime">Preferred Date & Time (Optional)</Label>
          <DateTimePicker v-model="preferredDateTime" />
          <p class="text-xs text-muted-foreground">
            Let the contractor know when you'd ideally like the service done.
          </p>
        </div>

        <p v-if="errorMsg" class="mt-2 text-sm text-red-600">{{ errorMsg }}</p>
        <Button type="submit" :disabled="isLoading" class="w-full">
          {{
            isLoading
              ? isEditMode
                ? 'Updating Job...'
                : 'Posting Job...'
              : isEditMode
                ? 'Update Job Request'
                : $t('postJobView.titleRequest')
          }}
        </Button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useJobStore } from '../stores/job';
import { useAuth } from '../composables/useAuth';
import { useI18n } from 'vue-i18n';
import { supabase } from '../lib/supabaseClientManager';
console.log('[DEBUG] PostJobView: Imported supabase =', supabase);

const { t } = useI18n();
import { Button } from '@/components/ui/button'; // Import Shadcn Button
import { Input } from '@/components/ui/input'; // Import Shadcn Input
import { Label } from '@/components/ui/label'; // Import Shadcn Label
import { Textarea } from '@/components/ui/textarea'; // Import Shadcn Textarea
import DateTimePicker from '@/components/ui/DateTimePicker.vue'; // Import custom DateTimePicker
import LocationInput from '@/components/ui/LocationInput.vue'; // Import custom LocationInput
import { processSupabaseImageUrl } from '../lib/supabaseUtils.js'; // Import utility function

const route = useRoute();
const router = useRouter();
const jobStore = useJobStore();
const { isSignedIn, userId } = useAuth(); // Get Supabase auth state and user ID

const description = ref('');
const preferredDateTime = ref('');
const locationText = ref(''); // New field for job location
const clientLocation = ref(''); // Store client's default location
const selectedFiles = ref([]);
const isLoading = ref(false);
const errorMsg = ref('');
const isDragging = ref(false); // Track if user is dragging files over the drop zone
const photosPreviews = ref([]); // Store photo preview URLs
const photoUploadStatus = ref(null); // Track upload status messages
const existingPhotos = ref([]); // Store existing photos from the job

// Service-centric state management
const currentService = ref(null);
const parentCategoryName = ref('');

// Get service ID from route params (changed from categoryId)
const serviceId = computed(() => route.params.serviceId);

// Check if we're in edit mode by looking for a jobId parameter
const isEditMode = computed(() => !!route.params.jobId);
const jobId = computed(() => route.params.jobId);

// Computed property for service name display
const serviceName = computed(() => {
  if (currentService.value) {
    return (
      currentService.value.name_es ||
      currentService.value.name_en ||
      'Unknown Service'
    );
  }
  return 'Loading...';
});

// Function to fetch service details and parent category
const fetchServiceDetails = async (serviceIdValue) => {
  if (!serviceIdValue) return;

  try {
    isLoading.value = true;

    // Fetch service details
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('id, name_en, name_es, category_id, keywords_en, keywords_es')
      .eq('id', serviceIdValue)
      .single();

    if (serviceError) {
      console.error('Error fetching service details:', serviceError);
      errorMsg.value = 'Failed to load service details.';
      return;
    }

    if (serviceData) {
      currentService.value = serviceData;

      // Fetch parent category name
      const { data: categoryData, error: categoryError } = await supabase
        .from('service_categories')
        .select('name_es, name_en')
        .eq('id', serviceData.category_id)
        .single();

      if (categoryError) {
        console.error('Error fetching category details:', categoryError);
      } else if (categoryData) {
        parentCategoryName.value =
          categoryData.name_es || categoryData.name_en || 'Unknown Category';
      }
    }
  } catch (err) {
    console.error('Error in fetchServiceDetails:', err);
    errorMsg.value = 'Error loading service information.';
  } finally {
    isLoading.value = false;
  }
};

const handleFileChange = (event) => {
  if (isLoading.value) return;

  const files = Array.from(event.target.files);
  if (files.length > 0) {
    processFiles(files);
  }

  // Reset the file input to allow selecting the same files again if needed
  event.target.value = '';
};

const handleFileDrop = (event) => {
  if (isLoading.value) return;

  isDragging.value = false;
  const files = Array.from(event.dataTransfer.files).filter((file) =>
    file.type.startsWith('image/')
  );

  if (files.length > 0) {
    processFiles(files);
  }
};

const processFiles = (files) => {
  // Count existing photos (non-null values in existingPhotos)
  const existingPhotoCount = isEditMode.value
    ? existingPhotos.value.filter((photo) => photo !== null).length
    : 0;

  // Limit to 5 photos total (existing + already selected + new)
  const totalPhotos =
    existingPhotoCount + selectedFiles.value.length + files.length;
  console.log(
    `Processing files: ${files.length} new files, ${existingPhotoCount} existing photos, ${selectedFiles.value.length} already selected`
  );

  if (totalPhotos > 5) {
    photoUploadStatus.value = {
      type: 'error',
      message:
        'You can upload a maximum of 5 photos. Please remove some photos first.',
    };
    return;
  }

  // Clear previous status
  photoUploadStatus.value = null;

  // Process each file
  const validFiles = [];
  const invalidFiles = [];

  files.forEach((file) => {
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      invalidFiles.push(file.name);
      return;
    }

    validFiles.push(file);

    // Add to selected files array
    selectedFiles.value.push(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      photosPreviews.value.push(e.target.result);
    };
    reader.readAsDataURL(file);
  });

  // Show feedback about the upload
  if (validFiles.length > 0) {
    photoUploadStatus.value = {
      type: 'success',
      message: `${validFiles.length} photo${validFiles.length > 1 ? 's' : ''} added successfully.`,
    };
  }

  if (invalidFiles.length > 0) {
    photoUploadStatus.value = {
      type: 'error',
      message: `${invalidFiles.length} file${invalidFiles.length > 1 ? 's' : ''} exceeded the 2MB size limit and ${invalidFiles.length > 1 ? 'were' : 'was'} not added.`,
    };
  }
};

const removePhoto = (index) => {
  if (isLoading.value) return;

  console.log(`Removing photo at index ${index}`);
  console.log(
    `Before removal: existingPhotos length=${existingPhotos.value.length}, photosPreviews length=${photosPreviews.value.length}, selectedFiles length=${selectedFiles.value.length}`
  );

  // Create a mapping to track which preview corresponds to which existing photo
  const photoMapping = [];
  let existingPhotoIndex = 0;

  // In edit mode, we need to track which photo is being removed
  if (isEditMode.value) {
    // First, create a clean array of existing photos (no nulls)
    const cleanExistingPhotos = existingPhotos.value.filter(
      (photo) => photo !== null
    );

    if (index < photosPreviews.value.length) {
      // Remove the photo from previews
      photosPreviews.value.splice(index, 1);

      // If this is an existing photo (not a newly added one)
      if (index < cleanExistingPhotos.length) {
        // Create a new array without the removed photo
        const updatedExistingPhotos = [...cleanExistingPhotos];
        updatedExistingPhotos.splice(index, 1);
        existingPhotos.value = updatedExistingPhotos;

        console.log(`Removed existing photo at index ${index}`);
        console.log(`Updated existingPhotos:`, existingPhotos.value);
      } else {
        // This is a newly added photo
        const newPhotoIndex = index - cleanExistingPhotos.length;
        selectedFiles.value.splice(newPhotoIndex, 1);
        console.log(
          `Removed newly added photo at index ${newPhotoIndex} of selectedFiles`
        );
      }
    }
  } else {
    // In create mode, simply remove from both arrays
    selectedFiles.value.splice(index, 1);
    photosPreviews.value.splice(index, 1);
  }

  console.log(
    `After removal: existingPhotos length=${existingPhotos.value.length}, photosPreviews length=${photosPreviews.value.length}, selectedFiles length=${selectedFiles.value.length}`
  );

  // Update status message
  photoUploadStatus.value = {
    type: 'success',
    message: 'Photo removed successfully.',
  };

  // Clear status message after a short delay
  setTimeout(() => {
    if (photoUploadStatus.value?.message === 'Photo removed successfully.') {
      photoUploadStatus.value = null;
    }
  }, 3000);
};

// Function to fetch client's location from their profile
const fetchClientLocation = async () => {
  if (!userId.value) return;

  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .select('location')
      .eq('id', userId.value)
      .single();

    if (error) {
      console.error('Error fetching client location:', error);
      return;
    }

    if (data?.location) {
      clientLocation.value = data.location;
      // If no location is set yet, use client's location as default
      if (!locationText.value && !isEditMode.value) {
        locationText.value = data.location;
      }
    }
  } catch (err) {
    console.error('Error fetching client location:', err);
  }
};

// Fetch job data if in edit mode
onMounted(async () => {
  // Scroll to top when component mounts
  window.scrollTo(0, 0);

  // Fetch client's location for default value
  await fetchClientLocation();

  // Fetch service details if serviceId is present
  if (serviceId.value) {
    await fetchServiceDetails(serviceId.value);
  }

  if (isEditMode.value) {
    isLoading.value = true;
    try {
      await jobStore.fetchJobById(jobId.value);

      if (jobStore.currentJob) {
        // Populate form with existing job data
        description.value = jobStore.currentJob.description || '';
        preferredDateTime.value = jobStore.currentJob.preferred_datetime || '';
        locationText.value =
          jobStore.currentJob.location_text || clientLocation.value || '';

        // If job has service_id, fetch service details for edit mode
        if (jobStore.currentJob.service_id) {
          await fetchServiceDetails(jobStore.currentJob.service_id);
        }

        // Load existing photos if available
        if (
          jobStore.currentJob.photos &&
          Array.isArray(jobStore.currentJob.photos)
        ) {
          console.log('Found existing photos:', jobStore.currentJob.photos);

          // Filter out any null or undefined values from the photos array
          const validPhotos = jobStore.currentJob.photos.filter(
            (photo) => photo
          );

          // Store the existing photos (only valid ones)
          existingPhotos.value = [...validPhotos];

          console.log(
            'Filtered valid photos for editing:',
            existingPhotos.value
          );

          // Create preview URLs for existing photos
          validPhotos.forEach((photoUrl) => {
            // Process the URL to ensure it's valid
            const processedUrl = processSupabaseImageUrl(photoUrl, {
              addCacheBuster: true,
              bucketName: 'job-images',
            });
            photosPreviews.value.push(processedUrl);
          });

          console.log(
            'Loaded existing photos into previews:',
            photosPreviews.value
          );
        }
      } else {
        errorMsg.value = 'Could not find the job to edit.';
        router.push('/'); // Redirect home if job not found
      }
    } catch (err) {
      console.error('Error fetching job for editing:', err);
      errorMsg.value =
        'Error loading job data: ' + (err.message || 'Unknown error');
    } finally {
      isLoading.value = false;
    }
  }
});

const handlePostJob = async () => {
  if (!description.value) {
    errorMsg.value = 'Please provide a job description.';
    return;
  }
  // Use Supabase auth state
  if (!isSignedIn.value || !userId.value) {
    errorMsg.value = 'You must be logged in to post a job.';
    return;
  }

  if (!currentService.value) {
    errorMsg.value = 'Service information is not available.';
    return;
  }

  isLoading.value = true;
  errorMsg.value = '';

  try {
    console.log(
      `handlePostJob: isSignedIn=${isSignedIn.value}, userId=${userId.value}`
    );
    const jobData = {
      category_id: currentService.value.category_id, // Use parent category ID
      categoryName: parentCategoryName.value, // Use parent category name
      service_id: currentService.value.id, // Add service ID
      service_keywords:
        currentService.value.keywords_es || currentService.value.keywords_en, // Add service keywords
      description: description.value,
      preferredDateTime: preferredDateTime.value || null,
      location_text: locationText.value || null,
      posted_by_user_id: userId.value,
      status: 'open',
      images: selectedFiles.value, // Add the selected files here
    };

    // Call the async action from the store
    const createdJob = await jobStore.addJob(jobData);

    if (createdJob) {
      console.log('Job successfully added to Supabase:', createdJob.id);
      router.push('/');
    } else {
      errorMsg.value =
        jobStore.error || 'Failed to post job. Please try again.';
    }
  } catch (err) {
    console.error('Error posting job:', err);
    errorMsg.value =
      err.message || 'An unexpected error occurred while posting the job.';
  } finally {
    isLoading.value = false;
  }
};

const handleEditJob = async () => {
  if (!description.value) {
    errorMsg.value = 'Please provide a job description.';
    return;
  }

  if (!isSignedIn.value || !userId.value) {
    errorMsg.value = 'You must be logged in to edit a job.';
    return;
  }

  if (!currentService.value) {
    errorMsg.value = 'Service information is not available.';
    return;
  }

  isLoading.value = true;
  errorMsg.value = '';

  try {
    console.log(`handleEditJob: Editing job ${jobId.value}`);

    // With our new implementation, existingPhotos already contains only the photos to keep
    // No need to filter out nulls anymore
    console.log('Photos to keep:', existingPhotos.value);
    console.log(
      'New photos to upload:',
      selectedFiles.value.map((f) => f.name)
    );

    // Prepare job data for update
    const jobData = {
      category_id: currentService.value.category_id, // Use parent category ID
      categoryName: parentCategoryName.value, // Use parent category name
      service_id: currentService.value.id, // Add service ID
      service_keywords:
        currentService.value.keywords_es || currentService.value.keywords_en, // Add service keywords
      description: description.value,
      preferredDateTime: preferredDateTime.value || null,
      location_text: locationText.value || null,
      images: selectedFiles.value, // New files to upload
      existingPhotos: existingPhotos.value, // Existing photos to keep (already filtered)
    };

    // Call the update job action from the store
    const updatedJob = await jobStore.updateJob(jobId.value, jobData);

    if (updatedJob) {
      console.log('Job successfully updated in Supabase:', updatedJob.id);
      // Redirect to the job details page
      router.push({ name: 'JobDetails', params: { jobId: jobId.value } });
    } else {
      errorMsg.value =
        jobStore.error || 'Failed to update job. Please try again.';
    }
  } catch (err) {
    console.error('Error updating job:', err);
    errorMsg.value =
      err.message || 'An unexpected error occurred while updating the job.';
  } finally {
    isLoading.value = false;
  }
};

// Function to handle form submission based on mode
const submitForm = () => {
  if (isEditMode.value) {
    handleEditJob();
  } else {
    handlePostJob();
  }
};
</script>

<style scoped>
/* Scoped styles for PostJobView */

.skill-card {
  aspect-ratio: 1 / 1;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Add hover effect similar to category cards */
.skill-card:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
  will-change: transform;
}

/* Ensure smooth transitions with hardware acceleration */
.skill-card {
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
  backface-visibility: hidden;
  transform: translateZ(0);
  will-change: transform;
}
</style>
