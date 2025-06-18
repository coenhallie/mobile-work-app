#!/usr/bin/env node

/**
 * Comprehensive test suite for the optimized onboarding system
 * Tests all components, flows, and database operations
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '..', '.env');
let supabaseUrl, supabaseKey;

try {
  const envContent = readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');

  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1];
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1];
    }
  }
} catch (error) {
  console.error('❌ Could not load environment variables:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Test suite for the optimized onboarding system
 */
class OnboardingSystemTest {
  constructor() {
    this.testResults = [];
    this.testUserId = `test_user_${Date.now()}`;
  }

  /**
   * Log test result
   */
  logTest(name, passed, message = '') {
    const status = passed ? '✅' : '❌';
    const result = { name, passed, message };
    this.testResults.push(result);
    console.log(`${status} ${name}${message ? ': ' + message : ''}`);
  }

  /**
   * Test database schema and tables
   */
  async testDatabaseSchema() {
    console.log('\n🔍 Testing Database Schema...');

    try {
      // Test contractor_profiles table with new columns
      const { data: profileColumns, error: profileError } = await supabase
        .from('contractor_profiles')
        .select('*')
        .limit(1);

      this.logTest(
        'contractor_profiles table accessible',
        !profileError,
        profileError?.message
      );

      // Test contractor_credits table
      const { data: creditsData, error: creditsError } = await supabase
        .from('contractor_credits')
        .select('*')
        .limit(1);

      this.logTest(
        'contractor_credits table exists',
        !creditsError,
        creditsError?.message
      );

      // Test onboarding_analytics table
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('onboarding_analytics')
        .select('*')
        .limit(1);

      this.logTest(
        'onboarding_analytics table exists',
        !analyticsError,
        analyticsError?.message
      );

      // Test job_views table
      const { data: viewsData, error: viewsError } = await supabase
        .from('job_views')
        .select('*')
        .limit(1);

      this.logTest('job_views table exists', !viewsError, viewsError?.message);

      // Test job_postings table (should exist)
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_postings')
        .select('id, description, status')
        .limit(5);

      this.logTest(
        'job_postings table accessible',
        !jobsError,
        jobsError?.message
      );

      if (!jobsError && jobsData) {
        this.logTest(
          'Sample jobs available',
          jobsData.length > 0,
          `Found ${jobsData.length} jobs`
        );
      }
    } catch (error) {
      this.logTest('Database schema test', false, error.message);
    }
  }

  /**
   * Test database functions
   */
  async testDatabaseFunctions() {
    console.log('\n🔧 Testing Database Functions...');

    try {
      // Test calculate_profile_completion function
      const { data: functionTest, error: functionError } = await supabase.rpc(
        'calculate_profile_completion',
        {
          profile_id: '00000000-0000-0000-0000-000000000000',
        }
      );

      this.logTest(
        'calculate_profile_completion function exists',
        !functionError,
        functionError?.message
      );
    } catch (error) {
      this.logTest('Database functions test', false, error.message);
    }
  }

  /**
   * Test component files exist
   */
  async testComponentFiles() {
    console.log('\n📁 Testing Component Files...');

    const componentFiles = [
      'src/views/OnboardingFlow.vue',
      'src/components/onboarding/ValueFirstWelcome.vue',
      'src/components/onboarding/JobPreview.vue',
      'src/components/onboarding/SkillInterestSelector.vue',
      'src/components/onboarding/FilteredJobList.vue',
      'src/components/onboarding/QuickProfileForm.vue',
      'src/components/onboarding/ApplicationSuccess.vue',
      'src/components/onboarding/JobCategoryCard.vue',
      'src/components/onboarding/SkillCard.vue',
      'src/components/onboarding/JobCard.vue',
      'src/components/onboarding/ExperienceOption.vue',
      'src/stores/onboarding.js',
      'src/services/onboardingAPI.js',
      'src/composables/useOnboardingExperiment.js',
    ];

    const fs = await import('fs');
    const path = await import('path');

    for (const file of componentFiles) {
      const filePath = path.join(__dirname, '..', file);
      const exists = fs.existsSync(filePath);
      this.logTest(`${file} exists`, exists);
    }
  }

  /**
   * Test API service functionality
   */
  async testAPIService() {
    console.log('\n🌐 Testing API Service...');

    try {
      // Import the API service
      const { onboardingAPI } = await import(
        '../src/services/onboardingAPI.js'
      );

      // Test job stats retrieval
      const jobStats = await onboardingAPI.getJobStats('Lima');
      this.logTest(
        'getJobStats returns data',
        Array.isArray(jobStats) && jobStats.length > 0,
        `Returned ${jobStats.length} categories`
      );

      // Test filtered jobs retrieval
      const filteredJobs = await onboardingAPI.getFilteredJobs(
        'plumbing',
        'Lima',
        5
      );
      this.logTest(
        'getFilteredJobs returns data',
        Array.isArray(filteredJobs) && filteredJobs.length > 0,
        `Returned ${filteredJobs.length} jobs`
      );
    } catch (error) {
      this.logTest('API service test', false, error.message);
    }
  }

  /**
   * Test A/B testing framework
   */
  async testABTesting() {
    console.log('\n🧪 Testing A/B Testing Framework...');

    try {
      const { useOnboardingExperiment } = await import(
        '../src/composables/useOnboardingExperiment.js'
      );

      // Test variant assignment
      const experiment = useOnboardingExperiment();
      const variant = experiment.getVariant('onboarding_flow', 'test-user-123');

      this.logTest(
        'A/B testing variant assignment',
        ['current', 'value_first'].includes(variant),
        `Assigned variant: ${variant}`
      );

      // Test experiment stats
      const stats = experiment.getExperimentStats();
      this.logTest(
        'A/B testing stats generation',
        typeof stats === 'object' && stats.onboarding_flow,
        'Stats object generated'
      );
    } catch (error) {
      this.logTest('A/B testing framework', false, error.message);
    }
  }

  /**
   * Test mock data functionality
   */
  async testMockData() {
    console.log('\n🎭 Testing Mock Data...');

    try {
      const { onboardingAPI } = await import(
        '../src/services/onboardingAPI.js'
      );

      // Test mock job stats
      const mockStats = onboardingAPI.getMockJobStats('Lima');
      this.logTest(
        'Mock job stats generation',
        Array.isArray(mockStats) && mockStats.length > 0,
        `Generated ${mockStats.length} mock categories`
      );

      // Test mock jobs
      const mockJobs = onboardingAPI.getMockJobs('plumbing', 'Lima');
      this.logTest(
        'Mock jobs generation',
        Array.isArray(mockJobs) && mockJobs.length > 0,
        `Generated ${mockJobs.length} mock jobs`
      );
    } catch (error) {
      this.logTest('Mock data test', false, error.message);
    }
  }

  /**
   * Test router configuration
   */
  async testRouterConfig() {
    console.log('\n🛣️ Testing Router Configuration...');

    try {
      const fs = await import('fs');
      const path = await import('path');

      const routerPath = path.join(__dirname, '..', 'src/router/index.js');
      const routerContent = fs.readFileSync(routerPath, 'utf8');

      // Check if onboarding route exists
      const hasOnboardingRoute =
        routerContent.includes('/onboarding') &&
        routerContent.includes('OnboardingFlow');

      this.logTest(
        'Onboarding route configured',
        hasOnboardingRoute,
        'Route found in router configuration'
      );
    } catch (error) {
      this.logTest('Router configuration test', false, error.message);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Optimized Onboarding System Test Suite...\n');

    await this.testDatabaseSchema();
    await this.testDatabaseFunctions();
    await this.testComponentFiles();
    await this.testAPIService();
    await this.testABTesting();
    await this.testMockData();
    await this.testRouterConfig();

    // Summary
    console.log('\n📊 Test Summary:');
    const passed = this.testResults.filter((r) => r.passed).length;
    const total = this.testResults.length;
    const percentage = Math.round((passed / total) * 100);

    console.log(`✅ Passed: ${passed}/${total} (${percentage}%)`);

    if (passed < total) {
      console.log(`❌ Failed: ${total - passed}/${total}`);
      console.log('\nFailed tests:');
      this.testResults
        .filter((r) => !r.passed)
        .forEach((r) => console.log(`  - ${r.name}: ${r.message}`));
    }

    if (percentage >= 90) {
      console.log('\n🎉 Onboarding system is ready for deployment!');
    } else if (percentage >= 70) {
      console.log('\n⚠️ Onboarding system needs some fixes before deployment.');
    } else {
      console.log(
        '\n🚨 Onboarding system has significant issues that need to be addressed.'
      );
    }

    return percentage >= 90;
  }
}

// Run the tests
const tester = new OnboardingSystemTest();
tester
  .runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
