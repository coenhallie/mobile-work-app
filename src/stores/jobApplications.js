import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { processSupabaseImageUrl } from '../lib/supabaseUtils.js';

export const useJobApplicationsStore = defineStore('jobApplications', () => {
  const { getSupabaseClient, isSignedIn } = useAuth();
  const supabaseRef = ref(null);

  // Initialize Supabase client
  const initSupabase = () => {
    try {
      supabaseRef.value = getSupabaseClient();
    } catch (err) {
      console.error(
        '[JobApplicationsStore] Error creating Supabase client:',
        err
      );
    }
  };

  initSupabase();

  const getSupabase = () => {
    return supabaseRef.value || getSupabaseClient();
  };

  // State
  const _jobApplications = ref([]);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const jobApplications = computed(() => _jobApplications.value);

  // Actions
  async function applyToJob(jobId, contractorUserId, message = '') {
    if (!jobId || !contractorUserId) {
      console.error('applyToJob requires jobId and contractorUserId');
      return { success: false, error: 'Missing required parameters' };
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Check if the contractor has already applied to this job
      const { data: existingApplication, error: checkError } =
        await getSupabase()
          .from('job_applications')
          .select('id')
          .eq('job_id', jobId)
          .eq('contractor_user_id', contractorUserId)
          .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingApplication) {
        return {
          success: false,
          error: 'You have already applied to this job',
        };
      }

      // Insert the job application
      const { data: applicationData, error: insertError } = await getSupabase()
        .from('job_applications')
        .insert({
          job_id: jobId,
          contractor_user_id: contractorUserId,
          message: message || '',
          status: 'pending',
          applied_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update job status to show it has applications
      const { error: updateError } = await getSupabase()
        .from('job_postings')
        .update({
          has_applications: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (updateError) {
        console.warn(
          'Failed to update job has_applications flag:',
          updateError
        );
      }

      return {
        success: true,
        application: applicationData,
      };
    } catch (err) {
      console.error(
        `[JobApplicationsStore] Error applying to job ${jobId}:`,
        err.message
      );
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      isLoading.value = false;
    }
  }

  async function getJobApplications(jobId) {
    if (!jobId) {
      _jobApplications.value = [];
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Get job applications first, then fetch contractor profiles separately
      const { data: applicationsData, error: fetchError } = await getSupabase()
        .from('job_applications')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error(`[JobApplicationsStore] Database error:`, fetchError);
        throw fetchError;
      }

      if (!applicationsData || applicationsData.length === 0) {
        _jobApplications.value = [];
        return [];
      }

      // Get unique contractor user IDs
      const contractorUserIds = [
        ...new Set(applicationsData.map((app) => app.contractor_user_id)),
      ];

      // Fetch contractor profiles separately
      console.log(
        '[JobApplicationsStore] Fetching contractor profiles for user IDs:',
        contractorUserIds
      );

      const { data: contractorProfiles, error: profilesError } =
        await getSupabase()
          .from('contractor_profiles')
          .select(
            'id, full_name, bio, skills, years_experience, contact_phone, profile_picture_url, work_photo_urls, service_areas'
          )
          .in('id', contractorUserIds);

      if (profilesError) {
        console.error(
          '[JobApplicationsStore] Error fetching contractor profiles:',
          profilesError
        );
        console.error('[JobApplicationsStore] Error details:', {
          message: profilesError.message,
          code: profilesError.code,
          details: profilesError.details,
          hint: profilesError.hint,
        });
      } else {
        console.log(
          '[JobApplicationsStore] Successfully fetched contractor profiles:',
          contractorProfiles
        );
      }

      // Create a map of contractor profiles by id for easy lookup
      const profilesMap = {};
      (contractorProfiles || []).forEach((profile) => {
        profilesMap[profile.id] = profile;
      });

      // Process applications with proper contractor profile data
      const processedApplications = applicationsData.map((app) => {
        const contractorProfile = profilesMap[app.contractor_user_id] || {};

        return {
          id: app.id,
          job_id: app.job_id,
          contractor_user_id: app.contractor_user_id,
          created_at: app.created_at,
          status: app.status || 'pending',
          message: app.message,
          read: app.is_read || false,
          // Ensure contractor_profiles (plural) for component compatibility
          contractor_profiles: {
            id: contractorProfile.id || app.contractor_user_id,
            full_name: contractorProfile.full_name || 'Unnamed Contractor',
            business_name:
              contractorProfile.business_name || contractorProfile.full_name,
            avatar_url: (() => {
              const rawUrl = contractorProfile.profile_picture_url;

              console.log('[JobApplicationsStore] Processing avatar URL:', {
                rawUrl,
                contractorId: contractorProfile.id,
                contractorName: contractorProfile.full_name,
              });

              // If the URL is already a full URL (like Unsplash), return it as-is
              if (
                rawUrl &&
                (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))
              ) {
                console.log(
                  '[JobApplicationsStore] Using external URL as-is:',
                  rawUrl
                );
                return rawUrl;
              }

              // Otherwise, process it as a Supabase storage URL
              const processedUrl = processSupabaseImageUrl(rawUrl, {
                addCacheBuster: true,
                bucketName: 'profile-images',
              });
              console.log(
                '[JobApplicationsStore] Processed Supabase URL:',
                processedUrl
              );
              return processedUrl;
            })(),
            skills:
              contractorProfile.skills || contractorProfile.specialties || [],
            experience_years: contractorProfile.experience_years
              ? parseInt(contractorProfile.experience_years)
              : 0,
            hourly_rate: contractorProfile.hourly_rate || 0,
            location: contractorProfile.location || 'Unknown',
            rating: contractorProfile.rating || null,
            email: contractorProfile.phone, // Using phone as contact info
          },
        };
      });

      _jobApplications.value = processedApplications;
      return processedApplications;
    } catch (err) {
      console.error(
        `[JobApplicationsStore] Error fetching applications for job ${jobId}:`,
        err.message
      );
      error.value = err.message;
      _jobApplications.value = [];
      return [];
    } finally {
      isLoading.value = false;
    }
  }

  async function selectContractor(jobId, applicationId) {
    if (!jobId || !applicationId) {
      console.error(
        '[JobApplicationsStore] selectContractor requires jobId and applicationId'
      );
      return { success: false, error: 'Missing required parameters' };
    }

    isLoading.value = true;
    error.value = null;

    try {
      // STEP 1: Get the contractor_user_id from the application

      const { data: applicationData, error: fetchError } = await getSupabase()
        .from('job_applications')
        .select('contractor_user_id, status')
        .eq('id', applicationId)
        .eq('job_id', jobId)
        .single();

      if (fetchError) {
        console.error(
          '[JobApplicationsStore] Error fetching application:',
          fetchError
        );
        throw fetchError;
      }

      if (!applicationData) {
        console.error('[JobApplicationsStore] Application not found');
        throw new Error('Application not found');
      }

      // STEP 2: Update the selected application to 'selected' status

      const { data: updatedApplication, error: updateError } =
        await getSupabase()
          .from('job_applications')
          .update({
            status: 'selected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', applicationId)
          .eq('job_id', jobId)
          .select()
          .single();

      if (updateError) {
        console.error(
          '[JobApplicationsStore] Error updating application:',
          updateError
        );
        throw updateError;
      }

      // STEP 3: Update the job status to 'assigned' and set selected contractor

      // First, let's check the current job status
      const { data: currentJobData, error: currentJobError } =
        await getSupabase()
          .from('job_postings')
          .select('*')
          .eq('id', jobId)
          .single();

      if (currentJobError) {
        console.error(
          '[JobApplicationsStore] Cannot fetch current job:',
          currentJobError
        );
        throw currentJobError;
      }

      const { data: updatedJob, error: jobUpdateError } = await getSupabase()
        .from('job_postings')
        .update({
          status: 'assigned',
          selected_contractor_id: applicationData.contractor_user_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .select()
        .single();

      if (jobUpdateError) {
        console.error(
          '[JobApplicationsStore] Job update error:',
          jobUpdateError
        );

        // This is a critical error - we need the job status to be updated
        throw new Error(
          `Failed to update job status: ${jobUpdateError.message}. Code: ${jobUpdateError.code}. Details: ${jobUpdateError.details}`
        );
      } else {
      }

      // STEP 4: Update other applications for this job to 'rejected' status

      const { data: rejectedApplications, error: rejectOthersError } =
        await getSupabase()
          .from('job_applications')
          .update({
            status: 'rejected',
            updated_at: new Date().toISOString(),
          })
          .eq('job_id', jobId)
          .neq('id', applicationId)
          .select();

      if (rejectOthersError) {
        console.error(
          '[JobApplicationsStore] Error rejecting other applications:',
          rejectOthersError
        );
        // Don't throw here as the main operation succeeded
      } else {
      }

      // STEP 5: Get job details for chat creation

      const { data: jobData, error: jobFetchError } = await getSupabase()
        .from('job_postings')
        .select('posted_by_user_id')
        .eq('id', jobId)
        .single();

      if (jobFetchError) {
        console.error(
          '[JobApplicationsStore] Error fetching job for chat:',
          jobFetchError
        );
        // Don't throw here as the main operation succeeded
      }

      // STEP 6: Create chat room for job communication

      let chatCreated = false;
      let chatError = null;
      try {
        if (jobData) {
          console.log(
            '[JobApplicationsStore] Creating chat room for job assignment:',
            {
              jobId,
              contractorId: applicationData.contractor_user_id,
              clientId: jobData.posted_by_user_id,
            }
          );

          // Import chat store dynamically to avoid circular dependencies
          const { useChatStore } = await import('./chat.js');
          const chatStore = useChatStore();

          const chatRoom = await chatStore.createJobChatRoom(
            jobId,
            applicationData.contractor_user_id,
            jobData.posted_by_user_id
          );

          console.log(
            '[JobApplicationsStore] Chat room created successfully:',
            chatRoom
          );

          // Get contractor name for the welcome message
          const { data: contractorProfile } = await getSupabase()
            .from('contractor_profiles')
            .select('full_name')
            .eq('id', applicationData.contractor_user_id)
            .single();

          const contractorName = contractorProfile?.full_name || 'Contractor';

          // Send initial welcome message with job context
          const { error: messageError } = await getSupabase()
            .from('chat_messages')
            .insert([
              {
                room_id: chatRoom.id,
                sender_user_id: applicationData.contractor_user_id,
                content: `🎉 Great news! I've been selected for this job. Let's discuss the details and get started!`,
                sender_name: contractorName,
                job_reference_id: jobId,
                job_context: `${updatedJob.category_name} - ${updatedJob.description}`,
                created_at: new Date().toISOString(),
              },
            ]);

          if (messageError) {
            console.error(
              '[JobApplicationsStore] Error sending system message:',
              messageError
            );
            // Store error but don't fail the main operation
            chatError = messageError;
          } else {
            console.log(
              '[JobApplicationsStore] Welcome message sent successfully'
            );
          }

          chatCreated = true;
        }
      } catch (error) {
        console.error(
          '[JobApplicationsStore] CRITICAL: Chat room creation failed:',
          error
        );
        chatError = error;

        // This is a critical issue - we should notify the user
        // Store the error to be reported in the response
      }

      // STEP 7: Refresh local application data

      await getJobApplications(jobId);

      // STEP 8: Trigger contractor jobs refresh for the selected contractor

      try {
        // Import job store dynamically to avoid circular dependencies
        const { useJobStore } = await import('./job.js');
        const jobStore = useJobStore();

        // Clear contractor jobs cache to force refresh
        jobStore.clearContractorJobs();
      } catch (refreshError) {
        console.error(
          '[JobApplicationsStore] Error clearing cache:',
          refreshError
        );
        // Don't throw here as the main operation succeeded
      }

      return {
        success: true,
        selectedContractor: applicationData.contractor_user_id,
        clientId: jobData?.posted_by_user_id,
        updatedJob: updatedJob,
        updatedApplication: updatedApplication,
        chatCreated: chatCreated,
        chatError: chatError,
      };
    } catch (err) {
      console.error(
        `[JobApplicationsStore] Error selecting contractor for job ${jobId}:`,
        err
      );
      error.value = err.message;
      return { success: false, error: err.message };
    } finally {
      isLoading.value = false;
    }
  }

  async function markJobApplicationsAsRead(jobId) {
    if (!jobId) {
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await getSupabase()
        .from('job_applications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('job_id', jobId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error(
        `[JobApplicationsStore] Error marking applications as read for job ${jobId}:`,
        err.message
      );
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function markApplicationAsRead(applicationId) {
    if (!applicationId) {
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await getSupabase()
        .from('job_applications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      console.error(
        `[JobApplicationsStore] Error marking application as read ${applicationId}:`,
        err.message
      );
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function hasUnreadApplications(jobId) {
    if (!jobId) return false;

    try {
      const { data, error: fetchError } = await getSupabase()
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('is_read', false)
        .limit(1);

      if (fetchError) throw fetchError;

      return (data || []).length > 0;
    } catch (err) {
      console.error(
        `[JobApplicationsStore] Error checking unread applications for job ${jobId}:`,
        err.message
      );
      return false;
    }
  }

  async function updateApplicationStatus(applicationId, status) {
    if (!applicationId || !status) {
      console.error(
        '[JobApplicationsStore] updateApplicationStatus requires applicationId and status'
      );
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await getSupabase()
        .from('job_applications')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Update local state
      const applicationIndex = _jobApplications.value.findIndex(
        (app) => app.id === applicationId
      );
      if (applicationIndex !== -1) {
        _jobApplications.value[applicationIndex].status = status;
      }

      return true;
    } catch (err) {
      console.error(
        `[JobApplicationsStore] Error updating application ${applicationId} status:`,
        err.message
      );
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function bulkUpdateApplicationStatus(jobId, applicationIds, status) {
    if (!jobId || !applicationIds?.length || !status) {
      console.error(
        '[JobApplicationsStore] bulkUpdateApplicationStatus requires jobId, applicationIds array, and status'
      );
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const { error: updateError } = await getSupabase()
        .from('job_applications')
        .update({
          status: status,
          updated_at: new Date().toISOString(),
        })
        .in('id', applicationIds)
        .eq('job_id', jobId);

      if (updateError) throw updateError;

      // Update local state
      _jobApplications.value = _jobApplications.value.map((app) => {
        if (applicationIds.includes(app.id)) {
          return { ...app, status };
        }
        return app;
      });

      return true;
    } catch (err) {
      console.error(
        `[JobApplicationsStore] Error bulk updating applications:`,
        err.message
      );
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function hasAppliedToJob(jobId, contractorUserId) {
    if (!jobId || !contractorUserId) {
      return false;
    }

    try {
      const { data, error: fetchError } = await getSupabase()
        .from('job_applications')
        .select('id')
        .eq('job_id', jobId)
        .eq('contractor_user_id', contractorUserId)
        .limit(1);

      if (fetchError) {
        console.error(
          `[JobApplicationsStore] Error checking application status for job ${jobId}:`,
          fetchError.message
        );
        return false;
      }

      return (data || []).length > 0;
    } catch (err) {
      console.error(
        `[JobApplicationsStore] Error checking application status for job ${jobId}:`,
        err.message
      );
      return false;
    }
  }

  async function getApplicationDetails(jobId, contractorUserId) {
    if (!jobId || !contractorUserId) {
      return null;
    }

    try {
      const { data, error: fetchError } = await getSupabase()
        .from('job_applications')
        .select('id, applied_at, created_at, status')
        .eq('job_id', jobId)
        .eq('contractor_user_id', contractorUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No rows returned - user hasn't applied
          return null;
        }
        console.error(
          `[JobApplicationsStore] Error fetching application details for job ${jobId}:`,
          fetchError.message
        );
        return null;
      }

      return {
        id: data.id,
        appliedAt: data.applied_at || data.created_at,
        status: data.status,
        hasApplied: true,
      };
    } catch (err) {
      console.error(
        `[JobApplicationsStore] Error fetching application details for job ${jobId}:`,
        err.message
      );
      return null;
    }
  }

  // Get all applications for a client's jobs
  async function getAllApplicationsForClient(clientUserId) {
    if (!clientUserId) {
      console.error(
        '[JobApplicationsStore] getAllApplicationsForClient requires clientUserId'
      );
      return [];
    }

    try {
      const supabase = getSupabase();

      // First get all jobs for this client
      const { data: clientJobs, error: jobsError } = await supabase
        .from('job_postings')
        .select('id, category_name, description, created_at, status')
        .eq('posted_by_user_id', clientUserId);

      if (jobsError) {
        console.error(
          '[JobApplicationsStore] Error fetching client jobs:',
          jobsError
        );
        return [];
      }

      if (!clientJobs || clientJobs.length === 0) {
        return [];
      }

      const jobIds = clientJobs.map((job) => job.id);

      // Get all applications for these jobs
      const { data: applications, error: applicationsError } = await supabase
        .from('job_applications')
        .select('*')
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false });

      if (applicationsError) {
        console.error(
          '[JobApplicationsStore] Error fetching applications:',
          applicationsError
        );
        return [];
      }

      if (!applications || applications.length === 0) {
        return [];
      }

      // Get unique contractor user IDs
      const contractorUserIds = [
        ...new Set(applications.map((app) => app.contractor_user_id)),
      ];

      // Fetch contractor profiles separately
      const { data: contractorProfiles, error: profilesError } = await supabase
        .from('contractor_profiles')
        .select(
          'id, full_name, bio, skills, years_experience, contact_phone, profile_picture_url, work_photo_urls, service_areas'
        )
        .in('id', contractorUserIds);

      if (profilesError) {
        console.error(
          '[JobApplicationsStore] Error fetching contractor profiles:',
          profilesError
        );
      } else {
        console.log(
          '[JobApplicationsStore] Fetched contractor profiles:',
          contractorProfiles
        );
      }

      // Create a map of contractor profiles by id for easy lookup
      const profilesMap = {};
      (contractorProfiles || []).forEach((profile) => {
        profilesMap[profile.id] = profile;
      });

      // Process applications with job information and contractor profiles
      const processedApplications = applications.map((app) => {
        const job = clientJobs.find((j) => j.id === app.job_id);
        const contractorProfile = profilesMap[app.contractor_user_id];

        // Process avatar URL
        let processedAvatarUrl = null;
        if (contractorProfile?.profile_picture_url) {
          // Assign directly, consistent with useContractorData.js for working contractor cards
          processedAvatarUrl = contractorProfile.profile_picture_url;
          // Optional: Add a log to confirm this path is taken
          console.log(
            '[JobApplicationsStore] Using profile_picture_url directly for avatar:',
            processedAvatarUrl
          );
        }

        return {
          id: app.id,
          jobId: app.job_id,
          jobTitle:
            job?.category_name ||
            job?.description?.substring(0, 50) + '...' ||
            'Unknown Job',
          jobStatus: job?.status || 'unknown',
          jobCreatedAt: job?.created_at,
          contractorUserId: app.contractor_user_id,
          message: app.message,
          status: app.status,
          appliedAt: app.applied_at || app.created_at,
          contractor: {
            id: contractorProfile?.id,
            userId: app.contractor_user_id,
            fullName: contractorProfile?.full_name || 'Unnamed Contractor',
            location: contractorProfile.service_areas?.[0] || null,
            name: contractorProfile?.full_name || 'Unnamed Contractor', // Add name field for consistency
            profileImageUrl: processedAvatarUrl, // Use profileImageUrl like ContractorCard
            rating: null, // contractor_profiles doesn't seem to have rating field
            skills: contractorProfile?.skills || [],
            experienceLevel: contractorProfile?.years_experience
              ? `${contractorProfile.years_experience} years`
              : null,
            hourlyRate: null, // contractor_profiles doesn't seem to have hourly_rate field
          },
        };
      });

      return processedApplications;
    } catch (err) {
      console.error(
        '[JobApplicationsStore] Error in getAllApplicationsForClient:',
        err
      );
      return [];
    }
  }

  return {
    // State
    jobApplications,
    isLoading,
    error,

    // Actions
    applyToJob,
    getJobApplications,
    selectContractor,
    markJobApplicationsAsRead,
    markApplicationAsRead,
    hasUnreadApplications,
    updateApplicationStatus,
    bulkUpdateApplicationStatus,
    hasAppliedToJob,
    getApplicationDetails,
    getAllApplicationsForClient,
  };
});
