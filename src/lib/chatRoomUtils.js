import { supabase } from './supabaseClientManager.js';

/**
 * Get or create a general chat room between a client and contractor
 * This function ensures only one general room exists per contractor-client pair
 * @param {string} clientId - The client's profile ID
 * @param {string} contractorId - The contractor's profile ID
 * @returns {Promise<Object>} The chat room object
 */
export async function getOrCreateGeneralChatRoom(clientId, contractorId) {
  try {
    // First, check for existing general chat room between this client-contractor pair
    const { data: existingRoom, error: fetchError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('client_id', clientId)
      .eq('contractor_id', contractorId)
      .is('job_id', null)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected if no room exists
      throw new Error(
        `Failed to fetch existing chat room: ${fetchError.message}`
      );
    }

    // If room exists, return it
    if (existingRoom) {
      return existingRoom;
    }

    // If no room exists, create a new one
    const { data: newRoom, error: createError } = await supabase
      .from('chat_rooms')
      .insert({
        client_id: clientId,
        contractor_id: contractorId,
        job_id: null,
      })
      .select()
      .single();

    if (createError) {
      // If creation fails due to unique constraint violation, try to fetch the existing room
      if (createError.code === '23505') {
        console.warn('Room already exists, fetching existing room...');
        const { data: existingRoom, error: refetchError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('client_id', clientId)
          .eq('contractor_id', contractorId)
          .is('job_id', null)
          .single();

        if (refetchError) {
          throw new Error(
            `Failed to fetch existing room after constraint violation: ${refetchError.message}`
          );
        }
        return existingRoom;
      }
      throw new Error(`Failed to create chat room: ${createError.message}`);
    }

    return newRoom;
  } catch (error) {
    console.error('Error in getOrCreateGeneralChatRoom:', error);
    throw error;
  }
}

/**
 * Check for and clean up any duplicate chat rooms
 * This function should be called periodically or when duplicates are detected
 * @returns {Promise<Object>} Cleanup results
 */
export async function cleanupDuplicateChatRooms() {
  try {
    // Find duplicate general chat rooms
    const { data: duplicates, error: findError } = await supabase.rpc(
      'find_duplicate_general_rooms'
    );

    if (findError) {
      throw new Error(`Failed to find duplicates: ${findError.message}`);
    }

    const cleanupResults = {
      duplicatesFound: duplicates?.length || 0,
      roomsRemoved: 0,
      messagesPreserved: 0,
    };

    // Process each set of duplicates
    for (const duplicate of duplicates || []) {
      const { client_id, contractor_id, room_ids, message_counts } = duplicate;

      // Keep the room with the most messages (or oldest if tie)
      const roomData = room_ids.map((id, index) => ({
        id,
        messageCount: message_counts[index],
      }));

      // Sort by message count (desc) then by creation date (asc)
      roomData.sort((a, b) => {
        if (b.messageCount !== a.messageCount) {
          return b.messageCount - a.messageCount;
        }
        return a.id.localeCompare(b.id); // Use ID as tiebreaker for consistency
      });

      const keepRoom = roomData[0];
      const removeRooms = roomData.slice(1);

      // Remove duplicate rooms
      for (const room of removeRooms) {
        // Delete messages
        await supabase.from('chat_messages').delete().eq('room_id', room.id);

        // Delete budget proposals
        await supabase.from('budget_proposals').delete().eq('room_id', room.id);

        // Delete the room
        await supabase.from('chat_rooms').delete().eq('id', room.id);

        cleanupResults.roomsRemoved++;
      }

      cleanupResults.messagesPreserved += keepRoom.messageCount;
    }

    return cleanupResults;
  } catch (error) {
    console.error('Error in cleanupDuplicateChatRooms:', error);
    throw error;
  }
}

/**
 * Validate chat room integrity
 * Checks for orphaned rooms, missing references, etc.
 * @returns {Promise<Object>} Validation results
 */
export async function validateChatRoomIntegrity() {
  try {
    const results = {
      totalRooms: 0,
      orphanedRooms: [],
      invalidReferences: [],
      duplicateRooms: [],
    };

    // Get all chat rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('*');

    if (roomsError) {
      throw new Error(`Failed to fetch rooms: ${roomsError.message}`);
    }

    results.totalRooms = rooms?.length || 0;

    // Check for orphaned rooms (invalid client_id or contractor_id)
    for (const room of rooms || []) {
      // Check if client exists
      const { data: client } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('id', room.client_id)
        .single();

      // Check if contractor exists
      const { data: contractor } = await supabase
        .from('contractor_profiles')
        .select('id')
        .eq('id', room.contractor_id)
        .single();

      if (!client || !contractor) {
        results.orphanedRooms.push({
          roomId: room.id,
          missingClient: !client,
          missingContractor: !contractor,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error in validateChatRoomIntegrity:', error);
    throw error;
  }
}
