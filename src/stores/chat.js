import { defineStore } from 'pinia';
import { ref, computed, watch, shallowRef } from 'vue';
import { useAuthenticatedDataFetching } from '../composables/useAuth'; // Import centralized auth
import { subscriptionDiagnostics } from '../lib/subscriptionDiagnostics';
import { chatDiagnostics } from '../lib/chatDiagnosticCommands';
import { subscriptionManager } from '../lib/subscriptionManager';
import { createLogger } from '../lib/loggerService';
import { getOrCreateGeneralChatRoom } from '../lib/chatRoomUtils';
import realtimeConnectionManager from '../lib/realtimeConnectionManager';
import chatReactivityManager, {
  addMessageWithReactivity,
  updateRoomWithReactivity,
  createEnhancedErrorHandler,
  validateMessage,
} from '../lib/chatReactivityFix';

export const useChatStore = defineStore('chat', () => {
  // Initialize logger
  const logger = createLogger('ChatStore');

  // Use centralized authentication system
  const auth = useAuthenticatedDataFetching();

  // Get the current user ID from auth
  const currentUserId = computed(() => auth.user.value?.id);

  // --- State ---
  const _chatRooms = ref([]);
  const _currentRoomId = ref(null);
  const _messages = shallowRef({});
  const _isLoading = ref(false);
  const _error = ref(null);
  const _lastFetchTime = ref({});
  const _unreadCounts = ref({}); // Track unread message counts per room
  const _budgetProposals = ref({}); // Track budget proposals per room

  // Cache management
  const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for chat data

  // Helper function to execute data fetching with proper auth
  const executeWithAuth = async (
    operation,
    requireAuth = true,
    options = {}
  ) => {
    const { setGlobalLoading = true } = options;
    try {
      if (setGlobalLoading) {
        _isLoading.value = true;
      }
      _error.value = null;

      // Check if auth is required and user is authenticated
      if (requireAuth && !auth.isSignedIn.value) {
        throw new Error('Authentication required');
      }

      // Get Supabase client and execute operation
      const supabase = auth.getSupabaseClient();
      return await operation(supabase);
    } catch (err) {
      console.error('[ChatStore] Operation failed:', err);
      _error.value = err.message || 'An error occurred';
      throw err;
    } finally {
      if (setGlobalLoading) {
        _isLoading.value = false;
      }
    }
  };

  // Check if cache is valid for a specific key
  const isCacheValid = (key) => {
    const lastFetch = _lastFetchTime.value[key];
    if (!lastFetch) return false;
    return Date.now() - lastFetch < CACHE_DURATION;
  };

  // Helper function to calculate unread messages for a room
  const calculateUnreadCount = (roomId) => {
    if (!roomId || !currentUserId.value || !_messages.value[roomId]) {
      return 0;
    }

    const messages = _messages.value[roomId];
    return messages.filter(
      (message) =>
        message.sender_user_id !== currentUserId.value &&
        (message.read_at === null || message.read_at === undefined)
    ).length;
  };

  // Update unread count for a specific room
  const updateUnreadCount = (roomId) => {
    if (!roomId) return;

    const count = calculateUnreadCount(roomId);
    _unreadCounts.value[roomId] = count;
  };

  // --- Computed Properties ---
  const chatRooms = computed(() => _chatRooms.value);
  const currentRoomId = computed(() => _currentRoomId.value);
  const isLoading = computed(() => _isLoading.value);
  const error = computed(() => _error.value);

  const currentRoomMessages = computed(() => {
    const roomId = _currentRoomId.value;
    const messages = roomId ? _messages.value[roomId] || [] : [];
    // Diagnostic logging removed to prevent infinite reactive loops
    return messages;
  });

  const currentRoom = computed(() => {
    if (!_currentRoomId.value) return null;
    return _chatRooms.value.find((room) => room.id === _currentRoomId.value);
  });

  // Unread message tracking
  const unreadCounts = computed(() => _unreadCounts.value);

  const totalUnreadCount = computed(() => {
    return Object.values(_unreadCounts.value).reduce(
      (total, count) => total + count,
      0
    );
  });

  const hasUnreadMessages = computed(() => {
    return totalUnreadCount.value > 0;
  });

  // Store for user profiles
  const _userProfiles = ref({});

  const otherUserProfiles = computed(() => _userProfiles.value);

  // Budget proposals computed property
  const currentRoomBudgetProposals = computed(() => {
    if (!_currentRoomId.value) return [];
    return _budgetProposals.value[_currentRoomId.value] || [];
  });

  // --- Actions ---

  /**
   * Fetch chat rooms for the current user
   */
  const fetchChatRooms = async (forceRefresh = false) => {
    const cacheKey = 'chatRooms';

    // Use cache if valid and not forcing refresh
    if (
      !forceRefresh &&
      isCacheValid(cacheKey) &&
      _chatRooms.value.length > 0
    ) {
      return _chatRooms.value;
    }

    if (!currentUserId.value) {
      throw new Error('User must be authenticated to fetch chat rooms');
    }

    console.log('[ChatStore] DIAGNOSTIC - fetchChatRooms called with:', {
      currentUserId: currentUserId.value,
      forceRefresh,
      cacheValid: isCacheValid(cacheKey),
      existingRoomsCount: _chatRooms.value.length,
    });

    return executeWithAuth(async (supabase) => {
      // Fetch chat rooms with latest message information
      console.log(
        '[ChatStore] DIAGNOSTIC - Executing chat rooms query for user:',
        currentUserId.value
      );

      const { data, error: fetchError } = await supabase
        .from('chat_rooms')
        .select(
          `
          *,
          latest_message:chat_messages(
            id,
            content,
            created_at,
            sender_user_id,
            read_at
          )
        `
        )
        .or(
          `client_id.eq.${currentUserId.value},contractor_id.eq.${currentUserId.value}`
        )
        .order('updated_at', { ascending: false });

      console.log('[ChatStore] DIAGNOSTIC - Chat rooms query result:', {
        dataCount: data?.length || 0,
        error: fetchError,
        data: data,
      });

      if (fetchError) {
        throw new Error(`Failed to fetch chat rooms: ${fetchError.message}`);
      }

      // Process the data to get the actual latest message for each room
      const processedRooms = await Promise.all(
        (data || []).map(async (room) => {
          // Get the actual latest message for this room
          const { data: latestMessage } = await supabase
            .from('chat_messages')
            .select('id, content, created_at, sender_user_id, read_at')
            .eq('room_id', room.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...room,
            latestMessage: latestMessage || null,
          };
        })
      );

      _chatRooms.value = processedRooms;
      _lastFetchTime.value[cacheKey] = Date.now();

      // Collect all unique user IDs from the rooms
      const userIds = new Set();
      processedRooms.forEach((room) => {
        if (room.client_id && room.client_id !== currentUserId.value) {
          userIds.add(room.client_id);
        }
        if (room.contractor_id && room.contractor_id !== currentUserId.value) {
          userIds.add(room.contractor_id);
        }
      });

      // Fetch profiles for all other users
      if (userIds.size > 0) {
        await fetchOtherUserProfiles(Array.from(userIds));
      }

      // Fetch messages for each room to calculate unread counts
      if (processedRooms.length > 0) {
        const messagePromises = processedRooms.map(async (room) => {
          try {
            await fetchMessages(room.id);
          } catch (error) {
            // Silently handle errors for individual room message fetching
          }
        });

        // Wait for all message fetches to complete, then refresh unread counts
        Promise.all(messagePromises).then(() => {
          refreshUnreadCounts();
        });
      }

      return processedRooms;
    }, true); // Require auth for fetching chat rooms
  };

  /**
   * Fetch messages for a specific chat room
   */
  const fetchMessages = async (roomId, forceRefresh = false) => {
    if (!roomId) {
      throw new Error('Room ID is required');
    }

    console.log(
      `[ChatStore] DIAGNOSTIC - fetchMessages called for room: ${roomId}`,
      {
        forceRefresh,
        currentUserId: currentUserId.value,
        hasExistingMessages: !!_messages.value[roomId],
        existingMessageCount: _messages.value[roomId]?.length || 0,
      }
    );

    const cacheKey = `messages_${roomId}`;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && isCacheValid(cacheKey) && _messages.value[roomId]) {
      console.log(
        `[ChatStore] DIAGNOSTIC - Using cached messages for room: ${roomId}`,
        {
          messageCount: _messages.value[roomId].length,
        }
      );
      return _messages.value[roomId];
    }

    return executeWithAuth(async (supabase) => {
      console.log(
        `[ChatStore] DIAGNOSTIC - Executing messages query for room: ${roomId}`
      );

      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select(
          `
          id,
          room_id,
          sender_user_id,
          content,
          message_type,
          job_reference_id,
          job_context,
          budget_data,
          image_url,
          image_filename,
          image_size,
          created_at,
          read_at,
          sender_name
        `
        )
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      console.log(
        `[ChatStore] DIAGNOSTIC - Messages query result for room: ${roomId}`,
        {
          dataCount: data?.length || 0,
          error: fetchError,
          data: data,
        }
      );

      if (fetchError) {
        console.error(
          `[ChatStore] DIAGNOSTIC - Failed to fetch messages for room: ${roomId}`,
          fetchError
        );
        throw new Error(`Failed to fetch messages: ${fetchError.message}`);
      }

      _messages.value[roomId] = data || [];
      _lastFetchTime.value[cacheKey] = Date.now();

      console.log(
        `[ChatStore] DIAGNOSTIC - Messages stored for room: ${roomId}`,
        {
          storedCount: _messages.value[roomId].length,
          messages: _messages.value[roomId],
        }
      );

      // Update unread count for this room
      updateUnreadCount(roomId);

      return data || [];
    }, true); // Require auth for fetching messages
  };

  /**
   * Send a message to a chat room
   */
  const sendMessage = async (
    roomId,
    content,
    senderName = null,
    jobId = null
  ) => {
    if (!roomId || !content?.trim()) {
      throw new Error('Room ID and message content are required');
    }

    if (!currentUserId.value) {
      throw new Error('User must be authenticated to send messages');
    }

    return executeWithAuth(
      async (supabase) => {
        // Use the new database function if job context is provided
        if (jobId) {
          console.log(
            '[ChatStore] DIAGNOSTIC - Sending message with job context:',
            {
              roomId,
              jobId,
              content: content.trim(),
              senderName,
              currentUserId: currentUserId.value,
            }
          );

          const { data, error: sendError } = await supabase.rpc(
            'send_message_with_job_context',
            {
              p_room_id: roomId,
              p_sender_user_id: currentUserId.value,
              p_content: content.trim(),
              p_sender_name: senderName,
              p_job_id: jobId,
              p_message_type: 'text',
            }
          );

          if (sendError) {
            console.error(
              '[ChatStore] DIAGNOSTIC - Failed to send message with job context:',
              sendError
            );
            throw new Error(
              `Failed to send message with job context: ${sendError.message}`
            );
          }

          console.log(
            '[ChatStore] DIAGNOSTIC - Message with job context sent successfully, message ID:',
            data
          );

          // Fetch the created message to get full data
          const { data: messageData, error: fetchError } = await supabase
            .from('chat_messages')
            .select(
              `
              id,
              room_id,
              sender_user_id,
              content,
              message_type,
              job_reference_id,
              job_context,
              image_url,
              image_filename,
              created_at,
              read_at,
              sender_name
            `
            )
            .eq('id', data)
            .single();

          if (fetchError) {
            throw new Error(
              `Failed to fetch sent message: ${fetchError.message}`
            );
          }

          // Update local state with forced reactivity
          if (messageData) {
            const currentMessages = _messages.value[roomId] || [];
            if (!currentMessages.find((m) => m.id === messageData.id)) {
              // Force Vue reactivity by creating a completely new object reference
              const newMessages = [...currentMessages, messageData];
              const newMessagesState = { ..._messages.value };
              newMessagesState[roomId] = newMessages;
              _messages.value = newMessagesState;

              console.log(
                '[ChatStore] DIAGNOSTIC - Forced reactivity update (sendMessage):',
                {
                  roomId,
                  oldCount: currentMessages.length,
                  newCount: newMessages.length,
                  messageId: messageData.id,
                }
              );
            }
            updateUnreadCount(roomId);
          }

          // Update room's last message timestamp and latest message
          const roomIndex = _chatRooms.value.findIndex(
            (room) => room.id === roomId
          );
          if (roomIndex !== -1 && messageData) {
            _chatRooms.value[roomIndex].updated_at = messageData.created_at;
            _chatRooms.value[roomIndex].latestMessage = {
              id: messageData.id,
              content: messageData.job_context
                ? `[${messageData.job_context}] ${messageData.content}`
                : messageData.content,
              created_at: messageData.created_at,
              sender_user_id: messageData.sender_user_id,
              read_at: messageData.read_at,
            };
            // Re-sort rooms by updated_at
            _chatRooms.value.sort(
              (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
            );
          }

          return messageData;
        } else {
          // Regular message without job context
          const messageData = {
            room_id: roomId,
            sender_user_id: currentUserId.value,
            content: content.trim(),
            message_type: 'text',
            created_at: new Date().toISOString(),
            sender_name: senderName,
          };

          const { data, error: sendError } = await supabase
            .from('chat_messages')
            .insert([messageData])
            .select(
              `
              id,
              room_id,
              sender_user_id,
              content,
              message_type,
              job_reference_id,
              job_context,
              image_url,
              image_filename,
              created_at,
              read_at,
              sender_name
            `
            )
            .single();

          if (sendError) {
            throw new Error(`Failed to send message: ${sendError.message}`);
          }

          // Optimistically add the new message to the local cache with forced reactivity
          if (data) {
            const currentMessages = _messages.value[roomId] || [];
            // Ensure no duplicates if subscription is very fast
            if (!currentMessages.find((m) => m.id === data.id)) {
              // Force Vue reactivity by creating a completely new object reference
              const newMessages = [...currentMessages, data];
              const newMessagesState = { ..._messages.value };
              newMessagesState[roomId] = newMessages;
              _messages.value = newMessagesState;

              console.log(
                '[ChatStore] DIAGNOSTIC - Forced reactivity update (regular sendMessage):',
                {
                  roomId,
                  oldCount: currentMessages.length,
                  newCount: newMessages.length,
                  messageId: data.id,
                }
              );
            }
            // Update unread count for this room as a new message has arrived (from self)
            // This might be redundant if subscription handles it, but good for consistency
            updateUnreadCount(roomId);
          }

          // Update room's last message timestamp and latest message
          const roomIndex = _chatRooms.value.findIndex(
            (room) => room.id === roomId
          );
          if (roomIndex !== -1 && data) {
            _chatRooms.value[roomIndex].updated_at = data.created_at;
            _chatRooms.value[roomIndex].latestMessage = {
              id: data.id,
              content: data.content,
              created_at: data.created_at,
              sender_user_id: data.sender_user_id,
              read_at: data.read_at,
            };
            // Re-sort rooms by updated_at
            _chatRooms.value.sort(
              (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
            );
          }

          return data;
        }
      },
      true, // requireAuth
      { setGlobalLoading: false } // options
    );
  };

  /**
   * Upload an image to Supabase storage and send as a message
   */
  const sendImageMessage = async (
    roomId,
    file,
    senderName = null,
    jobId = null
  ) => {
    if (!roomId || !file) {
      throw new Error('Room ID and image file are required');
    }

    if (!currentUserId.value) {
      throw new Error('User must be authenticated to send images');
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 10MB');
    }

    return executeWithAuth(
      async (supabase) => {
        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${roomId}/${currentUserId.value}/${Date.now()}.${fileExt}`;

        // Upload image to storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(fileName);

        if (!urlData?.publicUrl) {
          throw new Error('Failed to get image URL');
        }

        // Create message with image and optional job context
        const messageData = {
          room_id: roomId,
          sender_user_id: currentUserId.value,
          content: '', // Empty content for image messages
          message_type: 'image',
          image_url: urlData.publicUrl,
          image_filename: file.name,
          image_size: file.size,
          created_at: new Date().toISOString(),
          sender_name: senderName,
          job_reference_id: jobId,
        };

        // Add job context if job ID is provided
        if (jobId) {
          const { data: jobData } = await supabase
            .from('job_postings')
            .select('description, category_name, location_text')
            .eq('id', jobId)
            .single();

          if (jobData) {
            messageData.job_context =
              jobData.category_name && jobData.location_text
                ? `${jobData.category_name} - ${jobData.location_text}`
                : jobData.category_name || `Job #${jobId}`;
          }
        }

        const { data, error: sendError } = await supabase
          .from('chat_messages')
          .insert([messageData])
          .select(
            `
            id,
            room_id,
            sender_user_id,
            content,
            message_type,
            job_reference_id,
            job_context,
            image_url,
            image_filename,
            image_size,
            created_at,
            read_at,
            sender_name
          `
          )
          .single();

        if (sendError) {
          // If message creation fails, try to clean up the uploaded file
          try {
            await supabase.storage.from('chat-images').remove([fileName]);
          } catch (cleanupError) {
            console.warn('Failed to cleanup uploaded file:', cleanupError);
          }
          throw new Error(`Failed to send image message: ${sendError.message}`);
        }

        // Optimistically add the new message to the local cache
        if (data) {
          const currentMessages = _messages.value[roomId] || [];
          // Ensure no duplicates if subscription is very fast
          if (!currentMessages.find((m) => m.id === data.id)) {
            // Force Vue reactivity by creating a completely new object reference
            const newMessages = [...currentMessages, data];
            const newMessagesState = { ..._messages.value };
            newMessagesState[roomId] = newMessages;
            _messages.value = newMessagesState;

            console.log(
              '[ChatStore] DIAGNOSTIC - Forced reactivity update (sendImageMessage):',
              {
                roomId,
                oldCount: currentMessages.length,
                newCount: newMessages.length,
                messageId: data.id,
              }
            );
          }
          updateUnreadCount(roomId);
        }

        // Update room's last message timestamp and latest message
        const roomIndex = _chatRooms.value.findIndex(
          (room) => room.id === roomId
        );
        if (roomIndex !== -1 && data) {
          _chatRooms.value[roomIndex].updated_at = data.created_at;
          _chatRooms.value[roomIndex].latestMessage = {
            id: data.id,
            content: data.job_context
              ? `[${data.job_context}] 📷 Image`
              : '📷 Image', // Display text for image messages
            created_at: data.created_at,
            sender_user_id: data.sender_user_id,
            read_at: data.read_at,
          };
          // Re-sort rooms by updated_at
          _chatRooms.value.sort(
            (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
          );
        }

        return data;
      },
      true, // requireAuth
      { setGlobalLoading: false } // options
    );
  };

  /**
   * Create or get a chat room for contractor contact
   * Supports both job-specific chats and general contractor inquiries
   */
  const createOrGetChatRoom = async (contractorId, clientId = null) => {
    if (!contractorId) {
      throw new Error('Contractor ID is required');
    }

    if (!currentUserId.value) {
      throw new Error('User must be authenticated to create chat rooms');
    }

    // Determine the contractor and client IDs based on current user
    let finalContractorId, finalClientId;

    if (clientId) {
      // Both IDs provided explicitly
      finalContractorId = contractorId;
      finalClientId = clientId;
    } else {
      // Only contractor ID provided, determine roles based on current user
      // Assume current user is the client contacting the contractor
      finalContractorId = contractorId;
      finalClientId = currentUserId.value;
    }

    return executeWithAuth(async (supabase) => {
      // Use the new database function to get or create general chat room
      const { data: roomId, error } = await supabase.rpc(
        'get_or_create_general_chat_room',
        {
          p_contractor_id: finalContractorId,
          p_client_id: finalClientId,
        }
      );

      if (error) {
        throw new Error(`Failed to create or get chat room: ${error.message}`);
      }

      // Refresh the chat rooms list to ensure we have the latest data
      await fetchChatRooms(true);

      return roomId;
    }, true);
  };

  /**
   * Create or get a chat room for direct contractor contact (legacy support)
   * Now uses general rooms instead of job-specific rooms
   */
  const createDirectChatRoom = async (contractorId) => {
    return await createOrGetChatRoom(contractorId);
  };

  /**
   * Create or get a chat room for a specific job (legacy support)
   * Now creates general rooms instead of job-specific rooms
   * Job context will be handled at the message level
   */
  const createJobChatRoom = async (jobId, contractorId, clientId) => {
    if (!contractorId || !clientId) {
      throw new Error('Contractor ID and client ID are required');
    }

    console.log('[ChatStore] Creating job chat room:', {
      jobId,
      contractorId,
      clientId,
    });

    // Create general room between contractor and client
    // Job context will be added to individual messages when needed
    const roomId = await createOrGetChatRoom(contractorId, clientId);

    console.log('[ChatStore] Job chat room created/retrieved:', roomId);

    return { id: roomId };
  };

  /**
   * Utility function to create missing chat rooms for assigned jobs
   * This can be used to recover from situations where chat room creation failed
   */
  const createMissingChatRoomsForAssignedJobs = async () => {
    console.log('[ChatStore] Checking for assigned jobs without chat rooms...');

    return executeWithAuth(async (supabase) => {
      // Find all assigned jobs that don't have chat rooms
      const { data: assignedJobs, error: jobsError } = await supabase
        .from('job_postings')
        .select(
          `
          id,
          posted_by_user_id,
          selected_contractor_id,
          category_name,
          description,
          status
        `
        )
        .eq('status', 'assigned')
        .not('selected_contractor_id', 'is', null);

      if (jobsError) {
        throw new Error(`Failed to fetch assigned jobs: ${jobsError.message}`);
      }

      if (!assignedJobs || assignedJobs.length === 0) {
        console.log('[ChatStore] No assigned jobs found');
        return { created: 0, errors: [] };
      }

      console.log(
        `[ChatStore] Found ${assignedJobs.length} assigned jobs, checking for missing chat rooms...`
      );

      const results = {
        created: 0,
        errors: [],
      };

      for (const job of assignedJobs) {
        try {
          // Check if chat room already exists
          const { data: existingRoom } = await supabase
            .from('chat_rooms')
            .select('id')
            .eq('contractor_id', job.selected_contractor_id)
            .eq('client_id', job.posted_by_user_id)
            .eq('job_id', null) // General rooms have job_id as null
            .single();

          if (existingRoom) {
            console.log(
              `[ChatStore] Chat room already exists for job ${job.id}`
            );
            continue;
          }

          // Create missing chat room
          console.log(
            `[ChatStore] Creating missing chat room for job ${job.id}`
          );

          const roomId = await createJobChatRoom(
            job.id,
            job.selected_contractor_id,
            job.posted_by_user_id
          );

          // Get contractor name for welcome message
          const { data: contractorProfile } = await supabase
            .from('contractor_profiles')
            .select('full_name')
            .eq('id', job.selected_contractor_id)
            .single();

          const contractorName = contractorProfile?.full_name || 'Contractor';

          // Add welcome message
          await supabase.from('chat_messages').insert([
            {
              room_id: roomId.id,
              sender_user_id: job.selected_contractor_id,
              content: `🎉 Great news! I've been selected for this job. Let's discuss the details and get started!`,
              sender_name: contractorName,
              job_reference_id: job.id,
              job_context: `${job.category_name} - ${job.description}`,
              created_at: new Date().toISOString(),
            },
          ]);

          results.created++;
          console.log(
            `[ChatStore] Successfully created chat room for job ${job.id}`
          );
        } catch (error) {
          console.error(
            `[ChatStore] Failed to create chat room for job ${job.id}:`,
            error
          );
          results.errors.push({
            jobId: job.id,
            error: error.message,
          });
        }
      }

      // Refresh chat rooms if any were created
      if (results.created > 0) {
        await fetchChatRooms(true);
      }

      console.log(`[ChatStore] Chat room recovery complete:`, results);
      return results;
    }, true);
  };

  /**
   * Set the current active chat room
   */
  const setCurrentRoom = (roomId) => {
    // Diagnostic logging removed to prevent infinite reactive loops
    _currentRoomId.value = roomId;

    // Fetch messages for the room if not already loaded
    if (roomId && !_messages.value[roomId]) {
      fetchMessages(roomId).catch((error) => {
        console.error('[ChatStore] Failed to fetch messages for room:', error);
      });
    }
  };

  /**
   * Mark messages as read in a room
   */
  const markMessagesAsRead = async (roomId) => {
    if (!roomId || !currentUserId.value) {
      return;
    }

    try {
      return await executeWithAuth(async (supabase) => {
        // Update all unread messages in the room to mark them as read
        const { data, error } = await supabase
          .from('chat_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('room_id', roomId)
          .neq('sender_user_id', currentUserId.value)
          .is('read_at', null)
          .select('id, read_at');

        if (error) {
          throw new Error(`Failed to mark messages as read: ${error.message}`);
        }

        // Update local state
        if (_messages.value[roomId]) {
          _messages.value[roomId] = _messages.value[roomId].map((message) => {
            if (
              message.sender_user_id !== currentUserId.value &&
              !message.read_at
            ) {
              return { ...message, read_at: new Date().toISOString() };
            }
            return message;
          });
        }

        // Update unread count
        _unreadCounts.value[roomId] = 0;

        return data;
      }, true);
    } catch (error) {
      _error.value = error.message || 'Failed to mark messages as read';
      throw error;
    }
  };

  /**
   * Subscribe to real-time messages for a room
   */
  const subscribeToMessages = async (roomId) => {
    if (!roomId) return null;

    logger.info('Setting up real-time subscription', { roomId });

    // Add subscription diagnostics
    subscriptionDiagnostics.logSubscriptionEvent(
      roomId,
      'SUBSCRIPTION_SETUP_STARTED'
    );

    chatDiagnostics.logSubscriptionLifecycle(
      roomId,
      'STORE_SUBSCRIPTION_STARTED',
      {
        currentUserId: currentUserId.value,
        timestamp: new Date().toISOString(),
      }
    );

    // Use enhanced connection manager for better reliability
    try {
      const supabase = auth.getSupabaseClient();

      // Initialize connection manager if not already done
      if (!realtimeConnectionManager.supabaseClient) {
        realtimeConnectionManager.initialize(supabase);
      }

      // Create subscription with enhanced error handling
      const subscriptionConfig = {
        channelName: `room-${roomId}`,
        channelConfig: {
          private: true,
          broadcast: { self: false },
        },
        postgresChanges: {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`,
        },
        onEvent: (payload) => {
          // Enhanced error handling for event processing
          const errorHandler = createEnhancedErrorHandler('websocket_event');

          try {
            logger.info('WebSocket event received', {
              roomId,
              event: payload.eventType,
              messageId: payload.new?.id || payload.old?.id,
              senderId:
                payload.new?.sender_user_id || payload.old?.sender_user_id,
              currentUserId: currentUserId.value,
            });

            // Enhanced diagnostic logging
            chatDiagnostics.logMessageFlow(
              roomId,
              'MESSAGE_RECEIVED_VIA_WEBSOCKET',
              payload.new || payload.old
            );

            subscriptionDiagnostics.logMessageEvent(
              roomId,
              payload.new?.id || payload.old?.id || 'unknown',
              `WEBSOCKET_${payload.eventType}_RECEIVED`,
              {
                messageType:
                  payload.new?.message_type || payload.old?.message_type,
                senderId:
                  payload.new?.sender_user_id || payload.old?.sender_user_id,
                hasPayloadNew: !!payload.new,
                hasPayloadOld: !!payload.old,
              }
            );

            // Handle different event types with enhanced error handling
            if (payload.eventType === 'INSERT' && payload.new) {
              handleNewMessageEnhanced(roomId, payload.new);
            } else if (payload.eventType === 'UPDATE' && payload.new) {
              handleMessageUpdate(roomId, payload.new);
            } else if (payload.eventType === 'DELETE' && payload.old) {
              // Handle message deletion if needed
              logger.info('Message deletion event received', {
                roomId,
                messageId: payload.old.id,
              });
            }
          } catch (error) {
            errorHandler(error, {
              roomId,
              eventType: payload.eventType,
              messageId: payload.new?.id || payload.old?.id,
            });
          }
        },
      };

      // Create subscription using connection manager
      const channel = await realtimeConnectionManager.createSubscription(
        `chat-room-${roomId}`,
        subscriptionConfig
      );

      if (channel) {
        logger.info('Real-time subscription created successfully', { roomId });
        subscriptionDiagnostics.logSubscriptionEvent(
          roomId,
          'SUBSCRIPTION_SETUP_COMPLETED'
        );
        return channel;
      } else {
        throw new Error('Failed to create real-time subscription');
      }
    } catch (error) {
      const errorHandler = createEnhancedErrorHandler('subscription_setup');
      errorHandler(error, { roomId });

      logger.error('Failed to create real-time subscription', {
        roomId,
        error: error.message,
      });

      throw error;
    }
  };

  // Helper function to handle new messages with enhanced reactivity
  const handleNewMessageEnhanced = async (roomId, newMessage) => {
    try {
      // Validate message structure
      validateMessage(newMessage);

      logger.info('Processing new message with enhanced handling', {
        roomId,
        messageId: newMessage.id,
        messageType: newMessage.message_type,
      });

      // Use enhanced reactivity manager
      const success = await addMessageWithReactivity(
        _messages,
        roomId,
        newMessage
      );

      if (success) {
        // Update room with latest message info
        const roomUpdateData = {
          updated_at: newMessage.created_at,
          latestMessage: {
            id: newMessage.id,
            content:
              newMessage.message_type === 'image'
                ? '📷 Image'
                : newMessage.message_type === 'budget_proposal'
                  ? '💰 Budget Proposal'
                  : newMessage.content,
            created_at: newMessage.created_at,
            sender_user_id: newMessage.sender_user_id,
            read_at: newMessage.read_at,
          },
        };

        await updateRoomWithReactivity(_chatRooms, roomId, roomUpdateData);

        // Update unread count
        updateUnreadCount(roomId);

        // Handle budget proposal messages
        if (
          newMessage.message_type === 'budget_proposal' &&
          newMessage.budget_data?.proposal_id
        ) {
          logger.info('Budget proposal message received, refreshing proposals');
          fetchBudgetProposals(roomId).catch((error) => {
            logger.warn('Failed to refresh budget proposals:', error);
          });
        }

        logger.info('Message processed successfully with enhanced reactivity', {
          roomId,
          messageId: newMessage.id,
        });
      }
    } catch (error) {
      const errorHandler = createEnhancedErrorHandler('message_processing');
      errorHandler(error, {
        roomId,
        messageId: newMessage.id,
        messageType: newMessage.message_type,
      });
    }
  };

  // Legacy subscription function (keeping for compatibility)
  const subscribeToMessagesLegacy = async (roomId) => {
    if (!roomId) return null;

    return subscriptionManager.getOrCreateSubscription(roomId, async () => {
      return executeWithAuth(async (supabase) => {
        const channel = supabase
          .channel(`room-${roomId}`, {
            config: {
              private: true,
              broadcast: { self: false },
            },
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'chat_messages',
              filter: `room_id=eq.${roomId}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT' && payload.new) {
                handleNewMessage(roomId, payload.new);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'budget_proposals',
              filter: `room_id=eq.${roomId}`,
            },
            async (payload) => {
              try {
                await fetchBudgetProposals(roomId);
                await fetchMessages(roomId, 1, true);
              } catch (error) {
                console.error(
                  'Failed to refresh budget proposals after update:',
                  error
                );
              }
            }
          )
          .subscribe((status, error) => {
            const timestamp = new Date().toISOString();

            console.log(
              `[ChatStore] 🔔 SUBSCRIPTION STATUS CHANGE for room ${roomId}:`,
              {
                status,
                error: error?.message || error,
                timestamp,
                userId: currentUserId.value,
              }
            );

            // Enhanced diagnostic logging for subscription status
            chatDiagnostics.logWebSocketEvent(
              roomId,
              'SUBSCRIPTION_STATUS_CHANGE',
              {
                status,
                error: error?.message || error,
                timestamp,
                userId: currentUserId.value,
              }
            );

            // Update subscription status in diagnostics
            subscriptionDiagnostics.updateSubscriptionStatus(
              roomId,
              status,
              error
            );

            if (status === 'SUBSCRIBED') {
              console.log(
                `[ChatStore] ✅ SUCCESSFULLY SUBSCRIBED to room ${roomId} - Real-time events should now be received!`
              );
              chatDiagnostics.logSubscriptionLifecycle(
                roomId,
                'SUBSCRIPTION_ACTIVE',
                {
                  timestamp,
                  userId: currentUserId.value,
                }
              );

              // Log that we're now ready to receive events
              subscriptionDiagnostics.logSubscriptionEvent(
                roomId,
                'READY_TO_RECEIVE_EVENTS',
                {
                  channelName: `room-${roomId}`,
                  timestamp,
                }
              );
            } else if (status === 'CHANNEL_ERROR') {
              console.error(
                `[ChatStore] ❌ CHANNEL ERROR for room ${roomId}:`,
                error
              );
              chatDiagnostics.logSubscriptionLifecycle(
                roomId,
                'SUBSCRIPTION_ERROR',
                {
                  error: error?.message || error,
                  timestamp,
                }
              );
            } else if (status === 'TIMED_OUT') {
              console.error(
                `[ChatStore] ⏰ SUBSCRIPTION TIMED OUT for room ${roomId}`
              );
              chatDiagnostics.logSubscriptionLifecycle(
                roomId,
                'SUBSCRIPTION_TIMEOUT',
                {
                  timestamp,
                }
              );
            } else if (status === 'CLOSED') {
              console.warn(`[ChatStore] 🔒 CHANNEL CLOSED for room ${roomId}`);
              chatDiagnostics.logSubscriptionLifecycle(
                roomId,
                'SUBSCRIPTION_CLOSED',
                {
                  timestamp,
                }
              );
            } else {
              console.log(
                `[ChatStore] 🔄 SUBSCRIPTION STATUS: ${status} for room ${roomId}`
              );
            }
          });

        // Track the subscription in diagnostics
        subscriptionDiagnostics.trackSubscription(roomId, channel);

        console.log(
          `[ChatStore] DIAGNOSTIC - Real-time subscription setup completed for room: ${roomId}`
        );

        subscriptionDiagnostics.logSubscriptionEvent(
          roomId,
          'SUBSCRIPTION_SETUP_COMPLETED'
        );
        return channel;
      }, true);
    });
  };

  // Helper function to handle new messages
  const handleNewMessage = (roomId, newMessage) => {
    console.log(
      `[ChatStore] 🔥 HANDLE_NEW_MESSAGE called for room ${roomId}:`,
      {
        messageId: newMessage.id,
        messageType: newMessage.message_type,
        senderId: newMessage.sender_user_id,
        currentUserId: currentUserId.value,
        content: newMessage.content,
        timestamp: new Date().toISOString(),
      }
    );

    // Log message event for diagnostics
    subscriptionDiagnostics.logMessageEvent(
      roomId,
      newMessage.id,
      'MESSAGE_RECEIVED_VIA_SUBSCRIPTION',
      {
        senderId: newMessage.sender_user_id,
        messageType: newMessage.message_type,
        hasJobContext: !!newMessage.job_context,
        hasJobReference: !!newMessage.job_reference_id,
      }
    );

    // Ensure messages array exists for this room
    if (!_messages.value[roomId]) {
      console.log(
        `[ChatStore] 🆕 Creating new messages array for room ${roomId}`
      );
      _messages.value[roomId] = [];
    }

    // Check if message already exists to prevent duplicates
    const existingMessage = _messages.value[roomId].find(
      (msg) => msg.id === newMessage.id
    );

    if (!existingMessage) {
      console.log(
        `[ChatStore] ✅ Adding new message ${newMessage.id} to local state for room ${roomId}`
      );

      chatDiagnostics.logMessageFlow(roomId, 'MESSAGE_ADDED_TO_LOCAL_STATE', {
        messageId: newMessage.id,
        messageType: newMessage.message_type,
        existingMessageCount: _messages.value[roomId]?.length || 0,
      });

      subscriptionDiagnostics.logMessageEvent(
        roomId,
        newMessage.id,
        'MESSAGE_ADDED_TO_LOCAL_STATE'
      );

      // For budget proposal messages, refresh proposals in the background
      if (
        newMessage.message_type === 'budget_proposal' &&
        newMessage.budget_data?.proposal_id
      ) {
        console.log(
          '[ChatStore] 💰 Budget proposal message received, refreshing proposals'
        );
        // Refresh budget proposals in the background (non-blocking)
        fetchBudgetProposals(roomId).catch((error) => {
          console.warn(
            '[ChatStore] ⚠️ Failed to refresh budget proposals:',
            error
          );
        });
      }

      // Get current messages and create new array
      const currentMessages = _messages.value[roomId] || [];
      const newMessages = [...currentMessages, newMessage];

      console.log(`[ChatStore] 🔄 Updating reactivity for room ${roomId}:`, {
        oldCount: currentMessages.length,
        newCount: newMessages.length,
        messageId: newMessage.id,
        roomsWithMessages: Object.keys(_messages.value),
      });

      // Log before reactivity update
      chatDiagnostics.logReactivityIssue(roomId, 'BEFORE_REACTIVITY_UPDATE', {
        oldCount: currentMessages.length,
        newCount: newMessages.length,
        messageId: newMessage.id,
        messagesStateKeys: Object.keys(_messages.value),
      });

      // ENHANCED REACTIVITY: Use multiple approaches to ensure Vue detects the change

      // Method 1: Direct assignment with new array
      _messages.value[roomId] = newMessages;

      // Method 2: Force reactivity by creating completely new object
      const newMessagesState = { ..._messages.value };
      newMessagesState[roomId] = newMessages;
      _messages.value = newMessagesState;

      // Method 3: Trigger reactivity using Vue's nextTick if available
      if (typeof window !== 'undefined' && window.Vue?.nextTick) {
        window.Vue.nextTick(() => {
          console.log(
            `[ChatStore] 🔄 Vue nextTick triggered for room ${roomId}`
          );
        });
      }

      // Verify the update was successful
      const finalCount = _messages.value[roomId]?.length || 0;
      const updateSuccessful = finalCount === newMessages.length;

      console.log(
        `[ChatStore] ✅ Reactivity update completed for room ${roomId}:`,
        {
          finalCount,
          expectedCount: newMessages.length,
          updateSuccessful,
          messageId: newMessage.id,
        }
      );

      // Log after reactivity update
      chatDiagnostics.logReactivityIssue(roomId, 'AFTER_REACTIVITY_UPDATE', {
        finalCount,
        messageId: newMessage.id,
        reactivitySuccessful: updateSuccessful,
      });

      if (!updateSuccessful) {
        console.error(
          `[ChatStore] ❌ REACTIVITY FAILED for room ${roomId}! Expected ${newMessages.length}, got ${finalCount}`
        );

        // Try alternative reactivity approach
        console.log(`[ChatStore] 🔧 Attempting alternative reactivity fix...`);

        // Force a complete re-assignment
        const allMessages = { ..._messages.value };
        allMessages[roomId] = [...newMessages];
        _messages.value = {};
        _messages.value = allMessages;

        console.log(`[ChatStore] 🔧 Alternative reactivity attempt completed`);
      }

      // Update the room's latest message and timestamp
      const roomIndex = _chatRooms.value.findIndex(
        (room) => room.id === roomId
      );
      if (roomIndex !== -1) {
        console.log(`[ChatStore] 🏠 Updating room ${roomId} latest message`);

        _chatRooms.value[roomIndex].updated_at = newMessage.created_at;
        _chatRooms.value[roomIndex].latestMessage = {
          id: newMessage.id,
          content:
            newMessage.message_type === 'image'
              ? '📷 Image'
              : newMessage.message_type === 'budget_proposal'
                ? '💰 Budget Proposal'
                : newMessage.content,
          created_at: newMessage.created_at,
          sender_user_id: newMessage.sender_user_id,
          read_at: newMessage.read_at,
        };

        // Re-sort rooms by updated_at
        _chatRooms.value.sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        );

        console.log(`[ChatStore] 🏠 Room ${roomId} updated and re-sorted`);
      }

      // Update unread count for this room
      updateUnreadCount(roomId);

      console.log(`[ChatStore] 📊 Unread count updated for room ${roomId}`);
    } else {
      console.log(
        `[ChatStore] ⚠️ Message ${newMessage.id} already exists in room ${roomId}, skipping duplicate`
      );

      chatDiagnostics.logMessageFlow(roomId, 'DUPLICATE_MESSAGE_SKIPPED', {
        messageId: newMessage.id,
        existingMessageCount: _messages.value[roomId]?.length || 0,
      });

      subscriptionDiagnostics.logMessageEvent(
        roomId,
        newMessage.id,
        'DUPLICATE_MESSAGE_SKIPPED'
      );
    }
  };

  // Helper function to handle message updates
  const handleMessageUpdate = (roomId, updatedMessage) => {
    if (!_messages.value[roomId]) {
      return;
    }

    const messageIndex = _messages.value[roomId].findIndex(
      (msg) => msg.id === updatedMessage.id
    );

    if (messageIndex !== -1) {
      // Update the existing message
      const currentMessages = [..._messages.value[roomId]];
      currentMessages[messageIndex] = updatedMessage;

      // Create a new messages object to ensure Vue detects the change
      const newMessagesState = { ..._messages.value };
      newMessagesState[roomId] = currentMessages;
      _messages.value = newMessagesState;

      console.log('[ChatStore] DIAGNOSTIC - Message updated in local state:', {
        roomId,
        messageId: updatedMessage.id,
        messageType: updatedMessage.message_type,
      });

      chatDiagnostics.logMessageFlow(roomId, 'MESSAGE_UPDATED_IN_LOCAL_STATE', {
        messageId: updatedMessage.id,
        messageType: updatedMessage.message_type,
      });
    }
  };

  /**
   * Fetch user profiles for other users in chat rooms
   */
  const fetchOtherUserProfiles = async (userIds) => {
    if (!userIds || userIds.length === 0) return;

    return executeWithAuth(async (supabase) => {
      // Try to fetch from client_profiles table first
      const { data: profilesData, error: profilesError } = await supabase
        .from('client_profiles')
        .select('id, full_name, email, profile_picture_url')
        .in('id', userIds);

      // Also try to fetch from contractor_profiles table using id
      const { data: contractorData, error: contractorError } = await supabase
        .from('contractor_profiles')
        .select('id, full_name, profile_picture_url')
        .in('id', userIds);

      // Combine and store profiles
      const allProfiles = [];

      if (profilesData) {
        allProfiles.push(...profilesData);
      }

      if (contractorData) {
        // Map contractor profiles to match the expected format
        contractorData.forEach((contractor) => {
          allProfiles.push({
            id: contractor.id,
            full_name: contractor.full_name,
            profile_picture_url: contractor.profile_picture_url,
            email: null, // Not available in contractor_profiles
          });
        });
      }

      // Store profiles in the user profiles object
      allProfiles.forEach((profile) => {
        _userProfiles.value[profile.id] = profile;
      });
    }, true);
  };

  /**
   * Fetch shared jobs between current user and another user
   */
  const fetchSharedJobs = async (otherUserId) => {
    if (!otherUserId || !currentUserId.value) {
      console.error(
        '[ChatStore] fetchSharedJobs - Missing required user IDs:',
        {
          currentUserId: currentUserId.value,
          otherUserId,
        }
      );
      throw new Error('Both user IDs are required');
    }

    console.log(
      '[ChatStore] fetchSharedJobs - DIAGNOSTIC - Starting fetch with:',
      {
        currentUserId: currentUserId.value,
        currentUserIdType: typeof currentUserId.value,
        otherUserId,
        otherUserIdType: typeof otherUserId,
        authIsSignedIn: auth.isSignedIn.value,
      }
    );

    return executeWithAuth(async (supabase) => {
      console.log(
        '[ChatStore] fetchSharedJobs - DIAGNOSTIC - Executing client jobs query with params:',
        {
          posted_by_user_id: currentUserId.value,
          contractor_user_id: otherUserId,
        }
      );

      // Fetch jobs where current user is client and other user applied as contractor
      const { data: clientJobs, error: clientError } = await supabase
        .from('job_postings')
        .select(
          `
          id,
          category_name,
          description,
          photos,
          service_id,
          created_at,
          job_applications!inner(contractor_user_id)
        `
        )
        .eq('posted_by_user_id', currentUserId.value)
        .eq('job_applications.contractor_user_id', otherUserId);

      // Also fetch jobs where current user is client and other user is directly assigned
      const { data: assignedClientJobs, error: assignedClientError } =
        await supabase
          .from('job_postings')
          .select(
            `
          id,
          category_name,
          description,
          photos,
          service_id,
          created_at
        `
          )
          .eq('posted_by_user_id', currentUserId.value)
          .eq('selected_contractor_id', otherUserId);

      console.log(
        '[ChatStore] fetchSharedJobs - DIAGNOSTIC - Assigned client jobs query result:',
        {
          assignedClientJobs,
          assignedClientJobsCount: assignedClientJobs?.length || 0,
          assignedClientError,
          jobIds: assignedClientJobs?.map((job) => job.id) || [],
        }
      );

      console.log(
        '[ChatStore] fetchSharedJobs - DIAGNOSTIC - Client jobs query result:',
        {
          clientJobs,
          clientJobsCount: clientJobs?.length || 0,
          clientError,
          clientErrorDetails: clientError
            ? {
                message: clientError.message,
                code: clientError.code,
                details: clientError.details,
              }
            : null,
        }
      );

      console.log(
        '[ChatStore] fetchSharedJobs - DIAGNOSTIC - Executing contractor applications query with params:',
        {
          contractor_user_id: currentUserId.value,
        }
      );

      // First, get the job IDs where current user applied as contractor
      const { data: applicationData, error: applicationError } = await supabase
        .from('job_applications')
        .select('job_id')
        .eq('contractor_user_id', currentUserId.value);

      console.log(
        '[ChatStore] fetchSharedJobs - DIAGNOSTIC - Contractor applications query result:',
        {
          applicationData,
          applicationDataCount: applicationData?.length || 0,
          applicationError,
          applicationErrorDetails: applicationError
            ? {
                message: applicationError.message,
                code: applicationError.code,
                details: applicationError.details,
              }
            : null,
          applicationJobIds: applicationData?.map((app) => app.job_id) || [],
          fullApplicationData: applicationData || [],
        }
      );

      let contractorJobs = [];
      let contractorError = applicationError;

      // If we have applications, fetch the corresponding jobs
      if (applicationData && applicationData.length > 0) {
        const jobIds = applicationData.map((app) => app.job_id);

        console.log(
          '[ChatStore] fetchSharedJobs - DIAGNOSTIC - Executing contractor jobs query with params:',
          {
            posted_by_user_id: otherUserId,
            job_ids: jobIds,
          }
        );

        const { data: jobsData, error: jobsError } = await supabase
          .from('job_postings')
          .select(
            `
            id,
            category_name,
            description,
            photos,
            service_id,
            created_at
          `
          )
          .eq('posted_by_user_id', otherUserId)
          .in('id', jobIds);

        contractorJobs = jobsData;
        contractorError = jobsError;

        console.log(
          '[ChatStore] fetchSharedJobs - DIAGNOSTIC - Contractor jobs query result:',
          {
            contractorJobs,
            contractorJobsCount: contractorJobs?.length || 0,
            contractorError,
            contractorErrorDetails: contractorError
              ? {
                  message: contractorError.message,
                  code: contractorError.code,
                  details: contractorError.details,
                }
              : null,
          }
        );
      } else {
        console.log(
          '[ChatStore] fetchSharedJobs - DIAGNOSTIC - No contractor applications found, skipping contractor jobs query'
        );
      }

      // Also check for jobs where current user is directly assigned as contractor
      const { data: assignedContractorJobs, error: assignedContractorError } =
        await supabase
          .from('job_postings')
          .select(
            `
          id,
          category_name,
          description,
          photos,
          service_id,
          created_at
        `
          )
          .eq('posted_by_user_id', otherUserId)
          .eq('selected_contractor_id', currentUserId.value);

      console.log(
        '[ChatStore] fetchSharedJobs - DIAGNOSTIC - Assigned contractor jobs query result:',
        {
          assignedContractorJobs,
          assignedContractorJobsCount: assignedContractorJobs?.length || 0,
          assignedContractorError,
        }
      );

      if (clientError && contractorError) {
        console.error(
          '[ChatStore] fetchSharedJobs - DIAGNOSTIC - Both queries failed:',
          {
            clientError,
            contractorError,
          }
        );
        throw new Error('Failed to fetch shared jobs');
      }

      // Process the jobs to ensure consistent data structure
      const processJob = (job) => ({
        id: job.id,
        title: job.category_name || 'Untitled Job',
        category_name: job.category_name,
        description: job.description,
        photos: job.photos,
        service_id: job.service_id,
        created_at: job.created_at,
      });

      const allJobs = [
        ...(clientJobs || []).map(processJob),
        ...(assignedClientJobs || []).map(processJob),
        ...(contractorJobs || []).map(processJob),
        ...(assignedContractorJobs || []).map(processJob),
      ];

      console.log('[ChatStore] fetchSharedJobs - DIAGNOSTIC - Final result:', {
        totalJobs: allJobs.length,
        clientJobsCount: (clientJobs || []).length,
        assignedClientJobsCount: (assignedClientJobs || []).length,
        contractorJobsCount: (contractorJobs || []).length,
        assignedContractorJobsCount: (assignedContractorJobs || []).length,
        allJobs,
        jobIds: allJobs.map((job) => job.id),
        jobTitles: allJobs.map((job) => job.title),
        currentUserId: currentUserId.value,
        hasPlumbingJob: allJobs.some((job) =>
          job.category_name?.toLowerCase().includes('plumb')
        ),
      });

      return allJobs;
    }, true);
  };

  /**
   * Fetch budget proposals for a specific room
   */
  const fetchBudgetProposals = async (roomId) => {
    if (!roomId) {
      throw new Error('Room ID is required');
    }

    return executeWithAuth(async (supabase) => {
      // Enhanced query to fetch job data with more details
      const { data, error } = await supabase
        .from('budget_proposals')
        .select(
          `
          *,
          job_postings!job_id(
            id,
            description,
            category_name,
            created_at,
            posted_by_user_id,
            status
          )
        `
        )
        .eq('room_id', roomId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ChatStore] Budget proposals fetch error:', error);
        throw new Error(`Failed to fetch budget proposals: ${error.message}`);
      }

      // Store the proposals with enhanced job data
      _budgetProposals.value[roomId] = data || [];

      // Fetch user profiles for all proposers and recipients
      if (data && data.length > 0) {
        const userIds = new Set();
        data.forEach((proposal) => {
          if (
            proposal.proposer_id &&
            proposal.proposer_id !== currentUserId.value
          ) {
            userIds.add(proposal.proposer_id);
          }
          if (
            proposal.recipient_id &&
            proposal.recipient_id !== currentUserId.value
          ) {
            userIds.add(proposal.recipient_id);
          }
        });

        if (userIds.size > 0) {
          try {
            await fetchOtherUserProfiles(Array.from(userIds));
          } catch (error) {
            console.warn(
              '[ChatStore] Failed to fetch user profiles for budget proposals:',
              error
            );
          }
        }
      }

      return data || [];
    }, true);
  };

  /**
   * Send a budget proposal
   */
  const sendBudgetProposal = async (roomId, proposalData, currentUserName) => {
    if (!roomId || !proposalData) {
      throw new Error('Room ID and proposal data are required');
    }

    if (!currentUserId.value) {
      throw new Error('User must be authenticated to send budget proposals');
    }

    return executeWithAuth(async (supabase) => {
      // Validate that we have the recipient ID
      if (!proposalData.recipientId) {
        throw new Error('Recipient ID is required for budget proposals');
      }

      // Try to use atomic transaction first, fallback to two-step process
      let proposal, message;

      try {
        // Attempt to use database function for atomic operation
        const { data: result, error: transactionError } = await supabase.rpc(
          'create_budget_proposal_with_message',
          {
            p_room_id: roomId,
            p_job_id: proposalData.jobId,
            p_proposer_id: currentUserId.value,
            p_recipient_id: proposalData.recipientId,
            p_proposal_type: proposalData.type,
            p_amount_min: proposalData.amountMin,
            p_amount_max: proposalData.amountMax,
            p_currency: proposalData.currency || 'PEN',
            p_notes: proposalData.notes,
            p_valid_until: proposalData.validUntil,
            p_sender_name: currentUserName,
          }
        );

        if (transactionError) {
          // If function doesn't exist, use fallback
          if (transactionError.code === '42883') {
            console.log(
              '[ChatStore] DIAGNOSTIC - RPC function not found, using fallback'
            );
            const fallbackResult = await createBudgetProposalFallback(
              supabase,
              roomId,
              proposalData,
              currentUserName
            );
            proposal = fallbackResult.proposal;
            message = fallbackResult.message;
          } else {
            throw transactionError;
          }
        } else {
          console.log(
            '[ChatStore] DIAGNOSTIC - Budget proposal transaction completed:',
            result
          );
          proposal = result.proposal;
          message = result.message;
        }
      } catch (error) {
        console.log(
          '[ChatStore] DIAGNOSTIC - Transaction failed, using fallback:',
          error.message
        );
        const fallbackResult = await createBudgetProposalFallback(
          supabase,
          roomId,
          proposalData,
          currentUserName
        );
        proposal = fallbackResult.proposal;
        message = fallbackResult.message;
      }

      // Update local state with the enhanced proposal data
      if (!_budgetProposals.value[roomId]) {
        _budgetProposals.value[roomId] = [];
      }
      _budgetProposals.value[roomId].unshift(proposal);

      // Add message to local cache
      const currentMessages = _messages.value[roomId] || [];
      _messages.value = {
        ..._messages.value,
        [roomId]: [...currentMessages, message],
      };

      // Fetch user profiles for proposer and recipient if not already cached
      const userIdsToFetch = [];
      if (!_userProfiles.value[proposal.proposer_id]) {
        userIdsToFetch.push(proposal.proposer_id);
      }
      if (!_userProfiles.value[proposal.recipient_id]) {
        userIdsToFetch.push(proposal.recipient_id);
      }

      if (userIdsToFetch.length > 0) {
        try {
          await fetchOtherUserProfiles(userIdsToFetch);
        } catch (error) {
          console.warn(
            'Failed to fetch user profiles for budget proposal:',
            error
          );
        }
      }

      return { proposal, message };
    }, true);
  };

  /**
   * Fallback function for creating budget proposals using the original two-step process
   */
  const createBudgetProposalFallback = async (
    supabase,
    roomId,
    proposalData,
    currentUserName
  ) => {
    const proposalRecord = {
      room_id: roomId,
      job_id: proposalData.jobId,
      proposer_id: currentUserId.value,
      recipient_id: proposalData.recipientId,
      proposal_type: proposalData.type,
      amount_min: proposalData.amountMin,
      amount_max: proposalData.amountMax,
      currency: proposalData.currency || 'PEN',
      notes: proposalData.notes,
      valid_until: proposalData.validUntil,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // Create the budget proposal with job data
    const { data: proposal, error: proposalError } = await supabase
      .from('budget_proposals')
      .insert([proposalRecord])
      .select(
        `
        *,
        job_postings!job_id(
          id,
          description,
          category_name,
          created_at
        )
      `
      )
      .single();

    if (proposalError) {
      throw new Error(
        `Failed to create budget proposal: ${proposalError.message}`
      );
    }

    // Send a message about the budget proposal
    const messageData = {
      room_id: roomId,
      sender_user_id: currentUserId.value,
      content: '', // Content is empty string for budget_proposal type
      message_type: 'budget_proposal',
      budget_data: { proposal_id: proposal.id },
      created_at: new Date().toISOString(),
      sender_name: currentUserName,
    };

    console.log(
      '[ChatStore] DIAGNOSTIC - Creating budget proposal message (fallback):',
      {
        messageData,
        proposalId: proposal.id,
        roomId,
        currentUserId: currentUserId.value,
      }
    );

    const { data: message, error: messageError } = await supabase
      .from('chat_messages')
      .insert([messageData])
      .select('*')
      .single();

    if (messageError) {
      console.error(
        '[ChatStore] DIAGNOSTIC - Budget proposal message creation failed (fallback):',
        messageError
      );
      throw new Error(
        `Failed to send budget proposal message: ${messageError.message}`
      );
    }

    console.log(
      '[ChatStore] DIAGNOSTIC - Budget proposal message created successfully (fallback):',
      message
    );

    return { proposal, message };
  };

  /**
   * Accept a budget proposal
   */
  const acceptBudgetProposal = async (proposalId) => {
    if (!proposalId) {
      throw new Error('Proposal ID is required');
    }

    return executeWithAuth(async (supabase) => {
      const { data, error } = await supabase
        .from('budget_proposals')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by: currentUserId.value,
        })
        .eq('id', proposalId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to accept budget proposal: ${error.message}`);
      }

      // Update local state
      Object.keys(_budgetProposals.value).forEach((roomId) => {
        const proposals = _budgetProposals.value[roomId];
        const index = proposals.findIndex((p) => p.id === proposalId);
        if (index !== -1) {
          proposals[index] = data;
        }
      });

      return data;
    }, true);
  };

  /**
   * Decline a budget proposal
   */
  const declineBudgetProposal = async (proposalId) => {
    if (!proposalId) {
      throw new Error('Proposal ID is required');
    }

    return executeWithAuth(async (supabase) => {
      const { data, error } = await supabase
        .from('budget_proposals')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString(),
          declined_by: currentUserId.value,
        })
        .eq('id', proposalId)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Failed to decline budget proposal: ${error.message}`);
      }

      // Update local state
      Object.keys(_budgetProposals.value).forEach((roomId) => {
        const proposals = _budgetProposals.value[roomId];
        const index = proposals.findIndex((p) => p.id === proposalId);
        if (index !== -1) {
          proposals[index] = data;
        }
      });

      return data;
    }, true);
  };

  /**
   * Counter a budget proposal
   */
  const counterBudgetProposal = async (proposalId, newProposalData) => {
    if (!proposalId || !newProposalData) {
      throw new Error('Proposal ID and new proposal data are required');
    }

    return executeWithAuth(async (supabase) => {
      // First decline the original proposal
      await declineBudgetProposal(proposalId);

      // Get the original proposal to extract room_id, job_id, and proposer_id
      const { data: originalProposal, error: fetchError } = await supabase
        .from('budget_proposals')
        .select('room_id, job_id, proposer_id')
        .eq('id', proposalId)
        .single();

      if (fetchError) {
        throw new Error(
          `Failed to fetch original proposal: ${fetchError.message}`
        );
      }

      // Create the counter proposal
      return await sendBudgetProposal(
        originalProposal.room_id,
        {
          ...newProposalData,
          jobId: originalProposal.job_id,
          recipientId: originalProposal.proposer_id, // Send counter proposal back to original proposer
        },
        'Counter Proposal'
      );
    }, true);
  };

  /**
   * Refresh unread counts for all rooms
   */
  const refreshUnreadCounts = () => {
    _chatRooms.value.forEach((room) => {
      updateUnreadCount(room.id);
    });
  };

  // Clean up subscription for a specific room
  const cleanupSubscription = async (roomId) => {
    if (!roomId) return;

    console.log(
      `[ChatStore] DIAGNOSTIC - Cleaning up subscription for room: ${roomId}`
    );

    try {
      // Use the real-time connection manager for cleanup
      await realtimeConnectionManager.removeSubscription(`chat-room-${roomId}`);
      console.log(
        `[ChatStore] DIAGNOSTIC - Subscription cleanup completed for room: ${roomId}`
      );
    } catch (error) {
      console.error(
        `[ChatStore] DIAGNOSTIC - Subscription cleanup failed for room: ${roomId}`,
        error
      );
    }
  };

  // Clean up all subscriptions
  const cleanupAllSubscriptions = async () => {
    console.log('[ChatStore] DIAGNOSTIC - Cleaning up all subscriptions');

    try {
      // Get all active connection IDs and clean them up
      const connectionStatus = realtimeConnectionManager.getConnectionStatus();
      const cleanupPromises = connectionStatus.connections.map((conn) =>
        realtimeConnectionManager.removeSubscription(conn.id)
      );

      await Promise.allSettled(cleanupPromises);
      console.log(
        '[ChatStore] DIAGNOSTIC - All subscriptions cleanup completed'
      );
    } catch (error) {
      console.error(
        '[ChatStore] DIAGNOSTIC - All subscriptions cleanup failed',
        error
      );
    }
  };

  /**
   * Clear cache for specific data
   */
  const clearCache = (key = null) => {
    if (key) {
      delete _lastFetchTime.value[key];
      if (key.startsWith('messages_')) {
        const roomId = key.replace('messages_', '');
        delete _messages.value[roomId];
        delete _unreadCounts.value[roomId];
      }
    } else {
      _lastFetchTime.value = {};
      _messages.value = {};
      _chatRooms.value = [];
      _unreadCounts.value = {};
      _budgetProposals.value = {};
    }
  };

  /**
   * Reset store state
   */
  const reset = () => {
    _chatRooms.value = [];
    _currentRoomId.value = null;
    _messages.value = {};
    _isLoading.value = false;
    _error.value = null;
    _lastFetchTime.value = {};
    _userProfiles.value = {};
    _unreadCounts.value = {};
    _budgetProposals.value = {};
  };

  // Watch for auth state changes and reset if user changes
  watch(currentUserId, (newUserId, oldUserId) => {
    if (newUserId !== oldUserId) {
      if (newUserId && !oldUserId) {
        // User just signed in for the first time, don't reset
      } else if (!newUserId && oldUserId) {
        // User signed out, reset everything

        reset();
      } else if (newUserId && oldUserId && newUserId !== oldUserId) {
        // Different user signed in, reset everything

        reset();
      }
    }
  });

  return {
    // State
    chatRooms,
    currentRoomId,
    currentRoom,
    currentRoomMessages,
    isLoading,
    error,
    otherUserProfiles,
    currentRoomBudgetProposals,

    // Unread message tracking
    unreadCounts,
    totalUnreadCount,
    hasUnreadMessages,

    // Actions
    fetchChatRooms,
    fetchMessages,
    sendMessage,
    sendImageMessage,
    createOrGetChatRoom,
    createJobChatRoom,
    createMissingChatRoomsForAssignedJobs,
    setCurrentRoom,
    markMessagesAsRead,
    subscribeToMessages,
    cleanupSubscription,
    cleanupAllSubscriptions,
    fetchOtherUserProfiles,
    fetchSharedJobs,
    fetchBudgetProposals,
    sendBudgetProposal,
    acceptBudgetProposal,
    declineBudgetProposal,
    counterBudgetProposal,
    refreshUnreadCounts,
    clearCache,
    reset,

    // Auth state from composable
    isAuthReady: computed(() => auth.isAuthReady.value),
    isAuthenticated: computed(() => auth.isAuthenticated.value),
    currentUserId,
  };
});
