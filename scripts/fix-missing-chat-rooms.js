#!/usr/bin/env node

/**
 * Script to fix missing chat rooms for assigned jobs
 *
 * This script identifies jobs that have been assigned to contractors
 * but don't have corresponding chat rooms, and creates them.
 *
 * Usage: node scripts/fix-missing-chat-rooms.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingChatRooms() {
  console.log('🔍 Checking for assigned jobs without chat rooms...');

  try {
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
      console.log('✅ No assigned jobs found');
      return { created: 0, errors: [] };
    }

    console.log(
      `📋 Found ${assignedJobs.length} assigned jobs, checking for missing chat rooms...`
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
          console.log(`✅ Chat room already exists for job ${job.id}`);
          continue;
        }

        // Create missing chat room using the database function
        console.log(`🔧 Creating missing chat room for job ${job.id}...`);

        const { data: roomId, error: roomError } = await supabase.rpc(
          'get_or_create_general_chat_room',
          {
            p_contractor_id: job.selected_contractor_id,
            p_client_id: job.posted_by_user_id,
          }
        );

        if (roomError) {
          throw new Error(`Failed to create chat room: ${roomError.message}`);
        }

        // Get contractor name for welcome message
        const { data: contractorProfile } = await supabase
          .from('contractor_profiles')
          .select('full_name')
          .eq('id', job.selected_contractor_id)
          .single();

        const contractorName = contractorProfile?.full_name || 'Contractor';

        // Add welcome message
        const { error: messageError } = await supabase
          .from('chat_messages')
          .insert([
            {
              room_id: roomId,
              sender_user_id: job.selected_contractor_id,
              content: `🎉 Great news! I've been selected for this job. Let's discuss the details and get started!`,
              sender_name: contractorName,
              job_reference_id: job.id,
              job_context: `${job.category_name} - ${job.description}`,
              created_at: new Date().toISOString(),
            },
          ]);

        if (messageError) {
          console.warn(
            `⚠️  Failed to create welcome message for job ${job.id}: ${messageError.message}`
          );
        }

        results.created++;
        console.log(
          `✅ Successfully created chat room for job ${job.id} (Room ID: ${roomId})`
        );
      } catch (error) {
        console.error(
          `❌ Failed to create chat room for job ${job.id}: ${error.message}`
        );
        results.errors.push({
          jobId: job.id,
          error: error.message,
        });
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Chat rooms created: ${results.created}`);
    console.log(`   ❌ Errors: ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach(({ jobId, error }) => {
        console.log(`   - Job ${jobId}: ${error}`);
      });
    }

    return results;
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
createMissingChatRooms()
  .then((results) => {
    if (results.created > 0) {
      console.log('\n🎉 Chat room recovery completed successfully!');
    } else {
      console.log('\n✅ No missing chat rooms found.');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
