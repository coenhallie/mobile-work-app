import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { processSupabaseImageUrl } from '../lib/supabaseUtils.js'; // Import utility function
import { useAuthenticatedDataFetching } from '../composables/useAuth'; // Import centralized auth
import { useJobImagesStore } from './jobImages.js'; // Import job images store

// Helper function to validate UUID format
export const isValidUUID = (id) => {
  if (!id) return false;
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// Define job status constants
// These represent the complete lifecycle of a job from creation to completion
export const JOB_STATUS = {
  OPEN: 'open', // Job is available for contractors to apply
  ASSIGNED: 'assigned', // Job has been assigned to a contractor but work hasn't started
  IN_PROGRESS: 'in_progress', // Contractor has started working on the job
  COMPLETED: 'completed', // Contractor has marked the job as complete, awaiting client review
  IN_REVIEW: 'in_review', // Client is reviewing the completed work
  FINALIZED: 'finalized', // Job is complete and payment has been processed
  CANCELLED: 'cancelled', // Job has been cancelled by the client

  // NOTE: There is a legacy status 'pending_assignment' that was renamed to 'assigned'.
  // Some jobs in the database may still have this status. The UI components have been
  // updated to handle this legacy status, but it should be migrated to 'assigned' in the database.
};

export const useJobStore = defineStore('job', () => {
  // Use centralized authentication system
  const auth = useAuthenticatedDataFetching();

  // State
  const jobs = ref([]);
  const currentJob = ref(null);
  const isLoading = ref(false);
  const error = ref(null);
  const lastFetchTime = ref(null);
  const searchQuery = ref('');
  const selectedCategory = ref('');
  const selectedLocation = ref('');
  const sortBy = ref('created_at');
  const sortOrder = ref('desc');

  // Additional state for contractor-specific functionality
  const contractorJobs = ref([]);
  const openJobs = ref([]);
  const userJobs = ref([]);

  // Cache management
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const isCacheValid = computed(() => {
    if (!lastFetchTime.value) return false;
    return Date.now() - lastFetchTime.value < CACHE_DURATION;
  });

  // Computed properties
  const filteredJobs = computed(() => {
    let filtered = jobs.value;

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(query) ||
          job.description?.toLowerCase().includes(query) ||
          job.category?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory.value) {
      filtered = filtered.filter(
        (job) => job.category === selectedCategory.value
      );
    }

    if (selectedLocation.value) {
      filtered = filtered.filter(
        (job) => job.location === selectedLocation.value
      );
    }

    // Sort jobs
    filtered.sort((a, b) => {
      const aValue = a[sortBy.value];
      const bValue = b[sortBy.value];

      if (sortOrder.value === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  });

  const jobCount = computed(() => jobs.value.length);
  const hasJobs = computed(() => jobCount.value > 0);

  // Computed for filters
  const filtersAreActive = computed(() => {
    return !!(
      searchQuery.value ||
      selectedCategory.value ||
      selectedLocation.value
    );
  });

  // Helper function to execute data fetching with proper auth
  const executeWithAuth = async (operation, requireAuth = true) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Check if auth is required and user is authenticated
      if (requireAuth && !auth.isSignedIn.value) {
        throw new Error('Authentication required');
      }

      // Get Supabase client and execute operation
      const supabase = auth.getSupabaseClient();
      return await operation(supabase);
    } catch (err) {
      console.error('[JobStore] Operation failed:', err);
      error.value = err.message || 'An error occurred';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Fetch all jobs
  const fetchJobs = async (forceRefresh = false) => {
    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid.value && jobs.value.length > 0) {
      console.log('[JobStore] Using cached jobs data');
      return jobs.value;
    }

    console.log('[JobStore] Fetching jobs from database...');

    return executeWithAuth(async (supabase) => {
      const { data, error: fetchError } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch jobs: ${fetchError.message}`);
      }

      // Process image URLs and fetch applicant count for each job
      const processedJobs = await Promise.all(
        data.map(async (job) => {
          // Get applicant count for this job
          const { count: applicantCount } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);

          return {
            ...job,
            image_urls:
              job.image_urls?.map((url) =>
                processSupabaseImageUrl(url, { bucketName: 'job-images' })
              ) || [],
            applicant_count: applicantCount || 0,
          };
        })
      );

      jobs.value = processedJobs;
      lastFetchTime.value = Date.now();

      console.log(
        `[JobStore] Successfully fetched ${processedJobs.length} jobs`
      );
      return processedJobs;
    }, false); // Don't require auth for fetching jobs (public data)
  };

  // Fetch a specific job by ID
  const fetchJobById = async (jobId) => {
    if (!isValidUUID(jobId)) {
      throw new Error('Invalid job ID format');
    }

    console.log(`[JobStore] Fetching job with ID: ${jobId}`);

    return executeWithAuth(async (supabase) => {
      // Enhanced query to include contractor information when assigned
      const { data, error: fetchError } = await supabase
        .from('job_postings')
        .select(
          `
          *,
          contractor_profiles (
            full_name,
            bio,
            profile_picture_url,
            skills,
            average_rating
          )
        `
        )
        .eq('id', jobId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          throw new Error('Job not found');
        }
        throw new Error(`Failed to fetch job: ${fetchError.message}`);
      }

      // Ensure data is not null before processing
      if (!data) {
        currentJob.value = null;
        console.log('[JobStore] Job not found or no data returned.');
        return null;
      }

      // Get applicant count for this job
      const { count: applicantCount } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId);

      // Process image URLs and applicant count
      const processedJob = {
        ...data,
        photos:
          data.photos?.map((url) =>
            processSupabaseImageUrl(url, { bucketName: 'job-images' })
          ) || [],
        applicant_count: applicantCount || 0,
        assignedContractor: data.contractor_profiles,
      };

      currentJob.value = processedJob;

      // Use category_name for logging as 'title' does not exist on job_postings
      console.log(
        '[JobStore] Successfully fetched job:',
        processedJob.category_name,
        processedJob.assignedContractor
          ? 'with assigned contractor'
          : 'without assigned contractor'
      );
      return processedJob;
    }, false); // Don't require auth for fetching individual jobs (public data)
  };

  // Add a new job with image upload support
  const addJob = async (jobData) => {
    console.log('[JobStore] Adding new job with image support...');

    return executeWithAuth(async (supabase) => {
      // First, create the job without images
      const jobPayload = {
        category_id: jobData.category_id,
        category_name: jobData.categoryName,
        description: jobData.description,
        preferred_datetime: jobData.preferredDateTime,
        posted_by_user_id: jobData.posted_by_user_id,
        status: jobData.status || 'open',
        photos: [], // Initialize empty photos array
      };

      console.log('[JobStore] Creating job with payload:', jobPayload);

      const { data: createdJob, error: createError } = await supabase
        .from('job_postings')
        .insert([jobPayload])
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create job: ${createError.message}`);
      }

      console.log('[JobStore] Job created successfully:', createdJob.id);

      // If there are images to upload, handle them
      if (jobData.images && jobData.images.length > 0) {
        console.log(`[JobStore] Uploading ${jobData.images.length} images...`);

        const jobImagesStore = useJobImagesStore();
        const uploadedImageUrls = [];

        // Upload each image
        for (const imageFile of jobData.images) {
          try {
            const imageUrl = await jobImagesStore.uploadJobImage(
              imageFile,
              createdJob.id
            );
            if (imageUrl) {
              uploadedImageUrls.push(imageUrl);
              console.log('[JobStore] Image uploaded successfully:', imageUrl);
            } else {
              console.warn(
                '[JobStore] Failed to upload image:',
                imageFile.name
              );
            }
          } catch (uploadError) {
            console.error('[JobStore] Error uploading image:', uploadError);
            // Continue with other images even if one fails
          }
        }

        // Update the job with the uploaded image URLs
        if (uploadedImageUrls.length > 0) {
          console.log(
            '[JobStore] Updating job with uploaded images:',
            uploadedImageUrls
          );

          const { data: updatedJob, error: updateError } = await supabase
            .from('job_postings')
            .update({ photos: uploadedImageUrls })
            .eq('id', createdJob.id)
            .select()
            .single();

          if (updateError) {
            console.error(
              '[JobStore] Error updating job with images:',
              updateError
            );
            // Job was created but images failed to attach
            // Return the job anyway, but log the error
          } else {
            console.log('[JobStore] Job updated with images successfully');
            // Use the updated job data
            Object.assign(createdJob, updatedJob);
          }
        }
      }

      // Add to local state
      jobs.value.unshift(createdJob);

      console.log('[JobStore] Successfully added job:', createdJob.id);
      return createdJob;
    }, true); // Require auth for creating jobs
  };

  // Update a job (enhanced version with image upload support)
  const updateJob = async (jobId, updates) => {
    if (!isValidUUID(jobId)) {
      throw new Error('Invalid job ID format');
    }

    console.log(`[JobStore] Updating job ${jobId}...`);

    return executeWithAuth(async (supabase) => {
      // Check if this is a complex update with images (from PostJobView)
      if (updates.images || updates.existingPhotos !== undefined) {
        console.log('[JobStore] Handling complex job update with images...');

        // Prepare the basic job data update
        const jobPayload = {
          category_id: updates.category_id,
          category_name: updates.categoryName,
          description: updates.description,
          preferred_datetime: updates.preferredDateTime,
        };

        // Start with existing photos that should be kept
        let finalPhotos = updates.existingPhotos || [];
        console.log('[JobStore] Starting with existing photos:', finalPhotos);

        // Upload new images if any
        if (updates.images && updates.images.length > 0) {
          console.log(
            `[JobStore] Uploading ${updates.images.length} new images...`
          );

          const jobImagesStore = useJobImagesStore();
          const uploadedImageUrls = [];

          // Upload each new image
          for (const imageFile of updates.images) {
            try {
              const imageUrl = await jobImagesStore.uploadJobImage(
                imageFile,
                jobId
              );
              if (imageUrl) {
                uploadedImageUrls.push(imageUrl);
                console.log(
                  '[JobStore] New image uploaded successfully:',
                  imageUrl
                );
              } else {
                console.warn(
                  '[JobStore] Failed to upload image:',
                  imageFile.name
                );
              }
            } catch (uploadError) {
              console.error('[JobStore] Error uploading image:', uploadError);
              // Continue with other images even if one fails
            }
          }

          // Add newly uploaded images to the final photos array
          finalPhotos = [...finalPhotos, ...uploadedImageUrls];
          console.log(
            '[JobStore] Final photos array after uploads:',
            finalPhotos
          );
        }

        // Add photos to the job payload
        jobPayload.photos = finalPhotos;

        // Update the job with all data including photos
        const { data, error: updateError } = await supabase
          .from('job_postings')
          .update(jobPayload)
          .eq('id', jobId)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update job: ${updateError.message}`);
        }

        // Update local state
        const index = jobs.value.findIndex((job) => job.id === jobId);
        if (index !== -1) {
          jobs.value[index] = { ...jobs.value[index], ...data };
        }

        if (currentJob.value?.id === jobId) {
          currentJob.value = { ...currentJob.value, ...data };
        }

        console.log('[JobStore] Successfully updated job with images');
        return data;
      } else {
        // Simple update without image handling (legacy support)
        console.log('[JobStore] Performing simple job update...');

        const { data, error: updateError } = await supabase
          .from('job_postings')
          .update(updates)
          .eq('id', jobId)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Failed to update job: ${updateError.message}`);
        }

        // Update local state
        const index = jobs.value.findIndex((job) => job.id === jobId);
        if (index !== -1) {
          jobs.value[index] = { ...jobs.value[index], ...data };
        }

        if (currentJob.value?.id === jobId) {
          currentJob.value = { ...currentJob.value, ...data };
        }

        console.log('[JobStore] Successfully updated job');
        return data;
      }
    }, true); // Require auth for updating jobs
  };

  // Delete a job
  const deleteJob = async (jobId) => {
    if (!isValidUUID(jobId)) {
      throw new Error('Invalid job ID format');
    }

    console.log(`[JobStore] Deleting job ${jobId}...`);

    return executeWithAuth(async (supabase) => {
      const { error: deleteError } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId);

      if (deleteError) {
        throw new Error(`Failed to delete job: ${deleteError.message}`);
      }

      // Remove from local state
      jobs.value = jobs.value.filter((job) => job.id !== jobId);

      if (currentJob.value?.id === jobId) {
        currentJob.value = null;
      }

      console.log('[JobStore] Successfully deleted job');
    }, true); // Require auth for deleting jobs
  };

  // Search and filter functions
  const setSearchQuery = (query) => {
    searchQuery.value = query;
  };

  const setCategory = (category) => {
    selectedCategory.value = category;
  };

  const setLocation = (location) => {
    selectedLocation.value = location;
  };

  const setSorting = (field, order = 'desc') => {
    sortBy.value = field;
    sortOrder.value = order;
  };

  const clearFilters = () => {
    searchQuery.value = '';
    selectedCategory.value = '';
    selectedLocation.value = '';
    sortBy.value = 'created_at';
    sortOrder.value = 'desc';
  };

  // Clear cache and force refresh
  const clearCache = () => {
    lastFetchTime.value = null;
    jobs.value = [];
    currentJob.value = null;
  };

  // Reset store state
  const reset = () => {
    jobs.value = [];
    currentJob.value = null;
    isLoading.value = false;
    error.value = null;
    lastFetchTime.value = null;
    clearFilters();
  };

  // Fetch contractor-specific jobs
  const fetchContractorJobs = async (contractorId) => {
    if (!contractorId) {
      console.log('[JobStore] fetchContractorJobs called without contractorId');
      return;
    }

    console.log('[JobStore] ===== FETCHING CONTRACTOR JOBS =====');
    console.log('[JobStore] Contractor ID:', contractorId);

    return executeWithAuth(async (supabase) => {
      console.log('[JobStore] Executing database query for contractor jobs...');

      const { data, error: fetchError } = await supabase
        .from('job_applications')
        .select(
          `
          *,
          job:job_id (*)
        `
        )
        .eq('contractor_user_id', contractorId)
        .eq('status', 'selected')
        .order('created_at', { ascending: false });

      console.log('[JobStore] Database query completed:', {
        success: !fetchError,
        dataLength: data?.length || 0,
        data: data,
        error: fetchError,
      });

      if (fetchError) {
        throw new Error(
          `Failed to fetch contractor jobs: ${fetchError.message}`
        );
      }

      // Extract jobs from applications and process image URLs with applicant count
      const processedJobs = await Promise.all(
        data.map(async (application) => {
          // Check if job data exists
          if (!application.job) {
            return null;
          }

          // Get applicant count for this job
          const { count: applicantCount } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', application.job.id);

          return {
            ...application.job,
            application_id: application.id,
            application_status: application.status,
            photos:
              application.job?.photos?.map((url) =>
                processSupabaseImageUrl(url, { bucketName: 'job-images' })
              ) || [],
            applicant_count: applicantCount || 0,
          };
        })
      );

      // Filter out null entries
      const validJobs = processedJobs.filter((job) => job !== null);

      contractorJobs.value = validJobs;
      return validJobs;
    }, true);
  };

  // Fetch open jobs (available for application)
  const fetchOpenJobs = async () => {
    return executeWithAuth(async (supabase) => {
      const { data, error: fetchError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch open jobs: ${fetchError.message}`);
      }

      // Process image URLs and fetch applicant count for each job
      const processedJobs = await Promise.all(
        data.map(async (job) => {
          // Get applicant count for this job
          const { count: applicantCount } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);

          return {
            ...job,
            image_urls:
              job.image_urls?.map((url) =>
                processSupabaseImageUrl(url, { bucketName: 'job-images' })
              ) || [],
            applicant_count: applicantCount || 0,
          };
        })
      );

      openJobs.value = processedJobs;
      return processedJobs;
    }, false);
  };

  // Fetch jobs posted by a specific user (client)
  const fetchJobsByUser = async (userId) => {
    if (!userId) return;

    return executeWithAuth(async (supabase) => {
      const { data, error: fetchError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('posted_by_user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Failed to fetch user jobs: ${fetchError.message}`);
      }

      // Process image URLs and fetch applicant count for each job
      const processedJobs = await Promise.all(
        data.map(async (job) => {
          // Get applicant count for this job
          const { count: applicantCount } = await supabase
            .from('job_applications')
            .select('*', { count: 'exact', head: true })
            .eq('job_id', job.id);

          return {
            ...job,
            image_urls:
              job.image_urls?.map((url) =>
                processSupabaseImageUrl(url, { bucketName: 'job-images' })
              ) || [],
            applicant_count: applicantCount || 0,
          };
        })
      );

      // Store in userJobs for client view
      userJobs.value = processedJobs;
      return processedJobs;
    }, true); // Require auth for fetching user's own jobs
  };

  // Apply to a job
  const applyToJob = async (jobId, contractorId) => {
    return executeWithAuth(async (supabase) => {
      const { data, error: applyError } = await supabase
        .from('job_applications')
        .insert([
          {
            job_id: jobId,
            contractor_user_id: contractorId,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (applyError) {
        throw new Error(`Failed to apply to job: ${applyError.message}`);
      }

      return { success: true, data, applicationId: data.id };
    }, true);
  };

  // Mark job as in progress
  const markJobInProgress = async (jobId) => {
    return updateJob(jobId, { status: 'in_progress' });
  };

  // Mark job as completed
  const markJobCompleted = async (jobId) => {
    return updateJob(jobId, { status: 'completed' });
  };

  // Clear user jobs
  const clearUserJobs = () => {
    userJobs.value = [];
  };

  // Clear contractor jobs
  const clearContractorJobs = () => {
    contractorJobs.value = [];
  };

  // Reset store function for cleanup
  const resetStore = () => {
    jobs.value = [];
    contractorJobs.value = [];
    openJobs.value = [];
    userJobs.value = [];
    currentJob.value = null;
    isLoading.value = false;
    error.value = null;
    lastFetchTime.value = null;
    clearFilters();
  };

  return {
    // State
    jobs: computed(() => jobs.value),
    contractorJobs: computed(() => contractorJobs.value),
    openJobs: computed(() => openJobs.value),
    userJobs: computed(() => userJobs.value),
    currentJob: computed(() => currentJob.value),
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),

    // Computed
    filteredJobs,
    jobCount,
    hasJobs,
    isCacheValid,
    filtersAreActive,

    // Filter state
    searchQuery: computed(() => searchQuery.value),
    selectedCategory: computed(() => selectedCategory.value),
    selectedLocation: computed(() => selectedLocation.value),
    sortBy: computed(() => sortBy.value),
    sortOrder: computed(() => sortOrder.value),

    // Actions
    fetchJobs,
    fetchJobById,
    fetchContractorJobs,
    fetchOpenJobs,
    fetchJobsByUser,
    addJob,
    updateJob,
    deleteJob,
    applyToJob,
    markJobInProgress,
    markJobCompleted,

    // Filter actions
    setSearchQuery,
    setCategory,
    setLocation,
    setSorting,
    clearFilters,

    // Utility actions
    clearCache,
    clearUserJobs,
    clearContractorJobs,
    reset,
    resetStore,

    // Constants
    JOB_STATUS,

    // Auth state from composable
    isAuthReady: computed(() => auth.isAuthReady.value),
    isAuthenticated: computed(() => auth.isAuthenticated.value),
  };
});
