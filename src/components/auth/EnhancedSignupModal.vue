<template>
  <div
    v-if="showModal"
    class="fixed inset-0 z-50 overflow-hidden"
    @click.self="closeModal"
  >
    <!-- Backdrop with blur effect -->
    <div
      class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
      :class="{ 'opacity-100': modalVisible, 'opacity-0': !modalVisible }"
    ></div>

    <!-- Modal Container -->
    <div
      class="relative h-full flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <!-- Modal Content -->
      <div
        class="bg-white dark:bg-gray-900 w-full h-full sm:h-auto sm:max-w-md sm:rounded-2xl shadow-2xl transform transition-all duration-300 ease-out overflow-hidden"
        :class="{
          'translate-y-0': modalVisible,
          'translate-y-full sm:translate-y-8 sm:scale-95': !modalVisible,
        }"
      >
        <!-- Header with progress -->
        <div
          class="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 z-10"
        >
          <div class="flex items-center justify-between p-4 sm:p-6">
            <button
              @click="closeModal"
              class="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                class="w-6 h-6 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <!-- Progress Indicator -->
            <div class="flex items-center space-x-2">
              <div
                v-for="step in totalSteps"
                :key="step"
                class="w-2 h-2 rounded-full transition-all duration-300"
                :class="{
                  'bg-blue-600': step <= currentStep,
                  'bg-gray-200 dark:bg-gray-700': step > currentStep,
                }"
              ></div>
            </div>

            <div class="w-10"></div>
            <!-- Spacer for centering -->
          </div>

          <!-- Progress Bar -->
          <div class="h-1 bg-gray-100 dark:bg-gray-800">
            <div
              class="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out"
              :style="{ width: `${(currentStep / totalSteps) * 100}%` }"
            ></div>
          </div>
        </div>

        <!-- Content Container -->
        <div class="flex-1 overflow-y-auto">
          <!-- Step 1: Welcome & Social Login -->
          <div v-if="currentStep === 1" class="p-6 space-y-6">
            <!-- Hero Section -->
            <div class="text-center space-y-4">
              <div
                class="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <svg
                  class="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>

              <div>
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Join thousands of users
                </h2>
                <p class="text-gray-600 dark:text-gray-400 mt-2">
                  Connect with skilled professionals or find your next gig
                </p>
              </div>
            </div>

            <!-- Social Trust Indicators -->
            <div class="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <div
                class="flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400"
              >
                <div class="flex items-center space-x-1">
                  <svg
                    class="w-4 h-4 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    />
                  </svg>
                  <span>10K+ Users</span>
                </div>
                <div class="flex items-center space-x-1">
                  <svg
                    class="w-4 h-4 text-yellow-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </svg>
                  <span>4.8 Rating</span>
                </div>
                <div class="flex items-center space-x-1">
                  <svg
                    class="w-4 h-4 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    />
                  </svg>
                  <span>Secure</span>
                </div>
              </div>
            </div>

            <!-- Social Login Options -->
            <div class="space-y-3">
              <button
                @click="handleGoogleSignup"
                :disabled="isLoading"
                class="w-full flex items-center justify-center gap-3 py-4 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <svg class="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                @click="handleAppleSignup"
                :disabled="isLoading"
                class="w-full flex items-center justify-center gap-3 py-4 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                  />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>

            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div
                  class="w-full border-t border-gray-200 dark:border-gray-700"
                ></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span
                  class="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400"
                  >or continue with email</span
                >
              </div>
            </div>

            <!-- Continue with Email -->
            <button
              @click="nextStep"
              class="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue with Email
            </button>

            <!-- Terms -->
            <p
              class="text-xs text-center text-gray-500 dark:text-gray-400 leading-relaxed"
            >
              By continuing, you agree to our
              <a
                href="#"
                class="text-blue-600 dark:text-blue-400 hover:underline"
                >Terms of Service</a
              >
              and
              <a
                href="#"
                class="text-blue-600 dark:text-blue-400 hover:underline"
                >Privacy Policy</a
              >
            </p>
          </div>

          <!-- Step 2: Basic Information -->
          <div v-if="currentStep === 2" class="p-6 space-y-6">
            <div class="text-center space-y-2">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                Tell us about yourself
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                We'll use this to personalize your experience
              </p>
            </div>

            <form @submit.prevent="nextStep" class="space-y-5">
              <!-- Full Name -->
              <div class="space-y-2">
                <label
                  for="fullName"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Full Name
                </label>
                <div class="relative">
                  <input
                    id="fullName"
                    v-model="formData.fullName"
                    type="text"
                    required
                    class="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                    :class="{
                      'border-green-500 focus:ring-green-500':
                        validation.fullName.isValid && formData.fullName,
                      'border-red-500 focus:ring-red-500':
                        validation.fullName.message && formData.fullName,
                    }"
                    placeholder="Enter your full name"
                    @blur="validateField('fullName')"
                    @input="validateField('fullName')"
                  />
                  <div
                    v-if="validation.fullName.isValid && formData.fullName"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg
                      class="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      />
                    </svg>
                  </div>
                </div>
                <p
                  v-if="validation.fullName.message && formData.fullName"
                  class="text-sm text-red-600 dark:text-red-400"
                >
                  {{ validation.fullName.message }}
                </p>
              </div>

              <!-- Email -->
              <div class="space-y-2">
                <label
                  for="email"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email Address
                </label>
                <div class="relative">
                  <input
                    id="email"
                    v-model="formData.email"
                    type="email"
                    required
                    class="w-full px-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                    :class="{
                      'border-green-500 focus:ring-green-500':
                        validation.email.isValid && formData.email,
                      'border-red-500 focus:ring-red-500':
                        validation.email.message && formData.email,
                    }"
                    placeholder="Enter your email"
                    @blur="validateField('email')"
                    @input="validateField('email')"
                  />
                  <div
                    v-if="validation.email.isValid && formData.email"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg
                      class="w-5 h-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      />
                    </svg>
                  </div>
                </div>
                <p
                  v-if="validation.email.message && formData.email"
                  class="text-sm text-red-600 dark:text-red-400"
                >
                  {{ validation.email.message }}
                </p>
              </div>
            </form>

            <!-- Navigation -->
            <div class="flex gap-3 pt-4">
              <button
                @click="previousStep"
                class="flex-1 py-4 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
              <button
                @click="nextStep"
                :disabled="!canProceedToStep3"
                class="flex-1 py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Continue
              </button>
            </div>
          </div>

          <!-- Step 3: Password & Role -->
          <div v-if="currentStep === 3" class="p-6 space-y-6">
            <div class="text-center space-y-2">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                Almost there!
              </h2>
              <p class="text-gray-600 dark:text-gray-400">
                Set up your password and let us know how you'll use the app
              </p>
            </div>

            <form @submit.prevent="handleSignup" class="space-y-5">
              <!-- Password -->
              <div class="space-y-2">
                <label
                  for="password"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <div class="relative">
                  <input
                    id="password"
                    v-model="formData.password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                    class="w-full px-4 py-4 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg"
                    :class="{
                      'border-green-500 focus:ring-green-500':
                        passwordStrength.score >= 3 && formData.password,
                      'border-yellow-500 focus:ring-yellow-500':
                        passwordStrength.score === 2 && formData.password,
                      'border-red-500 focus:ring-red-500':
                        passwordStrength.score < 2 && formData.password,
                    }"
                    placeholder="Create a secure password"
                    @input="validatePassword"
                  />
                  <button
                    type="button"
                    @click="showPassword = !showPassword"
                    class="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg
                      v-if="showPassword"
                      class="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                    <svg
                      v-else
                      class="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Password Strength Indicator -->
                <div v-if="formData.password" class="space-y-2">
                  <div class="flex space-x-1">
                    <div
                      v-for="i in 4"
                      :key="i"
                      class="flex-1 h-2 rounded-full transition-all duration-300"
                      :class="{
                        'bg-red-500':
                          i <= passwordStrength.score &&
                          passwordStrength.score < 2,
                        'bg-yellow-500':
                          i <= passwordStrength.score &&
                          passwordStrength.score === 2,
                        'bg-green-500':
                          i <= passwordStrength.score &&
                          passwordStrength.score >= 3,
                        'bg-gray-200 dark:bg-gray-700':
                          i > passwordStrength.score,
                      }"
                    ></div>
                  </div>
                  <p class="text-sm" :class="passwordStrength.colorClass">
                    {{ passwordStrength.text }}
                  </p>
                </div>
              </div>

              <!-- Role Selection -->
              <div class="space-y-3">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  How will you use the app?
                </label>
                <div class="grid gap-3">
                  <label
                    class="relative flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    :class="{
                      'border-blue-500 bg-blue-50 dark:bg-blue-900/20':
                        formData.role === 'client',
                    }"
                  >
                    <input
                      v-model="formData.role"
                      type="radio"
                      value="client"
                      class="sr-only"
                    />
                    <div class="flex items-center space-x-3 flex-1">
                      <div
                        class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center"
                      >
                        <svg
                          class="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                      <div class="flex-1">
                        <h3 class="font-semibold text-gray-900 dark:text-white">
                          I need services
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Find and hire skilled professionals
                        </p>
                      </div>
                      <div
                        v-if="formData.role === 'client'"
                        class="w-6 h-6 text-blue-600"
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          />
                        </svg>
                      </div>
                    </div>
                  </label>

                  <label
                    class="relative flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    :class="{
                      'border-blue-500 bg-blue-50 dark:bg-blue-900/20':
                        formData.role === 'contractor',
                    }"
                  >
                    <input
                      v-model="formData.role"
                      type="radio"
                      value="contractor"
                      class="sr-only"
                    />
                    <div class="flex items-center space-x-3 flex-1">
                      <div
                        class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
                      >
                        <svg
                          class="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                          />
                        </svg>
                      </div>
                      <div class="flex-1">
                        <h3 class="font-semibold text-gray-900 dark:text-white">
                          I provide services
                        </h3>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                          Offer your skills and find work
                        </p>
                      </div>
                      <div
                        v-if="formData.role === 'contractor'"
                        class="w-6 h-6 text-blue-600"
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          />
                        </svg>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </form>

            <!-- Navigation -->
            <div class="flex gap-3 pt-4">
              <button
                @click="previousStep"
                class="flex-1 py-4 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
              <button
                @click="handleSignup"
                :disabled="!canCreateAccount || isLoading"
                class="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div
                  v-if="isLoading"
                  class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></div>
                <span>{{
                  isLoading ? 'Creating Account...' : 'Create Account'
                }}</span>
              </button>
            </div>
          </div>

          <!-- Step 4: Success -->
          <div v-if="currentStep === 4" class="p-6 space-y-6 text-center">
            <!-- Success Animation -->
            <div class="relative">
              <div
                class="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-bounce"
              >
                <svg
                  class="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="3"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <!-- Confetti effect -->
              <div
                class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4"
              >
                <div
                  class="w-2 h-2 bg-yellow-400 rounded-full animate-ping"
                ></div>
              </div>
              <div class="absolute top-2 right-8 transform">
                <div
                  class="w-1 h-1 bg-blue-400 rounded-full animate-ping animation-delay-200"
                ></div>
              </div>
              <div class="absolute top-6 left-8 transform">
                <div
                  class="w-1 h-1 bg-purple-400 rounded-full animate-ping animation-delay-500"
                ></div>
              </div>
            </div>

            <div class="space-y-4">
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome aboard! 🎉
              </h2>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                Your account has been created successfully.<br />
                Please check your email to verify your account and get started.
              </p>
            </div>

            <!-- Quick Tips -->
            <div
              class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 space-y-3"
            >
              <h3 class="font-semibold text-blue-900 dark:text-blue-100">
                While you wait...
              </h3>
              <ul
                class="space-y-2 text-sm text-blue-800 dark:text-blue-200 text-left"
              >
                <li class="flex items-center space-x-2">
                  <svg
                    class="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    />
                  </svg>
                  <span>Check your email (including spam folder)</span>
                </li>
                <li class="flex items-center space-x-2">
                  <svg
                    class="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    />
                  </svg>
                  <span>Complete your profile after verification</span>
                </li>
                <li class="flex items-center space-x-2">
                  <svg
                    class="w-4 h-4 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    />
                  </svg>
                  <span>{{
                    formData.role === 'client'
                      ? 'Post your first job'
                      : 'Browse available jobs'
                  }}</span>
                </li>
              </ul>
            </div>

            <!-- Action Buttons -->
            <div class="space-y-3 pt-4">
              <button
                @click="closeModal"
                class="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Got it!
              </button>
              <button
                @click="resendVerificationEmail"
                :disabled="isLoading"
                class="w-full py-3 px-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-medium"
              >
                Didn't receive email? Resend
              </button>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div
          v-if="error"
          class="sticky bottom-0 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 p-4 m-4 rounded-xl"
        >
          <div class="flex items-center">
            <svg
              class="w-5 h-5 text-red-500 dark:text-red-400 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-red-700 dark:text-red-300 text-sm">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useSupabaseAuth } from '@/composables/useSupabaseAuth';

// Props & Emits
const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'success']);

// Composables
const { signUp, getSupabaseClient } = useSupabaseAuth();
const supabase = getSupabaseClient();

// State
const showModal = ref(props.show);
const modalVisible = ref(false);
const currentStep = ref(1);
const totalSteps = ref(4);
const isLoading = ref(false);
const error = ref('');
const showPassword = ref(false);

// Form Data
const formData = ref({
  fullName: '',
  email: '',
  password: '',
  role: '',
});

// Validation
const validation = ref({
  fullName: { isValid: false, message: '' },
  email: { isValid: false, message: '' },
});

// Password Strength
const passwordStrength = ref({
  score: 0,
  text: '',
  colorClass: '',
});

// Computed Properties
const canProceedToStep3 = computed(() => {
  return (
    validation.value.fullName.isValid &&
    validation.value.email.isValid &&
    formData.value.fullName.trim() &&
    formData.value.email.trim()
  );
});

const canCreateAccount = computed(() => {
  return (
    canProceedToStep3.value &&
    formData.value.password.length >= 6 &&
    passwordStrength.value.score >= 2 &&
    formData.value.role
  );
});

// Methods
const validateField = (fieldName) => {
  switch (fieldName) {
    case 'fullName':
      const name = formData.value.fullName.trim();
      if (!name) {
        validation.value.fullName = {
          isValid: false,
          message: 'Name is required',
        };
      } else if (name.length < 2) {
        validation.value.fullName = {
          isValid: false,
          message: 'Name must be at least 2 characters',
        };
      } else if (!/^[a-zA-Z\s]+$/.test(name)) {
        validation.value.fullName = {
          isValid: false,
          message: 'Name can only contain letters and spaces',
        };
      } else {
        validation.value.fullName = { isValid: true, message: '' };
      }
      break;

    case 'email':
      const email = formData.value.email.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        validation.value.email = {
          isValid: false,
          message: 'Email is required',
        };
      } else if (!emailRegex.test(email)) {
        validation.value.email = {
          isValid: false,
          message: 'Please enter a valid email address',
        };
      } else {
        validation.value.email = { isValid: true, message: '' };
      }
      break;
  }
};

const validatePassword = () => {
  const password = formData.value.password;
  let score = 0;
  let feedback = '';

  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  switch (score) {
    case 0:
    case 1:
      feedback = 'Weak password';
      passwordStrength.value.colorClass = 'text-red-600 dark:text-red-400';
      break;
    case 2:
      feedback = 'Fair password';
      passwordStrength.value.colorClass =
        'text-yellow-600 dark:text-yellow-400';
      break;
    case 3:
      feedback = 'Good password';
      passwordStrength.value.colorClass = 'text-green-600 dark:text-green-400';
      break;
    case 4:
      feedback = 'Strong password';
      passwordStrength.value.colorClass = 'text-green-600 dark:text-green-400';
      break;
  }

  passwordStrength.value.score = score;
  passwordStrength.value.text = feedback;
};

const nextStep = () => {
  if (currentStep.value < totalSteps.value) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const handleGoogleSignup = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (googleError) {
      throw googleError;
    }

    // OAuth redirect will handle the rest
  } catch (err) {
    error.value = err.message || 'Failed to sign up with Google';
    console.error('Google signup error:', err);
  } finally {
    isLoading.value = false;
  }
};

const handleAppleSignup = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    // Apple Sign-In implementation would go here
    // For now, show a coming soon message
    error.value = 'Apple Sign-In coming soon! Please use email signup.';
  } catch (err) {
    error.value = err.message || 'Failed to sign up with Apple';
    console.error('Apple signup error:', err);
  } finally {
    isLoading.value = false;
  }
};

const handleSignup = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    const result = await signUp(formData.value.email, formData.value.password, {
      fullName: formData.value.fullName,
      role: formData.value.role,
    });

    if (result.success) {
      currentStep.value = 4; // Success step
      emit('success', {
        email: formData.value.email,
        role: formData.value.role,
      });
    } else {
      error.value = result.error || 'Failed to create account';
    }
  } catch (err) {
    error.value = 'An unexpected error occurred';
    console.error('Signup error:', err);
  } finally {
    isLoading.value = false;
  }
};

const resendVerificationEmail = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: formData.value.email,
    });

    if (resendError) {
      throw resendError;
    }

    // Show success feedback
    error.value = '';
  } catch (err) {
    error.value = err.message || 'Failed to resend verification email';
    console.error('Resend verification error:', err);
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  console.log('closeModal called, showModal.value:', showModal.value);
  console.trace('closeModal call stack');

  if (!showModal.value) {
    console.log('Modal already closed, returning');
    return; // Prevent double-close
  }

  console.log('Closing modal...');
  // Add closing animation
  modalVisible.value = false;
  setTimeout(() => {
    showModal.value = false;
    resetForm();
    emit('close');
  }, 300);
};

const resetForm = () => {
  currentStep.value = 1;
  formData.value = {
    fullName: '',
    email: '',
    password: '',
    role: '',
  };
  validation.value = {
    fullName: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
  };
  passwordStrength.value = {
    score: 0,
    text: '',
    colorClass: '',
  };
  showPassword.value = false;
  error.value = '';
  isLoading.value = false;
};

// Handle escape key
const handleEscape = (event) => {
  if (event.key === 'Escape' && showModal.value) {
    closeModal();
  }
};

// Watch for prop changes
watch(
  () => props.show,
  (newValue, oldValue) => {
    console.log('props.show changed:', { oldValue, newValue });
    if (newValue) {
      console.log('Opening modal...');
      showModal.value = true;
      setTimeout(() => {
        modalVisible.value = true;
        console.log('Modal animation started');
      }, 50);
    } else if (showModal.value) {
      console.log('Closing modal from watch...');
      // Only close if the modal was actually open
      closeModal();
    }
  }
);

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', handleEscape);
  // Initialize modal state based on props
  if (props.show) {
    showModal.value = true;
    setTimeout(() => {
      modalVisible.value = true;
    }, 50);
    document.body.style.overflow = 'hidden';
  }
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape);
  document.body.style.overflow = '';
});

// Watch modal visibility to control body scroll
watch(showModal, (newValue) => {
  if (newValue) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
/* Custom animations */
.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%,
  20%,
  53%,
  80%,
  100% {
    transform: translate3d(0, 0, 0);
  }
  40%,
  43% {
    transform: translate3d(0, -30px, 0);
  }
  70% {
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
}

.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-500 {
  animation-delay: 500ms;
}

/* Smooth transitions for step changes */
.step-transition {
  transition: all 0.3s ease-in-out;
}

/* Focus ring improvements for mobile */
@media (max-width: 640px) {
  input:focus,
  button:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }
}
</style>
