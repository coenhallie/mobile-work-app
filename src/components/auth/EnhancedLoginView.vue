<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4"
  >
    <div class="w-full max-w-md">
      <!-- Main Login Card -->
      <div
        class="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-gray-700/30"
      >
        <!-- Header with Enhanced Icon -->
        <div class="text-center mb-8">
          <div
            class="w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl relative overflow-hidden"
          >
            <!-- Animated background -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 animate-pulse opacity-50"
            ></div>
            <svg
              class="w-12 h-12 text-white relative z-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>

          <h1
            class="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-3"
          >
            Welcome Back
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-lg">
            Sign in to continue your journey
          </p>
        </div>

        <!-- Trust Indicators -->
        <div
          class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4 mb-6"
        >
          <div class="flex items-center justify-center space-x-6 text-sm">
            <div
              class="flex items-center space-x-2 text-blue-600 dark:text-blue-400"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                />
              </svg>
              <span class="font-medium">Secure Login</span>
            </div>
            <div
              class="flex items-center space-x-2 text-green-600 dark:text-green-400"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="font-medium">Trusted Platform</span>
            </div>
          </div>
        </div>

        <!-- Auth Method Toggle -->
        <div
          class="flex mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1.5 shadow-inner"
        >
          <button
            @click="switchAuthMethod('email')"
            :class="[
              'flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 transform',
              authMethod === 'email'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-lg scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:scale-102',
            ]"
          >
            <svg
              class="w-4 h-4 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
            Email
          </button>
          <button
            @click="switchAuthMethod('phone')"
            :class="[
              'flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 transform',
              authMethod === 'phone'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-lg scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:scale-102',
            ]"
          >
            <svg
              class="w-4 h-4 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            Phone
          </button>
        </div>

        <!-- Email Login Form -->
        <form
          v-if="authMethod === 'email'"
          @submit.prevent="handleEmailLogin"
          class="space-y-6"
        >
          <div class="space-y-2">
            <label
              for="email"
              class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>
            <div class="relative group">
              <div
                class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
              >
                <svg
                  class="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                id="email"
                v-model="emailForm.email"
                type="email"
                required
                class="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg"
                placeholder="Enter your email"
                :disabled="isLoading"
                @focus="clearMessages"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label
              for="password"
              class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <div class="relative group">
              <div
                class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
              >
                <svg
                  class="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <input
                id="password"
                v-model="emailForm.password"
                :type="showPassword ? 'text' : 'password'"
                required
                class="w-full pl-12 pr-16 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg"
                placeholder="Enter your password"
                :disabled="isLoading"
                @focus="clearMessages"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center hover:scale-110 transition-transform"
                :disabled="isLoading"
              >
                <svg
                  v-if="showPassword"
                  class="w-5 h-5 text-gray-400 hover:text-gray-600"
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
                  class="w-5 h-5 text-gray-400 hover:text-gray-600"
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
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <label class="flex items-center space-x-3 cursor-pointer">
              <input
                v-model="rememberMe"
                type="checkbox"
                class="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400"
                >Remember me</span
              >
            </label>
            <button
              type="button"
              @click="showForgotPassword = true"
              class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            :disabled="isLoading || !emailForm.email || !emailForm.password"
            class="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] text-lg"
          >
            <div
              v-if="isLoading"
              class="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <svg
              v-else
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            </svg>
            <span>{{ isLoading ? 'Signing In...' : 'Sign In' }}</span>
          </button>
        </form>

        <!-- Phone Login Form -->
        <div v-if="authMethod === 'phone'" class="space-y-6">
          <!-- Phone Number Input -->
          <div v-if="!phoneOtpSent" class="space-y-4">
            <label
              class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Phone Number
            </label>
            <div class="flex gap-3">
              <select
                v-model="phoneForm.countryCode"
                class="px-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 font-medium"
                :disabled="isLoading"
              >
                <option value="+51">🇵🇪 +51</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+52">🇲🇽 +52</option>
              </select>
              <div class="relative flex-1 group">
                <div
                  class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
                >
                  <svg
                    class="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <input
                  id="phone"
                  v-model="phoneForm.number"
                  type="tel"
                  required
                  class="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg"
                  placeholder="Enter your phone number"
                  :disabled="isLoading"
                  @focus="clearMessages"
                />
              </div>
            </div>
            <button
              @click="sendPhoneOtp"
              :disabled="isLoading || !phoneForm.number"
              class="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] text-lg"
            >
              <div
                v-if="isLoading"
                class="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"
              ></div>
              <svg
                v-else
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              <span>{{
                isLoading ? 'Sending Code...' : 'Send Verification Code'
              }}</span>
            </button>
          </div>

          <!-- OTP Verification -->
          <div v-else class="space-y-4">
            <div class="text-center space-y-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                Verification Code
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Enter the 6-digit code sent to {{ phoneForm.countryCode
                }}{{ phoneForm.number }}
              </p>
            </div>

            <div class="relative">
              <input
                id="otp"
                v-model="phoneForm.otp"
                type="text"
                maxlength="6"
                required
                class="w-full px-6 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
                :disabled="isLoading"
                @focus="clearMessages"
              />
            </div>

            <div class="flex gap-3">
              <button
                @click="verifyPhoneOtp"
                :disabled="isLoading || phoneForm.otp.length !== 6"
                class="flex-1 flex items-center justify-center gap-2 py-4 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div
                  v-if="isLoading"
                  class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                ></div>
                <span>{{ isLoading ? 'Verifying...' : 'Verify' }}</span>
              </button>
              <button
                @click="
                  phoneOtpSent = false;
                  phoneForm.otp = '';
                "
                :disabled="isLoading"
                class="px-6 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Back
              </button>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="relative my-8">
          <div class="absolute inset-0 flex items-center">
            <div
              class="w-full border-t-2 border-gray-200 dark:border-gray-600"
            ></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span
              class="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 font-medium"
            >
              or continue with
            </span>
          </div>
        </div>

        <!-- Social Login -->
        <div class="space-y-4">
          <button
            @click="handleGoogleLogin"
            :disabled="isLoading"
            class="w-full flex items-center justify-center gap-4 py-4 px-6 border-2 border-gray-200 dark:border-gray-600 rounded-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] group"
          >
            <svg
              class="w-6 h-6 group-hover:scale-110 transition-transform"
              viewBox="0 0 24 24"
            >
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
            @click="handleAppleLogin"
            :disabled="isLoading"
            class="w-full flex items-center justify-center gap-4 py-4 px-6 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] group disabled:opacity-50"
          >
            <svg
              class="w-6 h-6 group-hover:scale-110 transition-transform"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
              />
            </svg>
            <span>Continue with Apple</span>
          </button>
        </div>

        <!-- Footer Links -->
        <div class="mt-8 space-y-4 text-center">
          <button
            @click="showEnhancedSignUp = true"
            class="w-full py-3 px-4 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-semibold text-lg"
            :disabled="isLoading"
          >
            Don't have an account?
            <span class="underline decoration-2 underline-offset-4"
              >Sign up</span
            >
          </button>

          <!-- Terms -->
          <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            By signing in, you agree to our
            <a
              href="#"
              class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >Terms of Service</a
            >
            and
            <a
              href="#"
              class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >Privacy Policy</a
            >
          </p>
        </div>
      </div>

      <!-- Success Message -->
      <div
        v-if="successMessage"
        class="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800 rounded-2xl p-4 shadow-lg"
      >
        <div class="flex items-center">
          <svg
            class="w-6 h-6 text-green-500 dark:text-green-400 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2.5"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <p class="text-green-700 dark:text-green-300 font-medium">
            {{ successMessage }}
          </p>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="mt-6 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl p-4 shadow-lg"
      >
        <div class="flex items-center">
          <svg
            class="w-6 h-6 text-red-500 dark:text-red-400 mr-3"
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
          <p class="text-red-700 dark:text-red-300 font-medium">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Enhanced Sign Up Modal -->
    <EnhancedSignupModal
      :show="showEnhancedSignUp"
      @close="showEnhancedSignUp = false"
      @success="handleSignUpSuccess"
    />

    <!-- Forgot Password Modal -->
    <div
      v-if="showForgotPassword"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      @click.self="showForgotPassword = false"
    >
      <div
        class="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/20 dark:border-gray-700/30 transform transition-all duration-300"
      >
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white">
            Reset Password
          </h3>
          <button
            @click="showForgotPassword = false"
            class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg
              class="w-6 h-6 text-gray-400"
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
        </div>

        <form @submit.prevent="handleForgotPassword" class="space-y-6">
          <div class="space-y-2">
            <label
              for="resetEmail"
              class="block text-sm font-semibold text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>
            <div class="relative group">
              <div
                class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"
              >
                <svg
                  class="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
              <input
                id="resetEmail"
                v-model="resetEmail"
                type="email"
                required
                class="w-full pl-12 pr-4 py-4 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300"
                placeholder="Enter your email"
                :disabled="isLoading"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading || !resetEmail"
            class="w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div
              v-if="isLoading"
              class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
            ></div>
            <span>{{ isLoading ? 'Sending...' : 'Send Reset Link' }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSupabaseAuth } from '@/composables/useSupabaseAuth';
import EnhancedSignupModal from '@/components/auth/EnhancedSignupModal.vue';

const router = useRouter();
const route = useRoute();
const { signIn, resetPassword, getSupabaseClient } = useSupabaseAuth();

// Get Supabase client for phone auth
const supabase = getSupabaseClient();

// Component state
const authMethod = ref('email');
const isLoading = ref(false);
const error = ref('');
const successMessage = ref('');
const showPassword = ref(false);
const showEnhancedSignUp = ref(false);
const showForgotPassword = ref(false);
const phoneOtpSent = ref(false);
const rememberMe = ref(false);

// Form data
const emailForm = ref({
  email: '',
  password: '',
});

const phoneForm = ref({
  countryCode: '+51',
  number: '',
  otp: '',
});

const resetEmail = ref('');

// Clear messages
const clearMessages = () => {
  error.value = '';
  successMessage.value = '';
};

// Email login
const handleEmailLogin = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    const result = await signIn(
      emailForm.value.email,
      emailForm.value.password
    );

    if (result.success) {
      successMessage.value = 'Successfully signed in!';
      // Redirect will be handled by router guard
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } else {
      error.value = result.error || 'Failed to sign in';
    }
  } catch (err) {
    error.value = 'An unexpected error occurred';
    console.error('Email login error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Phone OTP - Send
const sendPhoneOtp = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    const fullPhoneNumber =
      phoneForm.value.countryCode + phoneForm.value.number;

    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: fullPhoneNumber,
    });

    if (otpError) {
      throw otpError;
    }

    phoneOtpSent.value = true;
    successMessage.value = 'Verification code sent to your phone!';
  } catch (err) {
    error.value = err.message || 'Failed to send verification code';
    console.error('Phone OTP send error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Phone OTP - Verify
const verifyPhoneOtp = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    const fullPhoneNumber =
      phoneForm.value.countryCode + phoneForm.value.number;

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone: fullPhoneNumber,
      token: phoneForm.value.otp,
      type: 'sms',
    });

    if (verifyError) {
      throw verifyError;
    }

    if (data.user) {
      successMessage.value = 'Successfully signed in!';
      setTimeout(() => {
        router.push('/');
      }, 1000);
    }
  } catch (err) {
    error.value = err.message || 'Invalid verification code';
    console.error('Phone OTP verify error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Google login
const handleGoogleLogin = async () => {
  clearMessages();
  isLoading.value = true;

  try {
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
    error.value = err.message || 'Failed to sign in with Google';
    console.error('Google login error:', err);
    isLoading.value = false;
  }
};

// Apple login
const handleAppleLogin = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    // Apple Sign-In implementation would go here
    error.value = 'Apple Sign-In coming soon! Please use email or Google.';
  } catch (err) {
    error.value = err.message || 'Failed to sign in with Apple';
    console.error('Apple login error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Forgot password
const handleForgotPassword = async () => {
  clearMessages();
  isLoading.value = true;

  try {
    const result = await resetPassword(resetEmail.value);

    if (result.success) {
      successMessage.value = 'Password reset link sent to your email!';
      showForgotPassword.value = false;
      resetEmail.value = '';
    } else {
      error.value = result.error || 'Failed to send reset email';
    }
  } catch (err) {
    error.value = 'An unexpected error occurred';
    console.error('Forgot password error:', err);
  } finally {
    isLoading.value = false;
  }
};

// Handle enhanced signup success
const handleSignUpSuccess = (data) => {
  successMessage.value = `Account created successfully! Please check your email (${data.email}) to verify your account.`;
  showEnhancedSignUp.value = false;
};

// Reset forms when switching auth methods
const resetForms = () => {
  emailForm.value = { email: '', password: '' };
  phoneForm.value = { countryCode: '+51', number: '', otp: '' };
  phoneOtpSent.value = false;
  clearMessages();
};

// Switch auth method
const switchAuthMethod = (method) => {
  authMethod.value = method;
  resetForms();
};

onMounted(() => {
  clearMessages();

  // Check if we should open sign-up modal directly
  if (route.query.signup === 'true') {
    showEnhancedSignUp.value = true;
    // Clear the query parameter to clean up the URL
    router.replace({ path: '/login' });
  }
});

// Watch for route changes to handle direct navigation to signup
watch(
  () => route.query.signup,
  (newValue) => {
    if (newValue === 'true') {
      showEnhancedSignUp.value = true;
      // Clear the query parameter to clean up the URL
      router.replace({ path: '/login' });
    }
  }
);
</script>

<style scoped>
/* Custom glassmorphism effects */
.backdrop-blur-xl {
  backdrop-filter: blur(16px);
}

/* Enhanced focus states for better accessibility */
@media (max-width: 640px) {
  input:focus,
  button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
  }
}

/* Custom animations */
@keyframes pulse-gentle {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse {
  animation: pulse-gentle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Gradient text effects */
.bg-clip-text {
  -webkit-background-clip: text;
  background-clip: text;
}

/* Enhanced hover effects */
.transform {
  transition: transform 0.2s ease;
}

.hover\:scale-\[1\.02\]:hover {
  transform: scale(1.02);
}

.active\:scale-\[0\.98\]:active {
  transform: scale(0.98);
}

.hover\:scale-102:hover {
  transform: scale(1.02);
}

.hover\:scale-110:hover {
  transform: scale(1.1);
}
</style>
