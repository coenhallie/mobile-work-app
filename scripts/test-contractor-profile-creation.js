/**
 * Test script to verify contractor profile creation works after database fix
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl =
  process.env.VITE_SUPABASE_URL || 'https://qdyjtebjyktxundpqzqt.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContractorProfileCreation() {
  console.log('🧪 Testing contractor profile creation with ON CONFLICT fix...');

  try {
    // Test data for a contractor profile
    const testUserId = 'test-user-' + Date.now();
    const testProfileData = {
      user_id: testUserId,
      id: crypto.randomUUID(),
      full_name: 'Test Contractor',
      bio: 'Test bio for contractor profile creation',
      years_experience: '5-10',
      contact_phone: '+51987654321',
      skills: ['plumbing', 'electrical'],
      service_ids: ['plumbing', 'electrical'],
      service_areas: ['Lima', 'Callao'],
      role: 'contractor',
      onboarding_step: 'completed',
      profile_completion_percentage: 100,
      onboarding_variant: 'current',
      credits: 0,
    };

    console.log('📝 Attempting to create contractor profile with upsert...');

    // Test the upsert operation that was failing before
    const { data: savedProfile, error: supabaseError } = await supabase
      .from('contractor_profiles')
      .upsert(testProfileData, {
        onConflict: 'user_id',
        returning: 'minimal',
      });

    if (supabaseError) {
      console.error('❌ Profile creation failed:', supabaseError);
      return false;
    }

    console.log('✅ Profile created successfully!');

    // Test updating the same profile (should use ON CONFLICT)
    console.log('🔄 Testing profile update with same user_id...');

    const updatedData = {
      ...testProfileData,
      bio: 'Updated bio for testing ON CONFLICT functionality',
      years_experience: '10+',
    };

    const { data: updatedProfile, error: updateError } = await supabase
      .from('contractor_profiles')
      .upsert(updatedData, {
        onConflict: 'user_id',
        returning: 'minimal',
      });

    if (updateError) {
      console.error('❌ Profile update failed:', updateError);
      return false;
    }

    console.log('✅ Profile updated successfully using ON CONFLICT!');

    // Verify the profile exists
    const { data: verifiedProfile, error: verifyError } = await supabase
      .from('contractor_profiles')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (verifyError) {
      console.error('❌ Profile verification failed:', verifyError);
      return false;
    }

    console.log('✅ Profile verified in database:', {
      user_id: verifiedProfile.user_id,
      full_name: verifiedProfile.full_name,
      bio: verifiedProfile.bio,
      years_experience: verifiedProfile.years_experience,
    });

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    const { error: deleteError } = await supabase
      .from('contractor_profiles')
      .delete()
      .eq('user_id', testUserId);

    if (deleteError) {
      console.warn('⚠️ Failed to clean up test data:', deleteError);
    } else {
      console.log('✅ Test data cleaned up successfully');
    }

    return true;
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return false;
  }
}

// Run the test
testContractorProfileCreation()
  .then((success) => {
    if (success) {
      console.log(
        '\n🎉 All tests passed! The ON CONFLICT fix is working correctly.'
      );
      process.exit(0);
    } else {
      console.log(
        '\n💥 Tests failed! There may still be issues with the database constraints.'
      );
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  });
