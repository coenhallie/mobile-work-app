<template>
  <!-- Break out of parent container padding to achieve true full width -->
  <div
    class="relative min-h-screen w-screen bg-white dark:bg-gray-900 -m-4 md:-m-4"
  >
    <!-- Cancel Job Dialog -->
    <Dialog
      :open="isCancelDialogOpen"
      @update:open="isCancelDialogOpen = $event"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t('dialogs.confirmCancel.title') }}</DialogTitle>
          <DialogDescription>
            {{ $t('dialogs.confirmCancel.description') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isCancelDialogOpen = false">
            {{ $t('buttons.cancel') }}
          </Button>
          <Button variant="destructive" @click="handleConfirmCancel">
            {{ $t('buttons.continue') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Remove Job Dialog -->
    <Dialog
      :open="isRemoveDialogOpen"
      @update:open="isRemoveDialogOpen = $event"
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ $t('dialogs.confirmRemove.title') }}</DialogTitle>
          <DialogDescription>
            {{ $t('dialogs.confirmRemove.description') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="isRemoveDialogOpen = false">
            {{ $t('buttons.cancel') }}
          </Button>
          <Button variant="destructive" @click="handleConfirmRemove">
            {{ $t('buttons.remove') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Skeleton loader while content is loading -->
    <div
      v-if="jobStore.isLoading"
      class="animate-pulse pb-32 md:pb-20 relative"
    >
      <!-- Hero image skeleton -->
      <div class="w-full h-[45vh] bg-muted"></div>

      <!-- Main content container - matches actual layout -->
      <div class="w-full bg-background rounded-t-3xl -mt-6 relative z-10">
        <!-- Header section skeleton -->
        <div class="px-6 pt-8 pb-4">
          <div class="max-w-6xl mx-auto">
            <div class="flex justify-between items-start mb-6">
              <div class="flex-1">
                <!-- Title skeleton -->
                <div class="h-7 bg-muted rounded-lg w-80 mb-2"></div>

                <!-- Location skeleton -->
                <div class="flex items-center mb-4">
                  <div class="w-4 h-4 bg-muted rounded mr-2"></div>
                  <div class="h-4 bg-muted rounded w-32"></div>
                </div>

                <!-- Status badge and applicant counter skeleton -->
                <div class="flex items-center space-x-3">
                  <div class="h-7 bg-muted rounded-full w-16"></div>
                  <div class="h-6 bg-muted rounded-full w-20"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main content skeleton -->
        <div class="px-6 pb-6">
          <div class="max-w-6xl mx-auto">
            <div class="space-y-8">
              <!-- Description section skeleton -->
              <div class="border-b border-border pb-6">
                <div class="flex items-center mb-3">
                  <div class="w-4 h-4 bg-muted rounded mr-2"></div>
                  <div class="h-5 bg-muted rounded w-24"></div>
                </div>
                <div class="space-y-2">
                  <div class="h-4 bg-muted rounded w-full"></div>
                  <div class="h-4 bg-muted rounded w-full"></div>
                  <div class="h-4 bg-muted rounded w-3/4"></div>
                </div>
              </div>

              <!-- Job highlights skeleton -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Preferred timing skeleton -->
                <div class="flex items-start space-x-3">
                  <div class="bg-muted p-2 rounded-lg w-9 h-9"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-muted rounded w-28 mb-1"></div>
                    <div class="h-4 bg-muted rounded w-36"></div>
                  </div>
                </div>

                <!-- Service category skeleton -->
                <div class="flex items-start space-x-3">
                  <div class="bg-muted p-2 rounded-lg w-9 h-9"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-muted rounded w-32 mb-1"></div>
                    <div class="h-4 bg-muted rounded w-24"></div>
                  </div>
                </div>

                <!-- Budget skeleton -->
                <div class="flex items-start space-x-3">
                  <div class="bg-muted p-2 rounded-lg w-9 h-9"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-muted rounded w-16 mb-1"></div>
                    <div class="h-6 bg-muted rounded w-20"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="jobStore.error" class="w-full py-16 text-center">
      <div class="max-w-6xl mx-auto px-4">
        <div
          class="bg-destructive/10 border border-destructive/20 rounded-2xl p-8"
        >
          <div class="text-destructive text-lg font-medium">
            {{ $t('jobs.errorLoadingJob') }}: {{ jobStore.error }}
          </div>
        </div>
      </div>
    </div>

    <!-- Job details with Airbnb-inspired design -->
    <div v-else-if="jobStore.currentJob" class="pb-32 md:pb-20 relative">
      <!-- Hero image section - full width, no padding -->
      <div class="relative w-full overflow-hidden">
        <!-- Job Image Carousel with ShadCN -->
        <div class="relative w-full h-[45vh] overflow-hidden">
          <JobImageCarousel
            :images="jobStore.currentJob.photos || []"
            :alt-text="`${jobStore.currentJob.category_name} job details`"
            height="h-full"
            :show-navigation="false"
            :show-indicators="(jobStore.currentJob.photos || []).length > 1"
            @image-error="handleImageError"
            @slide-change="handleSlideChange"
          />

          <!-- Photo counter with modern styling (only show if multiple images) -->
          <div
            v-if="
              jobStore.currentJob.photos &&
              jobStore.currentJob.photos.length > 1
            "
            class="absolute bottom-8 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium"
          >
            {{ currentPhotoIndex + 1 }} /
            {{ jobStore.currentJob.photos.length }}
          </div>
        </div>
      </div>

      <!-- Main content container - full width with rounded top -->
      <div
        class="w-full bg-white dark:bg-gray-900 rounded-t-3xl -mt-6 relative z-10"
      >
        <!-- Header section -->
        <div class="px-6 pt-8 pb-4">
          <div class="max-w-6xl mx-auto">
            <div class="flex justify-between items-start mb-6">
              <div class="flex-1">
                <h1
                  class="text-2xl font-normal text-gray-900 dark:text-white mb-2 leading-tight"
                >
                  {{ jobStore.currentJob.category_name }}
                  {{ $t('jobs.serviceRequest') }}
                </h1>

                <!-- Location with icon -->
                <div
                  class="flex items-center text-gray-600 dark:text-gray-300 mb-4"
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    ></path>
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    ></path>
                  </svg>
                  <span class="text-sm">{{
                    jobStore.currentJob.location_text ||
                    $t('jobs.locationNotSpecified')
                  }}</span>
                </div>

                <!-- Status badge and applicant counter - left-aligned -->
                <div class="flex items-center space-x-3">
                  <span
                    :class="statusBadgeClass(jobStore.currentJob.status)"
                    class="px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center"
                  >
                    <div
                      class="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"
                    ></div>
                    {{ $t(`jobStatus.${jobStore.currentJob.status}`) }}
                  </span>

                  <!-- Payment Status Indicator -->
                  <PaymentStatusIndicator
                    v-if="
                      jobStore.currentJob.status === 'completed' ||
                      jobStore.currentJob.status === 'finalized'
                    "
                    :status="paymentStatus"
                    size="sm"
                  />

                  <!-- Show ApplicantCounter only for open jobs -->
                  <ApplicantCounter
                    v-if="jobStore.currentJob.status === JOB_STATUS.OPEN"
                    :count="jobStore.currentJob.applicant_count || 0"
                    :has-unread="
                      jobStore.currentJob.has_unread_applications && isJobOwner
                    "
                    :clickable="isJobOwner"
                    @click="showApplicants"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main content -->
        <div class="px-6 pb-6">
          <div class="max-w-6xl mx-auto">
            <!-- Single column layout for mobile-first approach -->
            <div class="space-y-8">
              <!-- Description section -->
              <div class="border-b border-border pb-6">
                <h2
                  class="text-lg font-normal text-gray-900 dark:text-white mb-3 flex items-center"
                >
                  <svg
                    class="w-4 h-4 mr-2 text-gray-600 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  {{ $t('jobs.description') }}
                </h2>
                <p
                  class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap"
                >
                  {{ jobStore.currentJob.description }}
                </p>
              </div>

              <!-- Job highlights -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Preferred timing -->
                <div
                  v-if="jobStore.currentJob.preferred_datetime"
                  class="flex items-start space-x-3"
                >
                  <div class="bg-blue-50 p-2 rounded-lg">
                    <svg
                      class="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3
                      class="font-medium text-gray-900 dark:text-white mb-1 text-sm"
                    >
                      {{ $t('jobs.preferredTiming') }}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                      {{
                        formatDateTime(jobStore.currentJob.preferred_datetime)
                      }}
                    </p>
                  </div>
                </div>

                <!-- Service type -->
                <div class="flex items-start space-x-3">
                  <div class="bg-muted/50 p-2 rounded-lg">
                    <svg
                      class="w-4 h-4 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3
                      class="font-medium text-gray-900 dark:text-white mb-1 text-sm"
                    >
                      {{ $t('jobs.serviceCategory') }}
                    </h3>
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                      {{ jobStore.currentJob.category_name }}
                    </p>
                  </div>
                </div>

                <!-- Budget display -->
                <div
                  v-if="jobStore.currentJob.budget"
                  class="flex items-start space-x-3"
                >
                  <div class="bg-muted/50 p-2 rounded-lg">
                    <svg
                      class="w-4 h-4 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3
                      class="font-medium text-gray-900 dark:text-white mb-1 text-sm"
                    >
                      {{ $t('jobs.budget') }}
                    </h3>
                    <p
                      class="text-gray-600 dark:text-gray-300 text-lg font-semibold"
                    >
                      ${{ jobStore.currentJob.budget }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Client Actions (for desktop) -->
              <div
                v-if="
                  userRole === 'client' &&
                  isJobOwner &&
                  jobStore.currentJob.status === 'open'
                "
                class="hidden lg:flex space-x-3 pt-6 border-t border-border"
              >
                <Button
                  @click="editJob"
                  variant="outline"
                  class="border-2 border-border hover:border-muted-foreground font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  {{ $t('jobs.editJobDetails') }}
                </Button>
                <Button
                  @click="openCancelDialog"
                  variant="destructive"
                  class="font-semibold py-3 px-6 rounded-xl transition-all duration-200"
                >
                  {{ $t('jobs.cancelJob') }}
                </Button>
              </div>

              <!-- Assigned Contractor Section -->
              <div
                v-if="
                  jobStore.currentJob.selected_contractor_id &&
                  isJobOwner &&
                  [
                    'assigned',
                    'in_progress',
                    'completed',
                    'cancelled',
                  ].includes(jobStore.currentJob.status)
                "
                class="border-t border-border pt-8"
              >
                <h2
                  class="text-lg font-normal text-gray-900 dark:text-white mb-4 flex items-center"
                >
                  <svg
                    class="w-4 h-4 mr-2 text-gray-600 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    ></path>
                  </svg>
                  {{ $t('jobs.assignedContractor') }}
                </h2>
                <AssignedContractorCard
                  :user="jobStore.currentJob.assignedContractor"
                  :job-status="jobStore.currentJob.status"
                  :is-job-owner="isJobOwner"
                  :user-role="userRole"
                  :job-id="jobStore.currentJob.id"
                  :chat-room-id="jobStore.currentJob.chatRoomId"
                  @view-profile="handleViewProfile"
                  @start-conversation="handleStartConversation"
                  @phone-call="handlePhoneCall"
                  @mark-in-progress="handleMarkInProgress"
                  @mark-completed="handleMarkCompleted"
                  @rate-contractor="handleRateContractor"
                />
              </div>

              <!-- Payment Actions (for desktop) -->
              <div
                v-if="
                  userRole === 'client' &&
                  isJobOwner &&
                  (jobStore.currentJob.status === 'completed' ||
                    jobStore.currentJob.status === 'in_review') &&
                  paymentStatus === 'unpaid'
                "
                class="hidden lg:flex space-x-3 pt-6 border-t border-border"
              >
                <Button
                  @click="openPaymentModal"
                  class="w-full font-semibold py-3 px-6 rounded-xl transition-all duration-200 bg-green-600 hover:bg-green-700"
                  haptic-feedback="success"
                >
                  <svg
                    class="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    ></path>
                  </svg>
                  {{ $t('payment.payNow') }} - S/
                  {{ jobStore.currentJob.budget }}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Applicants section -->
        <div
          v-if="activeTab === 'applicants'"
          class="border-t border-border px-6 py-6"
          data-section="applicants"
        >
          <div class="max-w-6xl mx-auto">
            <h2 class="text-2xl font-normal text-gray-900 dark:text-white mb-6">
              {{ $t('jobs.applicants') }}
            </h2>
            <JobApplicantsList
              :job-id="jobId"
              :is-job-owner="isJobOwner"
              :has-unread-applications="
                jobStore.currentJob.has_unread_applications
              "
              @applicant-selected="onApplicantSelected"
            />
          </div>
        </div>
      </div>

      <!-- Sticky bottom action bar -->
      <div
        v-if="
          userRole === 'contractor' && jobStore.currentJob.status === 'open'
        "
        class="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border p-4 z-[90]"
      >
        <div class="max-w-6xl mx-auto flex items-center justify-between">
          <div v-if="jobStore.currentJob.budget" class="hidden sm:block">
            <div class="text-lg font-bold text-gray-900 dark:text-white">
              ${{ jobStore.currentJob.budget }}
              <span
                class="text-sm font-normal text-gray-600 dark:text-gray-300"
                >{{ $t('jobs.budget').toLowerCase() }}</span
              >
            </div>
          </div>
          <Button
            v-if="!hasApplied"
            @click="applyForJob"
            :disabled="jobStore.isLoading || isProcessingApplication"
            class="w-full sm:w-auto font-semibold py-4 px-8 rounded-xl"
            size="lg"
          >
            {{
              jobStore.isLoading || isProcessingApplication
                ? $t('jobs.applying')
                : $t('jobs.applyForThisJob')
            }}
          </Button>
          <Button
            v-else
            disabled
            variant="outline"
            class="w-full sm:w-auto font-semibold py-4 px-8 rounded-xl"
            size="lg"
          >
            {{ applicationButtonText }}
          </Button>
        </div>
      </div>

      <!-- Sticky bottom action bar for clients -->
      <div
        v-else-if="
          userRole === 'client' &&
          isJobOwner &&
          jobStore.currentJob.status === 'open'
        "
        class="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border p-4 z-[90] lg:hidden"
      >
        <div class="max-w-6xl mx-auto flex space-x-3">
          <Button
            @click="editJob"
            variant="outline"
            class="flex-1 border-2 border-border hover:border-muted-foreground font-semibold py-4 rounded-xl transition-all duration-200"
          >
            {{ $t('jobs.editJob') }}
          </Button>
          <Button
            @click="openCancelDialog"
            variant="destructive"
            class="flex-1 font-semibold py-4 rounded-xl transition-all duration-200"
          >
            {{ $t('jobs.cancelJob') }}
          </Button>
        </div>
      </div>

      <!-- Sticky bottom payment bar for clients -->
      <div
        v-else-if="
          userRole === 'client' &&
          isJobOwner &&
          (jobStore.currentJob.status === 'completed' ||
            jobStore.currentJob.status === 'in_review') &&
          paymentStatus === 'unpaid'
        "
        class="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-border p-4 z-[90] lg:hidden"
      >
        <div class="max-w-6xl mx-auto">
          <Button
            @click="openPaymentModal"
            class="w-full font-semibold py-4 px-6 rounded-xl transition-all duration-200 bg-green-600 hover:bg-green-700"
            size="lg"
            haptic-feedback="success"
          >
            <svg
              class="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              ></path>
            </svg>
            {{ $t('payment.payNow') }} - S/ {{ jobStore.currentJob.budget }}
          </Button>
        </div>
      </div>

      <!-- Job Application Form Modal -->
      <div
        v-if="showApplicationForm"
        class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
        @click.self="showApplicationForm = false"
      >
        <div
          class="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-border shadow-2xl transform transition-all duration-200 scale-100"
        >
          <div
            class="p-6 border-b border-border flex justify-between items-center bg-gradient-to-r from-primary/5 to-blue-500/5"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ $t('jobs.applyForJob') }}
                </h2>
                <p class="text-sm text-gray-600 dark:text-gray-300">
                  {{ $t('jobs.submitApplication') }}
                </p>
              </div>
            </div>
            <button
              @click="showApplicationForm = false"
              class="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-2 transition-all duration-200"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
            </button>
          </div>
          <div class="p-6">
            <JobApplicationForm
              :job-id="jobId"
              @applied="onApplicationSubmitted"
              @error="(msg) => (applyErrorMsg = msg)"
            />
          </div>
        </div>
      </div>

      <!-- Payment Modal -->
      <PaymentModal
        v-model:open="showPaymentModal"
        :job-id="jobId"
        :amount="jobStore.currentJob?.budget || 0"
        :description="`Payment for ${jobStore.currentJob?.category_name} service`"
        @success="handlePaymentSuccess"
        @error="handlePaymentError"
        @cancel="showPaymentModal = false"
      />
    </div>

    <!-- Job not found state -->
    <div v-else class="w-full py-16 text-center">
      <div class="max-w-6xl mx-auto px-4">
        <div class="bg-muted/10 border border-muted/20 rounded-2xl p-8">
          <div class="text-gray-600 dark:text-gray-300 text-lg font-medium">
            {{ $t('jobs.jobNotFound') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref,
  onBeforeUnmount,
  reactive,
  nextTick,
  watch,
  onActivated,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useJobStore, JOB_STATUS, isValidUUID } from '../stores/job';
import { useJobApplicationsStore } from '../stores/jobApplications';
import { useAuth } from '@/composables/useAuth';
import { formatApplicationTime } from '@/lib/timeUtils';
import { Button } from '@/components/ui/button';
import JobApplicantsList from '../components/jobs/JobApplicantsList.vue';
import JobApplicationForm from '../components/jobs/JobApplicationForm.vue';
import ApplicantCounter from '../components/jobs/ApplicantCounter.vue';
import AssignedContractorCard from '../components/jobs/AssignedContractorCard.vue';
import JobActionButton from '../components/jobs/JobActionButton.vue';
import JobImageCarousel from '../components/jobs/JobImageCarousel.vue';
import PaymentModal from '@/components/payments/PaymentModal.vue';
import PaymentStatusIndicator from '@/components/payments/PaymentStatusIndicator.vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const jobStore = useJobStore();
const jobApplicationsStore = useJobApplicationsStore();

// FIXED: Use auth composable directly without local client management
const { user, isLoaded, isSignedIn, getSupabaseClient, getToken } = useAuth();

// FIXED: Always use the global Supabase client - no local reference
const getSupabase = () => {
  return getSupabaseClient();
};

// Get jobId from route params and ensure it's a valid UUID
const rawJobId = route.params.jobId;
const jobId = computed(() => {
  // Check if the jobId is already a valid UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(rawJobId)) {
    return rawJobId;
  }

  // If not a valid UUID format, check if it's a legacy user ID format
  if (rawJobId.startsWith('user_')) {
    // Extract the ID part from the legacy user ID (remove the "user_" prefix)
    const idWithoutPrefix = rawJobId.substring(5);
    // Check if the extracted part is a valid UUID
    if (uuidRegex.test(idWithoutPrefix)) {
      return idWithoutPrefix;
    }

    // Even if the extracted part is not a valid UUID, we still need to remove the prefix
    // to avoid the "invalid input syntax for type uuid" error
    return idWithoutPrefix;
  }

  return rawJobId; // Return the original value anyway to avoid breaking the UI
});

// Fetch user role from Supabase (with database fallback like the router)
const userRole = ref(null);
const userId = computed(() => user.value?.id);

const fetchUserRole = async () => {
  if (!isLoaded.value || !isSignedIn.value || !user.value) {
    userRole.value = null;
    return;
  }

  try {
    // First check user metadata
    const metadataRole = user.value.user_metadata?.role;
    if (metadataRole) {
      userRole.value = metadataRole;
      return;
    }

    // Fallback: check client_profiles table (same as router logic)
    const { data: profile } = await getSupabase()
      .from('client_profiles')
      .select('role')
      .eq('id', user.value.id)
      .single();

    userRole.value = profile?.role || null;
  } catch (error) {
    userRole.value = null;
  }
};

// Component state
const applyErrorMsg = ref('');
const isCancelDialogOpen = ref(false);
const isRemoveDialogOpen = ref(false);
const activeTab = ref('details');
const showApplicationForm = ref(false);
const applicationMessage = ref('');
const hasApplied = ref(false);
const applicationDetails = ref(null);
const isProcessingApplication = ref(false);
const currentPhotoIndex = ref(0);

// Payment state
const showPaymentModal = ref(false);
const paymentStatus = ref('unpaid'); // Default status

// Handle slide changes from the new carousel component
const handleSlideChange = (slideIndex) => {
  currentPhotoIndex.value = slideIndex;
};

// Handle image loading errors with enhanced debugging and auto-removal
const handleImageError = async (event) => {
  const originalSrc =
    event.target.getAttribute('data-original-src') || event.target.src;

  // Store the original URL before replacing with placeholder
  event.target.setAttribute('data-original-src', originalSrc);
  event.target.src = '/images/placeholder-image.png'; // Fallback to placeholder

  // If this is the main image and not a thumbnail, log additional debug info
  if (event.target.alt === 'Job Image') {
    // Try to fetch the image directly to check CORS and other issues
    fetch(originalSrc, { method: 'HEAD' })
      .then((response) => {
        // If the image is not found (404), remove it from the database
        if (response.status === 404 && jobStore.currentJob?.id) {
          jobStore
            .removePhotoFromJob(jobStore.currentJob.id, originalSrc)
            .then((success) => {
              if (success) {
                // Refresh the UI to remove the missing image
                if (jobStore.currentJob?.photos?.length > 0) {
                  // If there are other photos, switch to the first one
                  currentPhotoIndex.value = 0;
                }
              } else {
              }
            })
            .catch((err) => {});
        }
      })
      .catch((error) => {
        // If we can't even fetch the image, it's likely missing
        // Remove it from the database
        if (jobStore.currentJob?.id) {
          console.log(
            'Image fetch failed, removing from database:',
            originalSrc
          );
          jobStore
            .removePhotoFromJob(jobStore.currentJob.id, originalSrc)
            .then((success) => {
              if (success) {
                // Refresh the UI to remove the missing image
                if (jobStore.currentJob?.photos?.length > 0) {
                  // If there are other photos, switch to the first one
                  currentPhotoIndex.value = 0;
                }
              } else {
              }
            })
            .catch((err) => {});
        }
      });
  }
};

// Add handler for successful image loads
const handleImageLoad = (event) => {
  // Image loaded successfully
};

// Initialize carousel state
const initCarouselState = () => {
  // Reset carousel to first image if job has photos
  if (jobStore.currentJob?.photos && jobStore.currentJob.photos.length > 0) {
    currentPhotoIndex.value = 0;
  }
};

onMounted(async () => {
  try {
    // Only fetch the job data once using the store
    // This avoids the double fetch that was causing content shifting

    // Check if we already have this job in the store to avoid unnecessary fetches
    if (jobStore.currentJob?.id === jobId.value) {
      console.log(
        '[JobDetailsView] Job already loaded in store, skipping fetch'
      );
    } else {
      await jobStore.fetchJobById(jobId.value);
    }

    if (!jobStore.currentJob) {
      console.warn('[JobDetailsView] Job not found');
      jobStore.error = 'Job not found';
    } else {
      // Initialize carousel state after job data is loaded
      await nextTick();
      initCarouselState();
    }
  } catch (err) {
    console.error('[JobDetailsView] Error fetching job details:', err);
    jobStore.error = err.message;
  }

  try {
    // Fetch user role from database
    await fetchUserRole();
  } catch (err) {
    console.error('[JobDetailsView] Error fetching user role:', err);
  }

  try {
    // Also check if the user has applied for this job
    await checkIfUserHasApplied();
  } catch (err) {
    console.error('[JobDetailsView] Error checking if user has applied:', err);
  }

  try {
    // Fetch payment status for job owners
    await fetchPaymentStatus();
  } catch (err) {
    console.error('[JobDetailsView] Error fetching payment status:', err);
  }

  // Scroll to top will be handled after content is loaded

  console.log('[JobDetailsView] Component initialization completed');
  // Component-level scroll logic removed; router.scrollBehavior will handle this.
});

// Watch for authentication state changes and refetch user role
watch(
  [isLoaded, isSignedIn, user],
  async () => {
    if (isLoaded.value) {
      await fetchUserRole();
    }
  },
  { immediate: false }
);

// Component-level scroll logic for route changes and activation removed.
// Router's scrollBehavior is now responsible.

// --- Helper Functions ---
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'Not specified';
  try {
    return new Date(dateTimeString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (e) {
    return 'Invalid Date';
  }
};

const statusBadgeClass = (status) => {
  switch (status?.toLowerCase()) {
    case 'open':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'assigned':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'in_progress':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'in_review':
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
    case 'finalized':
      return 'bg-muted text-foreground';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-muted text-foreground';
  }
};

// --- Action Handlers ---
const applyForJob = async () => {
  applyErrorMsg.value = ''; // Clear previous errors

  // --- Profile Completion Check ---
  if (userRole.value === 'contractor') {
    // Get contractor profile data from Supabase
    const { data: profileData, error: profileError } = await getSupabase()
      .from('contractor_profiles')
      .select('*')
      .eq('user_id', userId.value)
      .maybeSingle();

    console.log('Contractor profile data:', profileData);

    // Check if all mandatory fields are filled
    const isMissingMandatoryFields =
      !profileData ||
      !profileData.full_name ||
      !profileData.bio ||
      profileData.bio.length < 50 ||
      !profileData.skills ||
      profileData.skills.length === 0 ||
      !profileData.years_experience ||
      !profileData.service_areas ||
      profileData.service_areas.length === 0 ||
      !profileData.contact_phone;

    console.log(
      'Apply Check: Missing mandatory fields?',
      isMissingMandatoryFields
    );

    if (isMissingMandatoryFields) {
      console.log('Redirecting to complete profile...');
      // Redirect to the profile completion page, passing the job ID to return to
      router.push({
        name: 'CompleteProfile',
        query: { redirectJobId: jobId.value },
      });
      return; // Stop the application process here
    }
  }
  // --- End Profile Completion Check ---

  if (!userId.value) {
    applyErrorMsg.value = 'Cannot apply: User ID not found.';
    return;
  }
  if (!jobStore.currentJob?.id) {
    applyErrorMsg.value = 'Cannot apply: Job details not loaded.';
    return;
  }

  // This function is now just a wrapper to show the application form
  showApplicationForm.value = true;
};

const editJob = () => {
  // Make sure we're using the processed jobId (without 'user_' prefix if present)
  const processedJobId = jobId.value;

  console.log('[JobDetailsView] Navigating to edit job with ID:', {
    rawJobId: rawJobId,
    processedJobId: processedJobId,
    serviceId: jobStore.currentJob.service_id,
  });

  // Navigate to the PostJobView with the job ID as a parameter to indicate edit mode
  router.push({
    name: 'EditJob',
    params: {
      jobId: processedJobId,
      serviceId: jobStore.currentJob.service_id,
    },
  });
};

// Function to open the cancel confirmation dialog
const openCancelDialog = () => {
  console.log('[JobDetailsView] Open cancel dialog requested.');
  isCancelDialogOpen.value = true;
};

// Function to handle the actual cancellation after confirmation
const handleConfirmCancel = async () => {
  console.log(
    `[JobDetailsView] Confirmed cancellation for job ID: ${jobId.value}`
  );
  isCancelDialogOpen.value = false; // Close the dialog

  try {
    console.log('[JobDetailsView] Calling cancel_job database function...');

    // Make sure we're using the processed jobId (without 'user_' prefix if present)
    const processedJobId = jobId.value;

    console.log(
      `[JobDetailsView] Using processed job ID for cancellation: ${processedJobId}`
    );

    // Use the database function directly via RPC
    const { data, error } = await getSupabase().rpc('cancel_job', {
      job_id: processedJobId,
    });

    if (error) {
      console.error('[JobDetailsView] Error in cancel_job RPC:', error);
      console.error('[JobDetailsView] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      alert(`Error cancelling job: ${error.message}`);
      return;
    }

    const success = data;
    console.log(`[JobDetailsView] cancel_job function returned: ${success}`);

    if (success) {
      console.log(
        '[JobDetailsView] Cancellation successful. Refreshing details...'
      );
      // Refresh the job details to show the updated status
      await jobStore.fetchJobById(jobId.value);
      console.log('[JobDetailsView] Job details refreshed.');
      // Consider using a toast notification instead of alert
      alert('Job has been cancelled successfully.');
      // Redirect to home view after successful cancellation
      console.log('[JobDetailsView] Redirecting...');
      // Wait for authentication to be loaded before navigating
      if (isLoaded.value) {
        router.push(backLink.value);
      } else {
        // Fallback navigation if auth is not loaded
        router.push('/');
      }
    } else {
      console.error(`[JobDetailsView] cancel_job function returned false.`);
      alert(
        `Error cancelling job: Job not found or you don't have permission to cancel it.`
      );
    }
  } catch (err) {
    console.error('[JobDetailsView] Error caught in handleConfirmCancel:', err);
    alert(`Error cancelling job: ${err.message}`);
  }
};

// Determine where the back link should go
const backLink = computed(() => {
  return userRole.value === 'contractor' ? '/home' : '/';
});

// Check if the current user is the job owner
const isJobOwner = computed(() => {
  // Debug the comparison values
  if (jobStore.currentJob && userId.value) {
    // Extract the ID part from the legacy user ID (remove the "user_" prefix)
    const legacyIdWithoutPrefix = userId.value.startsWith('user_')
      ? userId.value.substring(5)
      : userId.value;

    // Also check if the job's posted_by_user_id might be a legacy ID that needs processing
    const jobPostedByIdProcessed =
      jobStore.currentJob.posted_by_user_id?.startsWith('user_')
        ? jobStore.currentJob.posted_by_user_id.substring(5)
        : jobStore.currentJob.posted_by_user_id;

    console.log('[JobDetailsView] Job owner check:', {
      posted_by_user_id: jobStore.currentJob.posted_by_user_id,
      posted_by_user_id_processed: jobPostedByIdProcessed,
      current_user_id: userId.value,
      current_user_id_without_prefix: legacyIdWithoutPrefix,
      matches_full: jobStore.currentJob.posted_by_user_id === userId.value,
      matches_without_prefix:
        jobStore.currentJob.posted_by_user_id === legacyIdWithoutPrefix,
      matches_both_processed: jobPostedByIdProcessed === legacyIdWithoutPrefix,
    });

    // Check all possible matching combinations
    return (
      jobStore.currentJob.posted_by_user_id === userId.value ||
      jobStore.currentJob.posted_by_user_id === legacyIdWithoutPrefix ||
      jobPostedByIdProcessed === userId.value ||
      jobPostedByIdProcessed === legacyIdWithoutPrefix
    );
  }

  return false;
});

// Computed property for application button text
const applicationButtonText = computed(() => {
  if (!hasApplied.value || !applicationDetails.value) {
    return t('jobs.youveApplied');
  }

  const locale = t('locale') === 'es-PE' ? 'es-PE' : 'en-US';
  return formatApplicationTime(applicationDetails.value.appliedAt, locale);
});

// Function to handle application submission
const onApplicationSubmitted = async () => {
  showApplicationForm.value = false;
  applyErrorMsg.value = '';

  isProcessingApplication.value = true;

  try {
    // First, refresh the job applications store to ensure it has the latest data
    await jobApplicationsStore.getJobApplications(jobId.value);
    console.log('[JobDetailsView] Job applications refreshed after submission');

    // Then refresh the job data to get the updated applicant count
    await jobStore.fetchJobById(jobId.value);
    console.log('[JobDetailsView] Job data refreshed after application');

    // Finally, check if user has applied with the updated data
    await checkIfUserHasApplied();
    console.log('[JobDetailsView] Application status checked with fresh data');
  } catch (error) {
    console.error(
      '[JobDetailsView] Failed to refresh data after application:',
      error
    );
    // Fallback: set hasApplied to true to prevent modal reappearing
    hasApplied.value = true;
  } finally {
    isProcessingApplication.value = false;
  }
};

// Function to show applicants (MISSING FUNCTION - BUG FIX)
const showApplicants = () => {
  console.log(
    '[JobDetailsView] showApplicants called - switching to applicants tab'
  );
  console.log('[JobDetailsView] Current state:', {
    isJobOwner: isJobOwner.value,
    applicantCount: jobStore.currentJob?.applicant_count || 0,
    currentTab: activeTab.value,
    jobStatus: jobStore.currentJob?.status,
  });

  // Switch to the applicants tab to show the applicants list
  activeTab.value = 'applicants';

  // Scroll to the applicants section
  nextTick(() => {
    const applicantsSection = document.querySelector(
      '[data-section="applicants"]'
    );
    if (applicantsSection) {
      applicantsSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
};

// Function to handle applicant selection
const onApplicantSelected = async (selectionData) => {
  console.log('[JobDetailsView] ===== HANDLING APPLICANT SELECTION =====');
  console.log('[JobDetailsView] Selection data received:', selectionData);

  try {
    // Handle both old format (just applicationId) and new format (object with details)
    const applicationId = selectionData.applicationId || selectionData;
    const contractorId = selectionData.contractorId;
    const jobStatus = selectionData.jobStatus;
    const chatCreated = selectionData.chatCreated;

    console.log('[JobDetailsView] Parsed selection data:', {
      applicationId,
      contractorId,
      jobStatus,
      chatCreated,
    });

    // Clear job store cache to ensure fresh data
    console.log('[JobDetailsView] Clearing job store cache...');
    jobStore.clearCache();

    // Refresh the job details to show updated status
    console.log('[JobDetailsView] Refreshing job details...');
    await jobStore.fetchJobById(jobId.value, true); // Force refresh

    console.log('[JobDetailsView] Updated job data:', jobStore.currentJob);

    // Switch back to details tab after selection
    activeTab.value = 'details';

    // Show a success message with more details
    let successMessage = jobStatus
      ? `Contractor has been selected successfully! The job status has been updated to "${jobStatus}".`
      : 'Contractor has been selected successfully. The job status has been updated to "assigned".';

    if (chatCreated) {
      successMessage +=
        '\n\n💬 A chat conversation has been automatically started with the selected contractor. You can find it in your Messages.';
    }

    console.log('[JobDetailsView] Showing success message:', successMessage);
    alert(successMessage);

    console.log('[JobDetailsView] ===== APPLICANT SELECTION COMPLETED =====');
  } catch (error) {
    console.error('[JobDetailsView] ===== APPLICANT SELECTION ERROR =====');
    console.error(
      '[JobDetailsView] Error handling applicant selection:',
      error
    );
    alert(
      'There was an error processing the contractor selection. Please refresh the page and try again.'
    );
  }
};

// Function to handle job action events from JobActionButton
const handleJobAction = (action) => {
  if (action === 'remove') {
    console.log(
      `[JobDetailsView] Remove job requested for job ID: ${jobId.value}`
    );
    // Open the remove confirmation dialog
    isRemoveDialogOpen.value = true;
  }
};

// Payment handlers
const openPaymentModal = () => {
  showPaymentModal.value = true;
};

const handlePaymentSuccess = async (paymentResult) => {
  console.log('[JobDetailsView] Payment successful:', paymentResult);
  showPaymentModal.value = false;
  paymentStatus.value = 'paid';

  // Refresh job data to reflect payment status
  try {
    await jobStore.fetchJobById(jobId.value, true);
  } catch (error) {
    console.error(
      '[JobDetailsView] Failed to refresh job data after payment:',
      error
    );
  }

  // Show success message
  alert('Payment completed successfully! The contractor will be notified.');
};

const handlePaymentError = (error) => {
  console.error('[JobDetailsView] Payment failed:', error);
  // Error is already handled by the PaymentModal component
};

// Fetch payment status for the current job
const fetchPaymentStatus = async () => {
  if (
    !jobId.value ||
    !userId.value ||
    userRole.value !== 'client' ||
    !isJobOwner.value
  ) {
    return;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('payments')
      .select('status')
      .eq('job_id', jobId.value)
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      console.error('[JobDetailsView] Error fetching payment status:', error);
      return;
    }

    paymentStatus.value = data?.status || 'unpaid';
  } catch (err) {
    console.error('[JobDetailsView] Error fetching payment status:', err);
  }
};

// Function to handle the actual job removal after confirmation
const handleConfirmRemove = async () => {
  console.log(`[JobDetailsView] Confirmed removal for job ID: ${jobId.value}`);
  isRemoveDialogOpen.value = false; // Close the dialog

  try {
    // Make sure we're using the processed jobId (without 'user_' prefix if present)
    const processedJobId = jobId.value;

    console.log(
      `[JobDetailsView] Using processed job ID for removal: ${processedJobId}`
    );
    console.log('[JobDetailsView] Calling jobStore.removeJob...');

    const success = await jobStore.removeJob(processedJobId);

    if (success) {
      console.log('[JobDetailsView] Job removed successfully');
      // Use a toast notification instead of alert in a production app
      alert('Job has been removed successfully.');
      // Navigate back to the appropriate page
      // Wait for authentication to be loaded before navigating
      if (isLoaded.value) {
        router.push(backLink.value);
      } else {
        // Fallback navigation if auth is not loaded
        router.push('/');
      }
    } else {
      console.error(
        `[JobDetailsView] Failed to remove job. Error: ${jobStore.error}`
      );
      alert(`Error removing job: ${jobStore.error || 'Unknown error'}`);
    }
  } catch (err) {
    console.error('[JobDetailsView] Error caught in handleConfirmRemove:', err);
    console.error('[JobDetailsView] Error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
    });
    alert(`Error removing job: ${err.message}`);
  }
};

// Check if the current user has already applied for this job
const checkIfUserHasApplied = async () => {
  if (!jobId.value || !userId.value || userRole.value !== 'contractor') return;

  try {
    // Make sure we're using the processed jobId (without 'user_' prefix if present)
    const processedJobId = jobId.value;

    console.log(
      `[JobDetailsView] Checking if user ${userId.value} has applied for job ${processedJobId}`
    );

    // Process the contractor user ID in the same way we process other IDs
    const processedUserId = userId.value.startsWith('user_')
      ? userId.value.substring(5)
      : userId.value;

    // Use the new getApplicationDetails method to get both status and timestamp
    const details = await jobApplicationsStore.getApplicationDetails(
      processedJobId,
      userId.value
    );

    if (details) {
      hasApplied.value = true;
      applicationDetails.value = details;
      console.log(`[JobDetailsView] User has applied:`, details);
    } else {
      // Also check with processed user ID as fallback
      const detailsProcessed = await jobApplicationsStore.getApplicationDetails(
        processedJobId,
        processedUserId
      );

      if (detailsProcessed) {
        hasApplied.value = true;
        applicationDetails.value = detailsProcessed;
        console.log(
          `[JobDetailsView] User has applied (processed ID):`,
          detailsProcessed
        );
      } else {
        hasApplied.value = false;
        applicationDetails.value = null;
        console.log(`[JobDetailsView] User has not applied`);
      }
    }
  } catch (err) {
    console.error('Error checking if user has applied:', err);
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
    });
    hasApplied.value = false;
    applicationDetails.value = null;
  }
};

// FIXED: Simplified cleanup - only clean up component-specific resources
onBeforeUnmount(() => {
  console.log('[JobDetailsView] Component unmounting - starting cleanup...');

  try {
    // Clear any component-specific timers or intervals
    // Reset component state
    activeTab.value = 'details';
    showApplicationForm.value = false;
    hasApplied.value = false;
    applicationDetails.value = null;
    isProcessingApplication.value = false;
    currentPhotoIndex.value = 0;

    console.log('[JobDetailsView] Component cleanup completed successfully');
  } catch (err) {
    console.error('[JobDetailsView] Error during component cleanup:', err);
  }

  console.log(
    '[JobDetailsView] Component unmounting completed - navigation should work now'
  );
});

// Event handlers for AssignedContractorCard
const handleViewProfile = (contractor) => {
  console.log(
    '[JobDetailsView] View profile requested for contractor:',
    contractor
  );
  // Navigate to contractor profile
  router.push(`/contractors/${contractor.id || contractor.user_id}`);
};

const handleStartConversation = async (contractor) => {
  console.log(
    '[JobDetailsView] Start conversation requested for contractor:',
    contractor
  );
  try {
    // This will be handled by the AssignedContractorCard component itself
    // The component will create the chat room and navigate to it
  } catch (error) {
    console.error('[JobDetailsView] Error starting conversation:', error);
    alert('Failed to start conversation. Please try again.');
  }
};

const handlePhoneCall = (contractor) => {
  console.log(
    '[JobDetailsView] Phone call requested for contractor:',
    contractor
  );
  // The AssignedContractorCard component handles the actual phone call
  // This is just for logging/analytics if needed
};

const handleMarkInProgress = async (contractor) => {
  console.log(
    '[JobDetailsView] Mark in progress requested for contractor:',
    contractor
  );
  try {
    // Update job status to in_progress
    const { error } = await getSupabase()
      .from('jobs')
      .update({ status: 'in_progress' })
      .eq('id', jobId.value);

    if (error) {
      console.error(
        '[JobDetailsView] Error updating job status to in_progress:',
        error
      );
      alert('Failed to update job status. Please try again.');
      return;
    }

    // Refresh job data
    await jobStore.fetchJobById(jobId.value, true);
    alert('Job status updated to "In Progress"');
  } catch (error) {
    console.error('[JobDetailsView] Error marking job in progress:', error);
    alert('Failed to update job status. Please try again.');
  }
};

const handleMarkCompleted = async (contractor) => {
  console.log(
    '[JobDetailsView] Mark completed requested for contractor:',
    contractor
  );
  try {
    // Update job status to completed
    const { error } = await getSupabase()
      .from('jobs')
      .update({ status: 'completed' })
      .eq('id', jobId.value);

    if (error) {
      console.error(
        '[JobDetailsView] Error updating job status to completed:',
        error
      );
      alert('Failed to update job status. Please try again.');
      return;
    }

    // Refresh job data
    await jobStore.fetchJobById(jobId.value, true);
    alert('Job status updated to "Completed"');
  } catch (error) {
    console.error('[JobDetailsView] Error marking job completed:', error);
    alert('Failed to update job status. Please try again.');
  }
};

const handleRateContractor = (contractor) => {
  console.log(
    '[JobDetailsView] Rate contractor requested for contractor:',
    contractor
  );
  // Navigate to rating page or show rating modal
  // For now, we'll show an alert - this can be enhanced later
  alert('Rating functionality will be implemented soon.');

  // Future implementation could be:
  // router.push(`/rate-contractor/${contractor.id}?jobId=${jobId.value}`);
  // or show a rating modal component
};

// Duplicate onMounted removed - logic consolidated in main onMounted hook above
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
