import { defineStore } from 'pinia';
import { ref } from 'vue';
import { processSupabaseImageUrl } from '../lib/supabaseUtils.js';
import { useAuth } from '@/composables/useAuth';

export const useJobImagesStore = defineStore('jobImages', () => {
  const { getSupabaseClient } = useAuth();
  const supabaseRef = ref(null);

  // Initialize Supabase client
  const initSupabase = () => {
    try {
      supabaseRef.value = getSupabaseClient();
    } catch (err) {
      console.error('[JobImagesStore] Error creating Supabase client:', err);
    }
  };

  initSupabase();

  const getSupabase = () => {
    return supabaseRef.value || getSupabaseClient();
  };

  // State
  const isLoading = ref(false);
  const error = ref(null);

  // Actions
  async function uploadJobImage(file, jobId) {
    if (!file || !jobId) {
      console.error('[JobImagesStore] uploadJobImage requires file and jobId');
      return null;
    }

    console.log(`Uploading image for job ${jobId}: ${file.name}`, {
      size: file.size,
      type: file.type,
    });

    isLoading.value = true;
    error.value = null;

    try {
      // Generate a unique filename
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `job-images/${jobId}/${fileName}`;

      console.log(`[JobImagesStore] Uploading to path: ${filePath}`);

      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await getSupabase()
        .storage.from('job-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('[JobImagesStore] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[JobImagesStore] Upload successful:', uploadData);

      // Get the public URL
      const { data: urlData } = getSupabase()
        .storage.from('job-images')
        .getPublicUrl(filePath);

      if (!urlData || !urlData.publicUrl) {
        console.error('[JobImagesStore] Failed to get public URL');
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('[JobImagesStore] Raw public URL:', urlData.publicUrl);

      // Test the direct URL
      try {
        const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
        console.log('[JobImagesStore] Direct URL test result:', {
          status: response.status,
          ok: response.ok,
          url: urlData.publicUrl,
        });
      } catch (fetchError) {
        console.warn('[JobImagesStore] Direct URL test failed:', fetchError);
      }

      // Process the URL to ensure it's properly formatted
      const processedUrl = processSupabaseImageUrl(urlData.publicUrl, {
        width: 800,
        height: 600,
        quality: 85,
      });

      console.log('[JobImagesStore] Processed URL:', processedUrl);

      // Test the processed URL
      try {
        const response = await fetch(processedUrl, { method: 'HEAD' });
        console.log('[JobImagesStore] Processed URL test result:', {
          status: response.status,
          ok: response.ok,
          url: processedUrl,
        });
      } catch (fetchError) {
        console.warn('[JobImagesStore] Processed URL test failed:', fetchError);
      }

      return processedUrl;
    } catch (err) {
      console.error(
        `[JobImagesStore] Error uploading image for job ${jobId}:`,
        err.message
      );
      error.value = err.message;
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  async function removePhotoFromJob(jobId, photoUrl) {
    if (!jobId || !photoUrl) {
      console.error(
        '[JobImagesStore] removePhotoFromJob requires jobId and photoUrl'
      );
      return false;
    }

    console.log(
      `[JobImagesStore] Removing photo from job ${jobId}: ${photoUrl}`
    );
    isLoading.value = true;
    error.value = null;

    try {
      // First, get the current job data
      const { data: jobData, error: fetchError } = await getSupabase()
        .from('job_postings')
        .select('photos')
        .eq('id', jobId)
        .single();

      if (fetchError) {
        console.error('[JobImagesStore] Error fetching job data:', fetchError);
        throw fetchError;
      }

      if (!jobData || !jobData.photos) {
        console.warn('[JobImagesStore] Job has no photos to remove');
        return false;
      }

      // Parse photos if it's a string
      let currentPhotos = jobData.photos;
      if (typeof currentPhotos === 'string') {
        try {
          currentPhotos = JSON.parse(currentPhotos);
        } catch (parseErr) {
          console.error(
            '[JobImagesStore] Error parsing photos JSON:',
            parseErr
          );
          return false;
        }
      }

      if (!Array.isArray(currentPhotos)) {
        console.error(
          '[JobImagesStore] Photos is not an array:',
          currentPhotos
        );
        return false;
      }

      // Remove the photo URL from the array
      const updatedPhotos = currentPhotos.filter((url) => url !== photoUrl);

      console.log('[JobImagesStore] Updated photos array:', updatedPhotos);

      // Update the job with the new photos array
      const { error: updateError } = await getSupabase()
        .from('job_postings')
        .update({ photos: updatedPhotos })
        .eq('id', jobId);

      if (updateError) {
        console.error(
          '[JobImagesStore] Error updating job photos:',
          updateError
        );
        throw updateError;
      }

      // Try to delete the file from storage
      try {
        // Extract the file path from the URL
        const url = new URL(photoUrl);
        const pathParts = url.pathname.split('/');
        const bucketIndex = pathParts.findIndex(
          (part) => part === 'job-images'
        );

        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/');
          console.log('[JobImagesStore] Attempting to delete file:', filePath);

          const { error: deleteError } = await getSupabase()
            .storage.from('job-images')
            .remove([filePath]);

          if (deleteError) {
            console.warn(
              '[JobImagesStore] Error deleting file from storage:',
              deleteError
            );
          } else {
            console.log(
              '[JobImagesStore] Successfully deleted file from storage'
            );
          }
        } else {
          console.warn(
            '[JobImagesStore] Could not extract file path from URL:',
            photoUrl
          );
        }
      } catch (storageError) {
        console.warn(
          '[JobImagesStore] Error during storage cleanup:',
          storageError
        );
      }

      console.log(
        `[JobImagesStore] Successfully removed photo from job ${jobId}`
      );
      return true;
    } catch (err) {
      console.error(
        `[JobImagesStore] Error removing photo from job ${jobId}:`,
        err.message
      );
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    // State
    isLoading,
    error,

    // Actions
    uploadJobImage,
    removePhotoFromJob,
  };
});
