<template>
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
  >
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome! Let's Get You Started</CardTitle>
        <CardDescription>
          Help us match you with the right jobs by providing some basic info.
          You can skip this for now.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="grid gap-1.5">
          <Label for="primary-skill"
            >Primary Skill/Trade <span class="text-red-500">*</span></Label
          >
          <Select v-model="primarySkill">
            <SelectTrigger id="primary-skill">
              <SelectValue placeholder="Select your main skill" />
            </SelectTrigger>
            <SelectContent>
              <!-- TODO: Populate with actual skill categories -->
              <SelectItem value="plumbing">Plumbing</SelectItem>
              <SelectItem value="electrical">Electrical</SelectItem>
              <SelectItem value="painting">Painting</SelectItem>
              <SelectItem value="carpentry">Carpentry</SelectItem>
              <SelectItem value="gardening">Gardening</SelectItem>
              <SelectItem value="general">General contractor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="grid gap-1.5">
          <Label for="service-areas"
            >Service Areas (Districts)
            <span class="text-red-500">*</span></Label
          >
          <!-- TODO: Replace with a better multi-select component if available, or use checkboxes -->
          <div class="space-y-2 p-2 border rounded">
            <p class="text-sm text-muted-foreground">
              Select the districts you serve:
            </p>
            <!-- Example Checkboxes - Replace with dynamic list -->
            <div
              v-for="district in availableDistricts"
              :key="district.id"
              class="flex items-center space-x-2"
            >
              <input
                type="checkbox"
                :id="'district-' + district.id"
                :value="district.id"
                v-model="selectedServiceAreas"
                class="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
              />
              <label :for="'district-' + district.id" class="text-sm">{{
                district.name
              }}</label>
            </div>
          </div>
          <p v-if="showAreaError" class="text-sm text-red-600">
            Please select at least one service area.
          </p>
        </div>
      </CardContent>
      <CardFooter class="flex justify-between">
        <Button variant="outline" @click="handleSkip">Skip for Now</Button>
        <Button @click="handleSave" :disabled="isSaving">
          {{ isSaving ? 'Saving...' : 'Save & Continue' }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/composables/useAuth';

const { user, userRole, getSupabaseClient } = useAuth();

// Get Supabase client instance
const supabase = getSupabaseClient();

const emit = defineEmits(['complete', 'skip']);

const primarySkill = ref('');
const selectedServiceAreas = ref([]);
const isSaving = ref(false);
const showAreaError = ref(false);

// TODO: Fetch actual districts from backend/config
const availableDistricts = ref([
  { id: 'miraflores', name: 'Miraflores' },
  { id: 'san_isidro', name: 'San Isidro' },
  { id: 'surco', name: 'Surco' },
  { id: 'san_borja', name: 'San Borja' },
  { id: 'barranco', name: 'Barranco' },
]);

const handleSave = async () => {
  // Basic validation
  showAreaError.value = selectedServiceAreas.value.length === 0;
  if (!primarySkill.value || selectedServiceAreas.value.length === 0) {
    return;
  }

  // Use the Clerk user ID directly (string)
  if (!user.value) {
    console.error('Clerk user not available. Cannot save profile.');
    alert('Error: User session not found. Please try logging in again.');
    return;
  }
  const clerkUserId = user.value.id; // Use the Clerk user ID (string)

  isSaving.value = true;
  try {
    // Only save to contractor_profiles if user is actually a contractor
    if (userRole.value !== 'contractor') {
      console.warn(
        'User is not a contractor, skipping contractor profile creation'
      );
      emit('complete');
      return;
    }

    // Prepare data using the Clerk User ID (string)
    const profileDataToSave = {
      user_id: clerkUserId, // Use the Clerk ID (string)
      skills: primarySkill.value ? [primarySkill.value] : [], // Convert to skills array
      service_areas: selectedServiceAreas.value, // Supabase typically handles JSON arrays well
      role: 'contractor', // Explicitly set role as contractor
      updated_at: new Date().toISOString(),
    };

    console.log(
      'Attempting to upsert profile data for Clerk user:',
      clerkUserId,
      profileDataToSave
    );

    // 1. Save data to Supabase using the dynamically created client
    // Assumes table 'contractor_profiles' and 'id' (UUID) is the primary key
    const { data: upsertData, error: supabaseError } = await supabase
      .from('contractor_profiles')
      .upsert(profileDataToSave, { onConflict: 'id' }) // onConflict uses the UUID id
      .select()
      .single();

    if (supabaseError) {
      console.error('Supabase upsert error:', supabaseError.message);
      throw new Error(`Failed to save profile data: ${supabaseError.message}`);
    }
    console.log('Supabase upsert successful:', upsertData);

    // 2. Update user metadata in Supabase
    if (user.value) {
      console.log('Attempting to update user metadata...');
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          initialSetupComplete: true,
        },
      });

      if (metadataError) {
        console.warn('Failed to update user metadata:', metadataError.message);
      } else {
        console.log('User metadata updated successfully.');
      }
    }

    emit('complete'); // Signal completion to parent/router
  } catch (error) {
    console.error('Error during minimal profile save:', error);
    // TODO: Show user-friendly error message
    alert(`An error occurred: ${error.message || 'Please try again.'}`); // Simple alert
  } finally {
    isSaving.value = false;
  }
};

const handleSkip = () => {
  console.log('Skipping minimal setup');
  // For simplicity, skipping just closes this component.
  emit('skip'); // Signal skip to parent/router
};
</script>

<style scoped>
/* Add any specific styles if needed */
.form-checkbox {
  /* Basic styling for checkboxes if not using a UI library component */
  appearance: none;
  border: 1px solid #ccc;
  border-radius: 4px;
  display: inline-block;
  position: relative;
  cursor: pointer;
}
.form-checkbox:checked {
  background-color: #4f46e5; /* indigo-600 */
  border-color: #4f46e5;
}
.form-checkbox:checked::after {
  content: '✔';
  position: absolute;
  color: white;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
}
</style>
