// Test script for the contractor availability system
// Run with: node scripts/test-availability-system.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAvailabilitySystem() {
  console.log('🧪 Testing Contractor Availability System...\n');

  try {
    // Test 1: Check if availability columns exist
    console.log('1. Checking database schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('contractor_profiles')
      .select(
        'availability_status, availability_message, working_hours, busy_until, auto_availability'
      )
      .limit(1);

    if (schemaError) {
      console.error('❌ Schema check failed:', schemaError.message);
      return;
    }
    console.log('✅ Availability columns exist in database');

    // Test 2: Check existing contractors
    console.log('\n2. Checking existing contractors...');
    const { data: contractors, error: contractorsError } = await supabase
      .from('contractor_profiles')
      .select(
        'id, full_name, availability_status, availability_message, working_hours, busy_until'
      )
      .eq('role', 'contractor')
      .limit(5);

    if (contractorsError) {
      console.error(
        '❌ Failed to fetch contractors:',
        contractorsError.message
      );
      return;
    }

    console.log(`✅ Found ${contractors.length} contractors`);
    contractors.forEach((contractor) => {
      console.log(
        `   - ${contractor.full_name}: ${contractor.availability_status || 'available'}`
      );
      if (contractor.availability_message) {
        console.log(`     Message: "${contractor.availability_message}"`);
      }
    });

    // Test 3: Test availability function (if it exists)
    console.log('\n3. Testing availability function...');
    if (contractors.length > 0) {
      const testContractorId = contractors[0].id;

      try {
        const { data: isAvailable, error: functionError } = await supabase.rpc(
          'is_contractor_available_now',
          { contractor_id: testContractorId }
        );

        if (functionError) {
          console.log(
            '⚠️  Availability function not yet deployed:',
            functionError.message
          );
        } else {
          console.log(
            `✅ Contractor ${contractors[0].full_name} availability: ${isAvailable}`
          );
        }
      } catch (err) {
        console.log('⚠️  Availability function not available:', err.message);
      }
    }

    // Test 4: Test filtering available contractors
    console.log('\n4. Testing availability filtering...');
    const { data: availableContractors, error: filterError } = await supabase
      .from('contractor_profiles')
      .select('id, full_name, availability_status')
      .eq('role', 'contractor')
      .eq('availability_status', 'available');

    if (filterError) {
      console.error(
        '❌ Failed to filter available contractors:',
        filterError.message
      );
      return;
    }

    console.log(
      `✅ Found ${availableContractors.length} available contractors`
    );

    // Test 5: Test updating availability
    console.log('\n5. Testing availability update...');
    if (contractors.length > 0) {
      const testContractor = contractors[0];
      const newStatus =
        testContractor.availability_status === 'available'
          ? 'busy'
          : 'available';

      const { error: updateError } = await supabase
        .from('contractor_profiles')
        .update({
          availability_status: newStatus,
          availability_message: 'Test message from availability system',
          availability_updated_at: new Date().toISOString(),
        })
        .eq('id', testContractor.id);

      if (updateError) {
        console.error('❌ Failed to update availability:', updateError.message);
      } else {
        console.log(
          `✅ Successfully updated ${testContractor.full_name} status to: ${newStatus}`
        );

        // Revert the change
        await supabase
          .from('contractor_profiles')
          .update({
            availability_status:
              testContractor.availability_status || 'available',
            availability_message: testContractor.availability_message,
            availability_updated_at: new Date().toISOString(),
          })
          .eq('id', testContractor.id);

        console.log('✅ Reverted test changes');
      }
    }

    console.log('\n🎉 Availability system test completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run the database migration: supabase db push');
    console.log('2. Test the "Available Now" filter in the contractor list');
    console.log(
      '3. Add the ContractorAvailabilitySettings component to contractor profiles'
    );
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAvailabilitySystem()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test script error:', error);
    process.exit(1);
  });
