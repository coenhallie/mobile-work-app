/**
 * Utility functions for handling Supabase user IDs and related operations
 */

/**
 * Validates if a string is a valid UUID
 *
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if the ID is a valid UUID, false otherwise
 */
export function isValidUUID(id) {
  if (!id) return false;

  // UUID regex pattern
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return uuidRegex.test(id);
}

/**
 * Checks if two IDs match (simple string comparison for Supabase UUIDs)
 *
 * @param {string} id1 - First ID to compare
 * @param {string} id2 - Second ID to compare
 * @returns {boolean} - True if the IDs match, false otherwise
 */
export function idsMatch(id1, id2) {
  if (!id1 || !id2) return false;
  return id1 === id2;
}

/**
 * Safely extracts a UUID (for Supabase, this is just validation)
 *
 * @param {string} id - The ID to process
 * @returns {string} - The UUID if valid, or the original ID
 */
export function extractUUID(id) {
  if (!id) return id;
  return isValidUUID(id) ? id : id;
}

// Image URL cache to avoid processing the same URL multiple times
const imageUrlCache = new Map();

export const processSupabaseImageUrl = (url, options = {}) => {
  if (!url) return null;

  const { addCacheBuster = true, bucketName = 'job-images' } = options;

  // Create a cache key based on the URL and options
  const cacheKey = `${url}-${addCacheBuster}-${bucketName}`;

  // Check if we have this URL in cache
  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey);
  }

  let processedUrl = url;
  const supabaseUrlEnv = import.meta.env.VITE_SUPABASE_URL; // Renamed to avoid conflict

  // Special handling for job-images bucket
  if (bucketName === 'job-images') {
    if (url.includes('/storage/v1/object/public/job-images/')) {
      if (!url.startsWith(supabaseUrlEnv) && supabaseUrlEnv) {
        const pathMatch = url.match(/\/storage\/v1\/object\/public\/(.*)/);
        if (pathMatch && pathMatch[1]) {
          processedUrl = `${supabaseUrlEnv}/storage/v1/object/public/${pathMatch[1]}`;
        }
      }
    } else if (supabaseUrlEnv) {
      let pathPart;
      if (processedUrl.startsWith('/')) {
        pathPart = processedUrl;
      } else if (!processedUrl.startsWith('http')) {
        pathPart = `/${processedUrl}`;
      } else {
        try {
          const urlObj = new URL(processedUrl);
          pathPart = urlObj.pathname;
        } catch (e) {
          // Invalid URL, proceed with pathPart as is, or handle error
          pathPart = processedUrl; // Or some default/error handling
        }
      }

      if (!pathPart.includes(`/job-images/`)) {
        pathPart = `/job-images${pathPart.startsWith('/') ? '' : '/'}${pathPart}`;
      }
      processedUrl = `${supabaseUrlEnv}/storage/v1/object/public${pathPart}`;
    }
  } else {
    const duplicateBucketPattern = new RegExp(
      `/${bucketName}/${bucketName}/`,
      'g'
    );
    if (processedUrl.match(duplicateBucketPattern)) {
      processedUrl = processedUrl.replace(
        duplicateBucketPattern,
        `/${bucketName}/`
      );
    }

    if (
      supabaseUrlEnv &&
      !processedUrl.includes('storage.googleapis.com') &&
      !processedUrl.includes('/storage/v1/')
    ) {
      if (!processedUrl.startsWith(supabaseUrlEnv)) {
        const pathPart = processedUrl.startsWith('/')
          ? processedUrl
          : `/${processedUrl}`;
        const bucketPath = pathPart.includes(`/${bucketName}/`)
          ? pathPart
          : `/${bucketName}${pathPart}`;
        processedUrl = `${supabaseUrlEnv}/storage/v1/object/public${bucketPath}`;
      }
    }
  }

  if (addCacheBuster) {
    const minuteTimestamp = Math.floor(Date.now() / 60000);
    const cacheBuster = `t=${minuteTimestamp}`;
    processedUrl = processedUrl.includes('?')
      ? `${processedUrl}&${cacheBuster}`
      : `${processedUrl}?${cacheBuster}`;
  }

  imageUrlCache.set(cacheKey, processedUrl);

  return processedUrl;
};
