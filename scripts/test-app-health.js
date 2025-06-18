#!/usr/bin/env node

/**
 * APP HEALTH CHECK SCRIPT
 *
 * This script performs basic health checks on the application to ensure
 * the testing infrastructure can run properly.
 *
 * Usage:
 *   node scripts/test-app-health.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('🏥 Running App Health Check...\n');

// Health check results
const healthChecks = {
  environment: false,
  database: false,
  components: false,
  routes: false,
};

// Check 1: Environment Variables
console.log('1️⃣ Checking Environment Variables...');
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  console.log('   ✅ Supabase configuration found');
  healthChecks.environment = true;
} else {
  console.log('   ❌ Missing Supabase configuration');
  console.log(`   SUPABASE_URL: ${SUPABASE_URL ? 'Set' : 'Missing'}`);
  console.log(`   SUPABASE_KEY: ${SUPABASE_SERVICE_KEY ? 'Set' : 'Missing'}`);
}

// Check 2: Database Connection
console.log('\n2️⃣ Checking Database Connection...');
if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.log('   ⚠️  Database connection issue:', error.message);
    } else {
      console.log('   ✅ Database connection successful');
      healthChecks.database = true;
    }
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
  }
} else {
  console.log('   ⏭️  Skipping database check (no credentials)');
}

// Check 3: Critical Components
console.log('\n3️⃣ Checking Critical Components...');
const criticalFiles = [
  'src/views/JobDetailsView.vue',
  'src/views/CompleteProfileView.vue',
  'src/views/HomeView.vue',
  'src/components/onboarding/ValueFirstWelcome.vue',
  'src/components/onboarding/FilteredJobList.vue',
  'src/router/index.js',
];

let componentsOk = true;
for (const file of criticalFiles) {
  try {
    const fs = await import('fs/promises');
    await fs.access(file);
    console.log(`   ✅ ${file}`);
  } catch (error) {
    console.log(`   ❌ ${file} - Missing`);
    componentsOk = false;
  }
}

if (componentsOk) {
  healthChecks.components = true;
}

// Check 4: Testing Scripts
console.log('\n4️⃣ Checking Testing Scripts...');
const testingFiles = [
  'scripts/setup-onboarding-database.sql',
  'scripts/generate-onboarding-test-data.js',
  'scripts/benchmark-onboarding-performance.js',
  'scripts/validate-ab-testing.js',
  'docs/ONBOARDING_TESTING_GUIDE.md',
  'docs/MOBILE_TESTING_SETUP.md',
];

let testingOk = true;
for (const file of testingFiles) {
  try {
    const fs = await import('fs/promises');
    await fs.access(file);
    console.log(`   ✅ ${file}`);
  } catch (error) {
    console.log(`   ❌ ${file} - Missing`);
    testingOk = false;
  }
}

if (testingOk) {
  healthChecks.routes = true;
}

// Summary
console.log('\n📊 Health Check Summary:');
console.log('========================');

const totalChecks = Object.keys(healthChecks).length;
const passedChecks = Object.values(healthChecks).filter(Boolean).length;

Object.entries(healthChecks).forEach(([check, passed]) => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const checkName = check.charAt(0).toUpperCase() + check.slice(1);
  console.log(`   ${checkName}: ${status}`);
});

console.log(`\nOverall Health: ${passedChecks}/${totalChecks} checks passed`);

if (passedChecks === totalChecks) {
  console.log('🎉 All health checks passed! Ready for testing.');
} else {
  console.log(
    '⚠️  Some health checks failed. Please address the issues above.'
  );
}

// Recommendations
console.log('\n💡 Next Steps:');
if (!healthChecks.environment) {
  console.log('   1. Set up Supabase environment variables in .env file');
}
if (!healthChecks.database) {
  console.log(
    '   2. Run database setup: psql -d your_database -f scripts/setup-onboarding-database.sql'
  );
}
if (!healthChecks.components) {
  console.log('   3. Ensure all critical Vue components are present');
}
if (!healthChecks.routes) {
  console.log('   4. Verify all testing scripts are in place');
}

if (passedChecks === totalChecks) {
  console.log('   🚀 Start testing: npm run test:all');
}

console.log('\n📚 Documentation:');
console.log('   - Testing Guide: docs/ONBOARDING_TESTING_GUIDE.md');
console.log('   - Mobile Testing: docs/MOBILE_TESTING_SETUP.md');
console.log('   - Main README: README_TESTING.md');

// Exit with appropriate code
process.exit(passedChecks === totalChecks ? 0 : 1);
