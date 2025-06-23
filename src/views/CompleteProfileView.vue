<template>
  <div class="container mx-auto p-4 max-w-lg">
    <!-- Progress bar and step indicator -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium text-muted-foreground">{{
          currentStep > totalSteps
            ? $t('completeProfile.complete')
            : `${$t('completeProfile.step')} ${currentStep} ${$t('completeProfile.of')} ${totalSteps}`
        }}</span>
        <span class="text-sm font-medium text-muted-foreground"
          >{{ Math.round((currentStep / totalSteps) * 100)
          }}{{ $t('completeProfile.percentComplete') }}</span
        >
      </div>
      <div class="w-full bg-muted rounded-full h-2.5">
        <div
          class="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out"
          :style="{
            width: `${Math.min(100, (currentStep / totalSteps) * 100)}%`,
          }"
        ></div>
      </div>
    </div>

    <!-- Visual breadcrumb navigation -->
    <div class="flex justify-between mb-8 px-2">
      <template v-for="step in totalSteps" :key="step">
        <div
          class="flex flex-col items-center cursor-pointer"
          @click="goToStep(step)"
          :class="{ 'opacity-50': step > highestStepReached }"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors duration-200"
            :class="[
              currentStep === step
                ? 'bg-primary text-white'
                : step < currentStep
                  ? 'bg-green-100 text-green-600 border border-green-600'
                  : 'bg-muted text-muted-foreground border border-border',
            ]"
          >
            <span v-if="step < currentStep" class="text-sm">✓</span>
            <span v-else class="text-sm">{{ step }}</span>
          </div>
          <span
            class="text-xs hidden sm:block"
            :class="{ 'text-primary font-medium': currentStep === step }"
          >
            {{ getStepName(step) }}
          </span>
        </div>
        <div
          v-if="step < totalSteps"
          class="flex-grow border-t border-border self-center"
        ></div>
      </template>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ currentStepTitle }}</CardTitle>
        <CardDescription v-if="currentStepDescription">
          {{ currentStepDescription }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <!-- Step 1: Welcome Screen -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div
            class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center mt-4"
          >
            <div class="mr-3 text-amber-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p class="font-medium text-amber-800">
                {{ $t('completeProfile.credits.earnCredits') }}
              </p>
              <p class="text-sm text-amber-700">
                {{ $t('completeProfile.credits.boostVisibility') }}
              </p>
            </div>
          </div>
          <p class="text-center text-sm text-gray-500">
            {{ $t('completeProfile.timeEstimate') }}
          </p>
        </div>

        <!-- Step 2: Personal Information -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="grid gap-1.5">
            <Label for="full-name">
              {{ $t('completeProfile.fullName') }}
              <span class="text-red-500">*</span>
            </Label>
            <Input
              id="full-name"
              type="text"
              v-model="profileData.fullName"
              :placeholder="t('auth.enterFullNamePlaceholder')"
              :class="{ 'border-red-500': validationErrors.fullName }"
            />
            <p v-if="validationErrors.fullName" class="text-sm text-red-500">
              {{ validationErrors.fullName }}
            </p>
          </div>
        </div>

        <!-- Step 3: Professional Details - Part 1 -->
        <div v-if="currentStep === 3" class="space-y-4">
          <div class="grid gap-1.5">
            <Label for="bio">
              {{ $t('completeProfile.bioDescription') }}
              <span class="text-red-500">*</span>
            </Label>
            <Textarea
              id="bio"
              v-model="profileData.bio"
              :placeholder="t('profile.bioPlaceholder')"
              rows="6"
              :class="{ 'border-red-500': validationErrors.bio }"
            />
            <div class="flex justify-between text-xs text-muted-foreground">
              <span>{{ profileData.bio.length }} characters</span>
              <span>{{ t('profile.minimumCharacters', { count: 50 }) }}</span>
            </div>
            <p v-if="validationErrors.bio" class="text-sm text-red-500">
              {{ validationErrors.bio }}
            </p>
          </div>
        </div>

        <!-- Step 4: Professional Details - Part 2 -->
        <div v-if="currentStep === 4" class="space-y-4">
          <div class="grid gap-1.5">
            <Label for="primary-skill">
              {{ $t('completeProfile.primarySkill') }}
              <span class="text-red-500">*</span>
            </Label>
            <Select v-model="profileData.primarySkill">
              <SelectTrigger
                id="primary-skill"
                :class="{ 'border-red-500': validationErrors.primarySkill }"
              >
                <SelectValue :placeholder="t('profile.selectMainSkill')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plumbing">
                  <div class="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-2 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                    {{ $t('completeProfile.skills.plumbing') }}
                  </div>
                </SelectItem>
                <SelectItem value="electrical">
                  <div class="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-2 text-yellow-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    {{ $t('completeProfile.skills.electrical') }}
                  </div>
                </SelectItem>
                <SelectItem value="painting">
                  <div class="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-2 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    {{ $t('completeProfile.skills.painting') }}
                  </div>
                </SelectItem>
                <SelectItem value="carpentry">
                  <div class="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-2 text-amber-700"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                      />
                    </svg>
                    {{ $t('completeProfile.skills.carpentry') }}
                  </div>
                </SelectItem>
                <SelectItem value="gardening">
                  <div class="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-2 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                    {{ $t('completeProfile.skills.gardening') }}
                  </div>
                </SelectItem>
                <SelectItem value="general">
                  <div class="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5 mr-2 text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {{ $t('completeProfile.skills.general') }}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p
              v-if="validationErrors.primarySkill"
              class="text-sm text-red-500"
            >
              {{ validationErrors.primarySkill }}
            </p>
          </div>

          <div class="grid gap-1.5">
            <Label for="years-experience">
              {{ $t('completeProfile.yearsExperience') }}
              <span class="text-red-500">*</span>
            </Label>
            <Select v-model="profileData.yearsExperience">
              <SelectTrigger
                id="years-experience"
                :class="{ 'border-red-500': validationErrors.yearsExperience }"
              >
                <SelectValue
                  :placeholder="t('profile.selectYearsExperience')"
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0-1">{{
                  $t('completeProfile.yearsOptions.0-1')
                }}</SelectItem>
                <SelectItem value="1-3">{{
                  $t('completeProfile.yearsOptions.1-3')
                }}</SelectItem>
                <SelectItem value="3-5">{{
                  $t('completeProfile.yearsOptions.3-5')
                }}</SelectItem>
                <SelectItem value="5-10">{{
                  $t('completeProfile.yearsOptions.5-10')
                }}</SelectItem>
                <SelectItem value="10+">{{
                  $t('completeProfile.yearsOptions.10+')
                }}</SelectItem>
              </SelectContent>
            </Select>
            <p
              v-if="validationErrors.yearsExperience"
              class="text-sm text-red-500"
            >
              {{ validationErrors.yearsExperience }}
            </p>
          </div>

          <!-- Multiple Specialties Selection -->
          <div class="grid gap-1.5 mt-4">
            <Label for="skills">
              {{ $t('completeProfile.skills') }}
              <span class="text-red-500">*</span>
            </Label>
            <div
              class="border rounded-md p-3"
              :class="{ 'border-red-500': validationErrors.skills }"
            >
              <p class="text-sm text-muted-foreground mb-2">
                {{ $t('completeProfile.skillsHelp') }}
              </p>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="skill in availableSkills"
                  :key="skill.value"
                  class="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    :id="'skill-' + skill.value"
                    :value="skill.value"
                    v-model="profileData.skills"
                    class="form-checkbox h-4 w-4 text-primary transition duration-150 ease-in-out"
                  />
                  <label
                    :for="'skill-' + skill.value"
                    class="text-sm flex items-center"
                  >
                    <span
                      v-if="skill.icon"
                      v-html="skill.icon"
                      class="mr-1"
                    ></span>
                    {{ skill.label }}
                  </label>
                </div>
              </div>
            </div>
            <p v-if="validationErrors.skills" class="text-sm text-red-500">
              {{ validationErrors.skills }}
            </p>

            <!-- Selected skills preview -->
            <div v-if="profileData.skills.length > 0" class="mt-2">
              <div class="flex flex-wrap gap-1">
                <div
                  v-for="skill in profileData.skills"
                  :key="skill"
                  class="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full flex items-center"
                >
                  {{ getSkillName(skill) }}
                  <button
                    type="button"
                    @click="removeSkill(skill)"
                    class="ml-1 text-primary hover:text-primary/80"
                    aria-label="Remove specialty"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-3 w-3"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 5: Service Areas -->
        <div v-if="currentStep === 5" class="space-y-4">
          <div class="grid gap-1.5">
            <Label for="service-areas">
              {{ $t('completeProfile.serviceAreas') }}
              <span class="text-red-500">*</span>
            </Label>
            <div
              class="border rounded-md p-3"
              :class="{ 'border-red-500': validationErrors.serviceAreas }"
            >
              <p class="text-sm text-muted-foreground mb-2">
                {{ $t('completeProfile.serviceAreasHelp') }}
              </p>
              <div class="grid grid-cols-2 gap-2">
                <div
                  v-for="district in availableDistricts"
                  :key="district.id"
                  class="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    :id="'district-' + district.id"
                    :value="district.id"
                    v-model="profileData.serviceAreas"
                    class="form-checkbox h-4 w-4 text-primary transition duration-150 ease-in-out"
                  />
                  <label :for="'district-' + district.id" class="text-sm">{{
                    district.name
                  }}</label>
                </div>
              </div>
            </div>
            <p
              v-if="validationErrors.serviceAreas"
              class="text-sm text-red-500"
            >
              {{ validationErrors.serviceAreas }}
            </p>
          </div>

          <!-- Simple map visualization -->
          <div class="border rounded-md p-3 bg-muted">
            <p class="text-sm font-medium mb-2">
              {{ $t('completeProfile.selectedAreas') }}
            </p>
            <div class="h-32 bg-muted rounded-md relative overflow-hidden">
              <!-- This is a placeholder for a map visualization -->
              <!-- In a real implementation, this would be an actual map -->
              <div
                class="absolute inset-0 flex items-center justify-center text-muted-foreground"
              >
                <span v-if="profileData.serviceAreas.length === 0">{{
                  $t('completeProfile.noAreasSelected')
                }}</span>
                <div v-else class="w-full h-full p-2">
                  <div
                    v-for="area in profileData.serviceAreas"
                    :key="area"
                    class="inline-block m-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                  >
                    {{ getDistrictName(area) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 6: Previous Work Photos -->
        <div v-if="currentStep === 6" class="space-y-4">
          <div class="grid gap-1.5">
            <Label for="work-photos">{{
              $t('completeProfile.workPhotos')
            }}</Label>
            <div
              class="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/80 transition-colors"
              :class="{
                'border-primary': isDragging,
                'border-border': !isDragging,
                'opacity-50': isUploadingWorkPhotos,
              }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleWorkPhotosDrop"
              @click="$refs.workPhotosInput.click()"
              :aria-disabled="isUploadingWorkPhotos"
            >
              <input
                ref="workPhotosInput"
                type="file"
                class="hidden"
                accept="image/*"
                multiple
                @change="handleWorkPhotosChange"
                :disabled="isUploadingWorkPhotos"
              />

              <div v-if="workPhotosPreviews.length === 0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-10 w-10 mx-auto text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p class="mt-2 text-sm text-muted-foreground">
                  {{ $t('completeProfile.dragDropImages') }}
                </p>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ $t('completeProfile.imageFormats') }}
                </p>
              </div>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ $t('completeProfile.uploadPhotosHelp') }}
            </p>
          </div>

          <!-- Photo previews grid -->
          <div v-if="workPhotosPreviews.length > 0" class="mt-4">
            <h4 class="text-sm font-medium mb-2">
              {{ $t('completeProfile.selectedPhotos') }} ({{
                workPhotosPreviews.length
              }})
            </h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                v-for="(preview, index) in workPhotosPreviews"
                :key="index"
                class="relative aspect-square rounded-md overflow-hidden border"
              >
                <img
                  :src="preview"
                  alt="Work photo preview"
                  class="w-full h-full object-cover"
                />
                <button
                  @click="removeWorkPhoto(index)"
                  class="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                  :title="$t('completeProfile.removePhoto')"
                  :disabled="isUploadingWorkPhotos"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Upload status message -->
          <div v-if="workPhotoUploadStatus" class="mt-2">
            <p
              :class="[
                'text-sm px-3 py-2 rounded-md',
                workPhotoUploadStatus.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-amber-50 text-amber-700',
              ]"
            >
              {{ workPhotoUploadStatus.message }}
            </p>
          </div>
        </div>

        <!-- Step 7: Contact & Photo -->
        <div v-if="currentStep === 7" class="space-y-4">
          <div class="grid gap-1.5">
            <Label for="contact-phone">
              {{ $t('completeProfile.contactPhone') }}
              <span class="text-red-500">*</span>
            </Label>
            <Input
              id="contact-phone"
              type="tel"
              v-model="profileData.contactPhone"
              :placeholder="t('profile.phonePlaceholder')"
              :class="{ 'border-red-500': validationErrors.contactPhone }"
            />
            <p class="text-xs text-muted-foreground">
              {{ $t('completeProfile.phoneVisibility') }}
            </p>
            <p
              v-if="validationErrors.contactPhone"
              class="text-sm text-red-500"
            >
              {{ validationErrors.contactPhone }}
            </p>
          </div>

          <div class="grid gap-1.5">
            <Label for="profile-picture">{{
              $t('completeProfile.profilePicture')
            }}</Label>
            <div
              class="border-2 border-dashed rounded-md p-4 text-center cursor-pointer hover:bg-muted/80 transition-colors"
              :class="{
                'border-primary': isDragging,
                'border-border': !isDragging,
              }"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="handleFileDrop"
              @click="$refs.fileInput.click()"
            >
              <input
                ref="fileInput"
                type="file"
                class="hidden"
                accept="image/*"
                @change="handleFileChange"
              />

              <div
                v-if="!profileData.profilePictureFile && !profilePicturePreview"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-10 w-10 mx-auto text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p class="mt-2 text-sm text-muted-foreground">
                  {{ $t('completeProfile.dragDropImage') }}
                </p>
                <p class="text-xs text-muted-foreground mt-1">
                  {{ $t('completeProfile.imageFormat') }}
                </p>
              </div>

              <div v-else class="relative">
                <img
                  :src="profilePicturePreview"
                  alt="Profile picture preview"
                  class="mx-auto max-h-48 rounded-md"
                />
                <button
                  @click.stop="removeProfilePicture"
                  class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <p class="text-sm text-muted-foreground">
              {{ $t('completeProfile.profilePictureHelp') }}
            </p>
          </div>
        </div>

        <!-- Step 8: Completion Screen -->
        <div v-if="currentStep === 8" class="space-y-6">
          <div class="flex justify-center mb-4">
            <div
              class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-12 w-12 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <div
            class="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center"
          >
            <div class="mr-3 text-amber-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p class="font-medium text-amber-800">
                {{ $t('completeProfile.credits.creditsAdded') }}
              </p>
              <p class="text-sm text-amber-700">
                {{ $t('completeProfile.credits.higherResults') }}
              </p>
            </div>
          </div>

          <!-- Profile Preview Card -->
          <div class="border rounded-lg overflow-hidden">
            <div class="bg-muted p-4 border-b">
              <h4 class="font-medium">
                {{ $t('completeProfile.profilePreview') }}
              </h4>
            </div>
            <div class="p-4">
              <div class="flex items-center space-x-4 mb-4">
                <div class="w-16 h-16 rounded-full bg-muted overflow-hidden">
                  <img
                    v-if="profilePicturePreview"
                    :src="profilePicturePreview"
                    alt="Profile"
                    class="w-full h-full object-cover"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center text-muted-foreground"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 class="font-bold text-lg">{{ profileData.fullName }}</h3>
                  <p class="text-sm text-muted-foreground">
                    {{ getSkillName(profileData.primarySkill) }} •
                    {{ profileData.yearsExperience }}
                    {{ $t('completeProfile.experience') }}
                  </p>
                </div>
              </div>
              <p class="text-sm text-foreground mb-3 line-clamp-3">
                {{ profileData.bio }}
              </p>
              <div class="flex flex-wrap gap-1 mb-3">
                <span
                  v-for="area in profileData.serviceAreas.slice(0, 3)"
                  :key="area"
                  class="inline-block px-2 py-1 bg-muted text-foreground text-xs rounded-full"
                >
                  {{ getDistrictName(area) }}
                </span>
                <span
                  v-if="profileData.serviceAreas.length > 3"
                  class="inline-block px-2 py-1 bg-muted text-foreground text-xs rounded-full"
                >
                  +{{ profileData.serviceAreas.length - 3 }}
                  {{ $t('completeProfile.more') }}
                </span>
              </div>
              <div class="text-sm text-muted-foreground">
                <p>
                  {{ $t('completeProfile.contact') }}:
                  {{ formatPhoneNumber(profileData.contactPhone) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter class="flex justify-between">
        <Button
          variant="outline"
          @click="prevStep"
          :disabled="currentStep === 1"
          >{{ $t('completeProfile.previous') }}</Button
        >
        <Button
          v-if="currentStep < totalSteps"
          @click="nextStep"
          :disabled="!isStepValid"
        >
          {{
            currentStep === 1
              ? $t('completeProfile.getStarted')
              : $t('completeProfile.next')
          }}
        </Button>
        <Button
          v-if="currentStep === totalSteps"
          @click="submitProfile"
          :disabled="isSaving"
        >
          <span v-if="isSaving">
            <svg
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{
              isUploadingWorkPhotos
                ? $t('completeProfile.uploadingPhotos')
                : $t('completeProfile.saving')
            }}
          </span>
          <span v-else>{{ $t('completeProfile.goToDashboard') }}</span>
        </Button>
      </CardFooter>
    </Card>
    <!-- Display submission error message -->
    <p v-if="submitErrorMsg" class="mt-4 text-sm text-center text-red-600">
      {{ submitErrorMsg }}
    </p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

// Work photo upload function
const uploadWorkPhoto = async (supabase, file, userId) => {
  try {
    // Create a unique file path with user ID and timestamp
    const fileExt = file.name.split('.').pop();
    const filePath = `work-photos/${userId}/${Date.now()}.${fileExt}`;

    // Upload the file to the 'work-photos' bucket
    const { error: uploadError } = await supabase.storage
      .from('work-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading work photo:', uploadError);
      return null;
    }

    // Get the public URL of the uploaded file
    const { data: urlData } = supabase.storage
      .from('work-photos')
      .getPublicUrl(filePath);

    if (urlData?.publicUrl) {
      return { url: urlData.publicUrl };
    }

    return null;
  } catch (error) {
    console.error('Work photo upload failed:', error);
    return null;
  }
};

const updateUserProfileWithWorkPhotos = async (
  supabase,
  userId,
  workPhotoUrls
) => {
  try {
    const { error } = await supabase
      .from('contractor_profiles')
      .update({ work_photo_urls: workPhotoUrls })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating profile with work photos:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to update profile with work photos:', error);
    return false;
  }
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const router = useRouter();
const route = useRoute();
const { user, userRole, getSupabaseClient, updateUserMetadata } = useAuth(); // Supabase auth

// Get the Supabase client instance
const supabase = getSupabaseClient();

const currentStep = ref(1);
const totalSteps = ref(8); // 8 steps including the new work photos step
const highestStepReached = ref(1);
const isSaving = ref(false);
const isUploadingWorkPhotos = ref(false);
const submitErrorMsg = ref('');
const isDragging = ref(false);
const profilePicturePreview = ref(null);
const workPhotoUploadStatus = ref(null);

// Validation errors
const validationErrors = ref({
  fullName: '',
  bio: '',
  primarySkill: '',
  skills: '', // Add validation for skills
  yearsExperience: '',
  serviceAreas: '',
  contactPhone: '',
});

const profileData = ref({
  fullName: '',
  bio: '',
  primarySkill: '',
  skills: [], // New field for multiple skills
  yearsExperience: '',
  serviceAreas: [],
  workPhotos: [], // Array to store work photo files
  contactPhone: '',
  profilePictureFile: null,
});

// For work photos preview
const workPhotosPreviews = ref([]);

// Available districts for service areas
const availableDistricts = ref([
  { id: 'miraflores', name: 'Miraflores' },
  { id: 'san_isidro', name: 'San Isidro' },
  { id: 'surco', name: 'Surco' },
  { id: 'san_borja', name: 'San Borja' },
  { id: 'barranco', name: 'Barranco' },
  { id: 'la_molina', name: 'La Molina' },
  { id: 'magdalena', name: 'Magdalena' },
  { id: 'jesus_maria', name: 'Jesús María' },
]);

// Available skills for selection
const availableSkills = ref([
  {
    value: 'plumbing',
    label: 'Plumbing',
    icon: '<svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>',
  },
  {
    value: 'electrical',
    label: 'Electrical',
    icon: '<svg class="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
  },
  {
    value: 'painting',
    label: 'Painting',
    icon: '<svg class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>',
  },
  {
    value: 'carpentry',
    label: 'Carpentry',
    icon: '<svg class="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>',
  },
  {
    value: 'gardening',
    label: 'Gardening',
    icon: '<svg class="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>',
  },
  {
    value: 'general',
    label: 'General Contractor',
    icon: '<svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>',
  },
  {
    value: 'hvac',
    label: 'HVAC',
    icon: '<svg class="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>',
  },
  {
    value: 'roofing',
    label: 'Roofing',
    icon: '<svg class="h-4 w-4 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>',
  },
  {
    value: 'flooring',
    label: 'Flooring',
    icon: '<svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"/></svg>',
  },
  {
    value: 'tiling',
    label: 'Tiling',
    icon: '<svg class="h-4 w-4 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5z"/></svg>',
  },
  {
    value: 'landscaping',
    label: 'Landscaping',
    icon: '<svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg>',
  },
]);

// Fetch existing profile data on mount
onMounted(async () => {
  if (user.value) {
    // Pre-fill name from Supabase user
    profileData.value.fullName =
      user.value.fullName ||
      `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim();

    try {
      // Fetch existing profile data from Supabase
      const { data, error } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('user_id', user.value.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile data:', error);
      }

      // If profile data exists, pre-fill the form
      if (data) {
        console.log('Found existing profile data:', data);

        // Map Supabase data to form fields
        profileData.value.fullName =
          data.full_name || profileData.value.fullName;
        profileData.value.bio = data.bio || '';
        profileData.value.yearsExperience = data.years_experience || '';
        profileData.value.serviceAreas = data.service_areas || [];
        profileData.value.contactPhone = data.contact_phone || '';

        // If profile picture exists, set the preview
        if (data.profile_picture_url) {
          profilePicturePreview.value = data.profile_picture_url;
        }

        // Determine the highest step reached based on filled data
        if (profileData.value.contactPhone) {
          highestStepReached.value = 7; // All steps completed
        } else if (profileData.value.serviceAreas.length > 0) {
          highestStepReached.value = 6;
        } else if (
          profileData.value.primarySkill &&
          profileData.value.yearsExperience
        ) {
          highestStepReached.value = 5;
        } else if (profileData.value.bio) {
          highestStepReached.value = 4;
        } else if (profileData.value.fullName) {
          highestStepReached.value = 3;
        } else {
          highestStepReached.value = 1;
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile data:', err);
    }
  }
});

// Step names for breadcrumb navigation
const getStepName = (step) => {
  switch (step) {
    case 1:
      return t('completeProfile.steps.welcome');
    case 2:
      return t('completeProfile.steps.personal');
    case 3:
      return t('completeProfile.steps.bio');
    case 4:
      return t('completeProfile.steps.skills');
    case 5:
      return t('completeProfile.steps.areas');
    case 6:
      return t('completeProfile.steps.photos');
    case 7:
      return t('completeProfile.steps.contact');
    case 8:
      return t('completeProfile.steps.complete');
    default:
      return '';
  }
};

const currentStepTitle = computed(() => {
  switch (currentStep.value) {
    case 1:
      return t('completeProfile.titles.buildProfile');
    case 2:
      return t('completeProfile.titles.personalInfo');
    case 3:
      return t('completeProfile.titles.professionalDetails');
    case 4:
      return t('completeProfile.titles.skillsExperience');
    case 5:
      return t('completeProfile.titles.serviceAreas');
    case 6:
      return t('completeProfile.titles.workPhotos');
    case 7:
      return t('completeProfile.titles.contactPhoto');
    case 8:
      return t('completeProfile.titles.profileComplete');
    default:
      return t('profile.title');
  }
});

const currentStepDescription = computed(() => {
  switch (currentStep.value) {
    case 1:
      return t('completeProfile.descriptions.completeProfile');
    case 2:
      return t('completeProfile.descriptions.greatStart');
    case 3:
      return t('completeProfile.descriptions.tellClients');
    case 4:
      return t('completeProfile.descriptions.takingShape');
    case 5:
      return t('completeProfile.descriptions.selectAreas');
    case 6:
      return t('completeProfile.descriptions.showcaseWork');
    case 7:
      return t('completeProfile.descriptions.almostDone');
    case 8:
      return '';
    default:
      return '';
  }
});

// Validation per step
const isStepValid = computed(() => {
  // Clear all validation errors first
  Object.keys(validationErrors.value).forEach((key) => {
    validationErrors.value[key] = '';
  });

  switch (currentStep.value) {
    case 1: // Welcome screen - always valid
      return true;

    case 2: // Personal Information
      if (!profileData.value.fullName.trim()) {
        validationErrors.value.fullName = t(
          'completeProfile.validation.fullNameRequired'
        );
        return false;
      }
      return true;

    case 3: // Professional Details - Part 1 (Bio)
      if (!profileData.value.bio.trim()) {
        validationErrors.value.bio = t(
          'completeProfile.validation.bioRequired'
        );
        return false;
      }
      if (profileData.value.bio.trim().length < 50) {
        validationErrors.value.bio = t(
          'completeProfile.validation.bioMinLength'
        );
        return false;
      }
      return true;

    case 4: // Professional Details - Part 2 (Skills & Experience)
      let valid = true;
      if (!profileData.value.primarySkill) {
        validationErrors.value.primarySkill = t(
          'completeProfile.validation.primarySkillRequired'
        );
        valid = false;
      }
      if (!profileData.value.yearsExperience) {
        validationErrors.value.yearsExperience = t(
          'completeProfile.validation.yearsExperienceRequired'
        );
        valid = false;
      }
      if (!profileData.value.skills || profileData.value.skills.length === 0) {
        validationErrors.value.skills = t(
          'completeProfile.validation.skillsRequired'
        );
        valid = false;
      }
      return valid;

    case 5: // Service Areas
      if (profileData.value.serviceAreas.length === 0) {
        validationErrors.value.serviceAreas =
          'Please select at least one service area';
        return false;
      }
      return true;

    case 6: // Work Photos - optional, always valid
      return true;

    case 7: // Contact & Photo
      if (!profileData.value.contactPhone.trim()) {
        validationErrors.value.contactPhone = 'Contact phone is required';
        return false;
      }
      // Basic phone validation (can be enhanced)
      if (!/^\d{9,}$/.test(profileData.value.contactPhone.replace(/\D/g, ''))) {
        validationErrors.value.contactPhone =
          'Please enter a valid phone number';
        return false;
      }
      return true;

    case 8: // Completion screen - always valid
      return true;

    default:
      return false;
  }
});

// Navigation functions
const nextStep = () => {
  if (isStepValid.value && currentStep.value < totalSteps.value) {
    currentStep.value++;
    // Update highest step reached for breadcrumb navigation
    if (currentStep.value > highestStepReached.value) {
      highestStepReached.value = currentStep.value;
    }
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const goToStep = (step) => {
  // Only allow navigation to steps that have been reached or previous steps
  if (step <= highestStepReached.value) {
    currentStep.value = step;
  }
};

// File handling functions
const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    profileData.value.profilePictureFile = file;

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      profilePicturePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const handleFileDrop = (event) => {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Maximum size is 5MB.');
      return;
    }

    profileData.value.profilePictureFile = file;

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      profilePicturePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeProfilePicture = (event) => {
  if (event) {
    event.stopPropagation(); // Prevent triggering the file input click
  }

  profileData.value.profilePictureFile = null;
  profilePicturePreview.value = null;

  // In Vue 3 composition API, we access refs directly
  const fileInputEl = document.querySelector(
    'input[type="file"]:not([multiple])'
  );
  if (fileInputEl) {
    fileInputEl.value = '';
  }
};

// Work photos handling functions
const handleWorkPhotosChange = (event) => {
  if (isUploadingWorkPhotos.value) return;

  const files = Array.from(event.target.files);
  if (files.length > 0) {
    // Limit to 5 photos total
    const totalPhotos = profileData.value.workPhotos.length + files.length;
    if (totalPhotos > 5) {
      workPhotoUploadStatus.value = {
        type: 'error',
        message:
          'You can upload a maximum of 5 photos. Please remove some photos first.',
      };
      return;
    }

    // Clear previous status
    workPhotoUploadStatus.value = null;

    // Process each file
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        invalidFiles.push(file.name);
        return;
      }

      validFiles.push(file);

      // Add to work photos array
      profileData.value.workPhotos.push(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        workPhotosPreviews.value.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });

    // Show feedback about the upload
    if (validFiles.length > 0) {
      workPhotoUploadStatus.value = {
        type: 'success',
        message: `${validFiles.length} photo${validFiles.length > 1 ? 's' : ''} selected successfully.`,
      };
    }

    if (invalidFiles.length > 0) {
      workPhotoUploadStatus.value = {
        type: 'error',
        message: `${invalidFiles.length} file${invalidFiles.length > 1 ? 's' : ''} exceeded the 2MB size limit and ${invalidFiles.length > 1 ? 'were' : 'was'} not added.`,
      };
    }
  }

  // Reset the file input to allow selecting the same files again if needed
  event.target.value = '';
};

const handleWorkPhotosDrop = (event) => {
  if (isUploadingWorkPhotos.value) return;

  isDragging.value = false;
  const files = Array.from(event.dataTransfer.files).filter((file) =>
    file.type.startsWith('image/')
  );

  if (files.length > 0) {
    // Limit to 5 photos total
    const totalPhotos = profileData.value.workPhotos.length + files.length;
    if (totalPhotos > 5) {
      workPhotoUploadStatus.value = {
        type: 'error',
        message:
          'You can upload a maximum of 5 photos. Please remove some photos first.',
      };
      return;
    }

    // Clear previous status
    workPhotoUploadStatus.value = null;

    // Process each file
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        invalidFiles.push(file.name);
        return;
      }

      validFiles.push(file);

      // Add to work photos array
      profileData.value.workPhotos.push(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        workPhotosPreviews.value.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });

    // Show feedback about the upload
    if (validFiles.length > 0) {
      workPhotoUploadStatus.value = {
        type: 'success',
        message: `${validFiles.length} photo${validFiles.length > 1 ? 's' : ''} dropped successfully.`,
      };
    }

    if (invalidFiles.length > 0) {
      workPhotoUploadStatus.value = {
        type: 'error',
        message: `${invalidFiles.length} file${invalidFiles.length > 1 ? 's' : ''} exceeded the 2MB size limit and ${invalidFiles.length > 1 ? 'were' : 'was'} not added.`,
      };
    }
  }
};

const removeWorkPhoto = (index) => {
  if (isUploadingWorkPhotos.value) return;

  // Remove from both arrays
  profileData.value.workPhotos.splice(index, 1);
  workPhotosPreviews.value.splice(index, 1);

  // Update status message
  workPhotoUploadStatus.value = {
    type: 'success',
    message: 'Photo removed successfully.',
  };

  // Clear status message after a short delay
  setTimeout(() => {
    if (
      workPhotoUploadStatus.value?.message === 'Photo removed successfully.'
    ) {
      workPhotoUploadStatus.value = null;
    }
  }, 3000);

  // Note: The actual deletion from Supabase Storage would happen here in a full implementation
  // For now, we're just removing it from the local arrays, and the photos will be uploaded
  // when the user submits the profile
};

// Helper functions
const getDistrictName = (id) => {
  const district = availableDistricts.value.find((d) => d.id === id);
  return district ? district.name : id;
};

const getSkillName = (skill) => {
  const skillMap = {
    plumbing: t('completeProfile.skills.plumbing'),
    electrical: t('completeProfile.skills.electrical'),
    painting: t('completeProfile.skills.painting'),
    carpentry: t('completeProfile.skills.carpentry'),
    gardening: t('completeProfile.skills.gardening'),
    general: t('completeProfile.skills.generalContractor'),
    hvac: t('completeProfile.skills.hvac'),
    roofing: t('completeProfile.skills.roofing'),
    flooring: t('completeProfile.skills.flooring'),
    tiling: t('completeProfile.skills.tiling'),
    landscaping: t('completeProfile.skills.landscaping'),
  };
  return skillMap[skill] || skill;
};

// Remove a specialty from the list
const removeSkill = (skill) => {
  const index = profileData.value.skills.indexOf(skill);
  if (index !== -1) {
    profileData.value.skills.splice(index, 1);
  }
};

const formatPhoneNumber = (phone) => {
  // Basic formatting, can be enhanced
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  return phone;
};

const submitProfile = async () => {
  // Use the Supabase user ID directly
  if (!user.value) {
    console.error('Supabase user not available. Cannot save profile.');
    submitErrorMsg.value =
      'Error: User session not found. Please try logging in again.';
    return;
  }
  const supabaseUserId = user.value.id; // Use the Supabase user ID (string)

  // Now check form validation
  if (!isStepValid.value) {
    submitErrorMsg.value = 'Please complete all required fields correctly.';
    return;
  }
  // Removed extra brace here

  isSaving.value = true;
  submitErrorMsg.value = '';

  try {
    // Use the Supabase User ID (string)
    const userId = supabaseUserId; // Assign to a const for clarity
    let profilePictureUrl = null; // Placeholder for uploaded image URL

    // Upload profile picture if provided
    if (profileData.value.profilePictureFile) {
      console.log('Uploading profile picture...');
      try {
        // Create a unique file path with user ID and timestamp
        const fileExt = profileData.value.profilePictureFile.name
          .split('.')
          .pop();
        const filePath = `${userId}/${Date.now()}.${fileExt}`;

        // Upload the file to the 'profile-images' bucket
        const { error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(filePath, profileData.value.profilePictureFile, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) {
          console.error('Error uploading profile picture:', uploadError);
          throw new Error(
            `Failed to upload profile picture: ${uploadError.message}`
          );
        }

        // Get the public URL of the uploaded file
        const { data: urlData } = supabase.storage
          .from('profile-images')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          profilePictureUrl = urlData.publicUrl;
          console.log(
            'Profile picture uploaded successfully:',
            profilePictureUrl
          );
        }
      } catch (uploadError) {
        console.error('Profile picture upload failed:', uploadError);
        // Continue with profile save even if image upload fails
        // This ensures users can complete their profile even if image upload has issues
      }
    }

    // Upload work photos if provided
    let workPhotoUrls = [];

    // Process work photos if provided
    if (profileData.value.workPhotos.length > 0) {
      console.log(
        `Uploading ${profileData.value.workPhotos.length} work photos...`
      );

      // Set uploading state
      isUploadingWorkPhotos.value = true;

      try {
        // Upload each work photo
        const uploadPromises = profileData.value.workPhotos.map((file) =>
          uploadWorkPhoto(supabase, file, userId)
        );

        // Wait for all uploads to complete
        const uploadResults = await Promise.all(uploadPromises);

        // Filter out any failed uploads and extract URLs
        workPhotoUrls = uploadResults
          .filter((result) => result !== null)
          .map((result) => result.url);

        console.log(
          `Successfully uploaded ${workPhotoUrls.length} work photos`
        );

        // Show feedback if some uploads failed
        if (workPhotoUrls.length < profileData.value.workPhotos.length) {
          console.warn(
            `${profileData.value.workPhotos.length - workPhotoUrls.length} photos failed to upload`
          );
        }

        // Update user profile with work photo URLs
        if (workPhotoUrls.length > 0) {
          const updateSuccess = await updateUserProfileWithWorkPhotos(
            supabase,
            userId,
            workPhotoUrls
          );

          if (!updateSuccess) {
            console.warn('Failed to update profile with work photo URLs');
          } else {
            console.log('Profile updated with work photo URLs');
          }
        }
      } catch (error) {
        console.error('Error during work photos upload:', error);
      } finally {
        // Reset uploading state
        isUploadingWorkPhotos.value = false;
      }
    }

    const dataToSave = {
      id: userId, // Set id to match auth.uid() for RLS policy
      user_id: userId, // Use the Supabase ID (string)
      full_name: profileData.value.fullName.trim(),
      bio: profileData.value.bio.trim(),
      skills: profileData.value.skills, // Use only the skills array
      years_experience: profileData.value.yearsExperience,
      service_areas: profileData.value.serviceAreas,
      contact_phone: profileData.value.contactPhone.trim(),
      profile_picture_url: profilePictureUrl, // Add the URL if upload was successful
      work_photo_urls: workPhotoUrls.length > 0 ? workPhotoUrls : null, // Add work photo URLs
      role: 'contractor', // Explicitly set role as contractor
      updated_at: new Date().toISOString(),
    };

    console.log(
      'Submitting full profile data for Supabase user:',
      userId,
      dataToSave
    );

    // Only save to contractor_profiles if user is actually a contractor
    if (userRole.value !== 'contractor') {
      console.warn(
        'User is not a contractor, skipping contractor profile creation'
      );
      // For non-contractors, we might want to save to a different table or skip entirely
      // For now, we'll just skip and redirect
      router.push('/');
      return;
    }

    // Upsert data into Supabase 'contractor_profiles' table using dynamic client
    const { data: savedProfile, error: supabaseError } = await supabase
      .from('contractor_profiles')
      .upsert(dataToSave, {
        onConflict: 'id',
        returning: 'minimal', // Only return minimal data to reduce payload size
      });

    if (supabaseError) {
      // Handle specific Supabase errors with user-friendly messages
      let errorMessage = 'Failed to save profile data.';

      if (supabaseError.code === '23505') {
        errorMessage = 'A profile with this information already exists.';
      } else if (supabaseError.code === '23503') {
        errorMessage = 'Referenced record does not exist.';
      } else if (supabaseError.code === '42P01') {
        errorMessage = 'Database table not found. Please contact support.';
      } else if (supabaseError.code === '42703') {
        errorMessage = 'Database column not found. Please contact support.';
      } else if (supabaseError.message) {
        errorMessage = `Database error: ${supabaseError.message}`;
      }

      console.error('Supabase error details:', supabaseError);
      throw new Error(errorMessage);
    }

    console.log(
      'Supabase upsert operation completed successfully for user:',
      userId
    );

    // Verify the profile was saved by fetching it
    const { data: verifiedProfile, error: verifyError } = await supabase
      .from('contractor_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      console.warn('Could not verify profile was saved:', verifyError);
      // Continue with the process even if verification fails
    } else {
      console.log('Profile verified in database:', verifiedProfile);
    }

    // Update Supabase user metadata
    if (user.value) {
      console.log('Attempting to update Supabase user metadata...');
      const updatedMetadata = {
        fullProfileComplete: true,
        credits: 10, // Add 10 credits for completing profile
      };
      await updateUserMetadata(updatedMetadata);
      console.log('Supabase user metadata updated successfully.');
    } else {
      console.warn('Supabase user object not available to update metadata.');
    }

    console.log('Profile saved and Supabase metadata updated.');

    // Redirect back to the job page if redirectJobId is present, otherwise to dashboard
    const redirectJobId = route.query.redirectJobId;
    if (redirectJobId) {
      router.push({ name: 'JobDetails', params: { jobId: redirectJobId } });
    } else {
      router.push('/home'); // Default redirect
    }
  } catch (error) {
    console.error('Error submitting profile:', error);
    submitErrorMsg.value = `Failed to save profile: ${error.message}`;
  } finally {
    isSaving.value = false;
  }
};
</script>
