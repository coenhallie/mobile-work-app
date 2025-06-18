/**
 * JobStoreOptimizer - Utility functions to optimize the job store
 * This file contains optimized versions of key job store functions
 * that can be used to replace the existing implementations.
 */

import { ref, computed } from 'vue';
import { isValidUUID } from './supabaseUtils';

/**
 * Creates an optimized version of the fetchJobById function
 *
 * @param {Function} getSupabase - Function to get the Supabase client
 * @param {Object} state - Object containing reactive state (isLoading, error, _currentJob)
 * @param {Object} cache - Object containing cache state
 * @returns {Function} - Optimized fetchJobById function
 */
export function createOptimizedFetchJobById(getSupabase, state, cache) {
  // Initialize cache if not provided
  const jobCache = cache || ref({});

  return async function fetchJobById(jobId, options = {}) {
    const { refresh = false } = options;

    if (!jobId) {
      state.error.value = 'Invalid job ID: No ID provided';
      state._currentJob.value = null;
      return null;
    }

    // Use the job ID directly (Supabase uses standard UUIDs)
    const processedJobId = jobId;

    // Validate the processed ID
    if (!isValidUUID(processedJobId)) {
      state.error.value = `Invalid job ID format: ${processedJobId}`;
      state._currentJob.value = null;
      return null;
    }

    // Check cache first if not forcing refresh
    if (!refresh && jobCache.value[processedJobId]) {
      state._currentJob.value = jobCache.value[processedJobId];
      return state._currentJob.value;
    }

    // Proceed with fetching from database
    state.isLoading.value = true;
    state.error.value = null;

    try {
      const { data, error: fetchError } = await getSupabase()
        .from('job_postings')
        .select('*')
        .eq('id', processedJobId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          state.error.value = `Job not found: ${processedJobId}`;
        } else {
          state.error.value = fetchError.message;
        }
        state._currentJob.value = null;
        return null;
      }

      // Process photos field if it exists
      if (data && data.photos) {
        // If photos is a string (JSON), parse it into an array
        if (typeof data.photos === 'string') {
          try {
            data.photos = JSON.parse(data.photos);
          } catch (parseErr) {
            data.photos = []; // Set to empty array if parsing fails
          }
        }
        // If photos is neither an array nor a string, set to empty array
        else if (!Array.isArray(data.photos)) {
          data.photos = [];
        }
      }

      // Update cache and current job
      jobCache.value[processedJobId] = data;
      state._currentJob.value = data;

      return data;
    } catch (err) {
      state.error.value = err.message;
      state._currentJob.value = null;
      return null;
    } finally {
      state.isLoading.value = false;
    }
  };
}

/**
 * Creates an optimized version of the fetchOpenJobs function
 *
 * @param {Function} getSupabase - Function to get the Supabase client
 * @param {Object} state - Object containing reactive state (isLoading, error, _openJobs)
 * @param {Object} filters - Object containing active filters
 * @returns {Function} - Optimized fetchOpenJobs function
 */
export function createOptimizedFetchOpenJobs(getSupabase, state, filters) {
  return async function fetchOpenJobs(options = {}) {
    const { refresh = false, page = 1, limit = 20 } = options;

    // Skip if we already have data and not forcing refresh
    if (!refresh && state._openJobs.value.length > 0 && page === 1) {
      return {
        jobs: state._openJobs.value,
        page,
        hasMore: false, // Conservative assumption
      };
    }

    state.isLoading.value = true;
    state.error.value = null;

    try {
      // Calculate pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Start building the query
      let query = getSupabase()
        .from('job_postings')
        .select('*')
        .eq('status', 'open');

      // Apply filters if they exist
      if (filters.value.location && filters.value.location.trim() !== '') {
        query = query.ilike('location_text', `%${filters.value.location}%`);
      }

      if (filters.value.budget) {
        const budgetValue = parseFloat(filters.value.budget);
        if (!isNaN(budgetValue)) {
          query = query.lte('budget_min', budgetValue);
          query = query.gte('budget_max', budgetValue);
        }
      }

      if (filters.value.urgency) {
        query = query.eq('urgency_level', filters.value.urgency);
      }

      if (filters.value.category) {
        query = query.eq('category_name', filters.value.category);
      }

      // Add pagination and ordering
      query = query.order('created_at', { ascending: false }).range(from, to);

      // Execute the query
      const { data, error: fetchError } = await query;

      if (fetchError) {
        state.error.value = fetchError.message;
        return {
          jobs: page === 1 ? [] : state._openJobs.value,
          page,
          hasMore: false,
          error: fetchError.message,
        };
      }

      // Update state based on pagination
      if (page === 1) {
        state._openJobs.value = data || [];
      } else {
        // Append new jobs, avoiding duplicates by ID
        const existingIds = new Set(state._openJobs.value.map((job) => job.id));
        const newJobs = (data || []).filter((job) => !existingIds.has(job.id));
        state._openJobs.value = [...state._openJobs.value, ...newJobs];
      }

      return {
        jobs: state._openJobs.value,
        page,
        hasMore: (data || []).length === limit, // If we got a full page, there might be more
      };
    } catch (err) {
      state.error.value = err.message;

      return {
        jobs: page === 1 ? [] : state._openJobs.value,
        page,
        hasMore: false,
        error: err.message,
      };
    } finally {
      state.isLoading.value = false;
    }
  };
}

/**
 * Creates an optimized version of the updateJobStatus function
 *
 * @param {Function} getSupabase - Function to get the Supabase client
 * @param {Object} state - Object containing reactive state (isLoading, error)
 * @param {Function} fetchJobById - Function to fetch job by ID
 * @returns {Function} - Optimized updateJobStatus function
 */
export function createOptimizedUpdateJobStatus(
  getSupabase,
  state,
  fetchJobById
) {
  return async function updateJobStatus(jobId, newStatus) {
    if (!jobId || !newStatus) {
      state.error.value = 'Job ID and new status are required';
      return false;
    }

    // Use the job ID directly (Supabase uses standard UUIDs)
    const processedJobId = jobId;

    // Validate the processed ID
    if (!isValidUUID(processedJobId)) {
      state.error.value = `Invalid job ID format: ${processedJobId}`;
      return false;
    }

    state.isLoading.value = true;
    state.error.value = null;

    try {
      const { data, error: updateError } = await getSupabase()
        .from('job_postings')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', processedJobId)
        .select();

      if (updateError) {
        state.error.value = updateError.message;
        return false;
      }

      // Refresh the job data
      await fetchJobById(processedJobId, { refresh: true });

      return true;
    } catch (err) {
      state.error.value = err.message;
      return false;
    } finally {
      state.isLoading.value = false;
    }
  };
}

/**
 * Creates an optimized version of the uploadJobImage function
 *
 * @param {Function} getSupabase - Function to get the Supabase client
 * @param {Function} processSupabaseImageUrl - Function to process image URLs
 * @returns {Function} - Optimized uploadJobImage function
 */
export function createOptimizedUploadJobImage(
  getSupabase,
  processSupabaseImageUrl
) {
  return async function uploadJobImage(file, jobId) {
    if (!file || !jobId) {
      return null;
    }

    try {
      // Generate a unique filename
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${jobId}/${fileName}`;

      // Upload the file
      const { error: uploadError } = await getSupabase()
        .storage.from('job-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        return null;
      }

      // Get the public URL
      const { data: urlData } = getSupabase()
        .storage.from('job-images')
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        return null;
      }

      // Process the URL if needed
      const processedUrl = processSupabaseImageUrl
        ? processSupabaseImageUrl(urlData.publicUrl)
        : urlData.publicUrl;

      return processedUrl;
    } catch (err) {
      return null;
    }
  };
}
