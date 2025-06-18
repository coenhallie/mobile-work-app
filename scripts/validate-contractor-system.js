#!/usr/bin/env node

/**
 * Contractor System Validation Script
 * Tests database schema consistency and component integration
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables');
  console.log(
    'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Starting Contractor System Validation...\n');

// Test 1: Database Schema Validation
async function testDatabaseSchema() {
  console.log('📊 Testing Database Schema...');

  try {
    // Test if service_areas field exists and works with overlaps()
    const { data: schemaTest, error: schemaError } = await supabase
      .from('contractor_profiles')
      .select('id, service_areas, skills, average_rating')
      .eq('role', 'contractor')
      .limit(1);

    if (schemaError) {
      console.error('❌ Database schema error:', schemaError.message);
      return false;
    }

    if (schemaTest && schemaTest.length > 0) {
      const contractor = schemaTest[0];
      console.log('✅ service_areas field exists:', !!contractor.service_areas);
      console.log('✅ skills field exists:', !!contractor.skills);
      console.log(
        '✅ average_rating field exists:',
        !!contractor.average_rating
      );
    }

    // Test overlaps() function with service_areas
    const { data: overlapTest, error: overlapError } = await supabase
      .from('contractor_profiles')
      .select('id')
      .eq('role', 'contractor')
      .overlaps('service_areas', ['Lima'])
      .limit(1);

    if (overlapError) {
      console.error('❌ overlaps() function error:', overlapError.message);
      return false;
    }

    console.log('✅ overlaps() function works with service_areas');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

// Test 2: Check for deprecated field references
function testDeprecatedFields() {
  console.log('\n🔍 Checking for deprecated field references...');

  const deprecatedFields = ['availability', 'district'];
  const issues = [];

  // Check key files for deprecated field usage
  const filesToCheck = [
    'src/composables/useContractorData.js',
    'src/views/ContractorListView.vue',
    'src/components/contractors/ContractorCard.vue',
    'src/components/filters/FilterPresets.vue',
    'src/components/filters/SearchInput.vue',
  ];

  filesToCheck.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');

      deprecatedFields.forEach((field) => {
        if (
          content.includes(field) &&
          !content.includes(`// TODO: Remove ${field}`)
        ) {
          issues.push(
            `${filePath} contains reference to deprecated field: ${field}`
          );
        }
      });
    }
  });

  if (issues.length > 0) {
    console.log('❌ Found deprecated field references:');
    issues.forEach((issue) => console.log(`   - ${issue}`));
    return false;
  } else {
    console.log('✅ No deprecated field references found in key files');
    return true;
  }
}

// Test 3: Component Import Validation
function testComponentImports() {
  console.log('\n📦 Validating component imports...');

  const contractorListView = 'src/views/ContractorListView.vue';

  if (!fs.existsSync(contractorListView)) {
    console.error('❌ ContractorListView.vue not found');
    return false;
  }

  const content = fs.readFileSync(contractorListView, 'utf8');

  // Check if ContractorCard import path is correct
  const contractorCardImport = content.match(
    /import ContractorCard from ['"]([^'"]+)['"]/
  );

  if (contractorCardImport) {
    const importPath = contractorCardImport[1];
    const resolvedPath = path.resolve(
      'src/views',
      importPath.replace('@/', 'src/')
    );

    if (fs.existsSync(resolvedPath + '.vue')) {
      console.log('✅ ContractorCard import path is valid');
      return true;
    } else {
      console.error('❌ ContractorCard import path is invalid:', importPath);
      return false;
    }
  } else {
    console.error('❌ ContractorCard import not found');
    return false;
  }
}

// Test 4: Performance Configuration Check
function testPerformanceConfig() {
  console.log('\n⚡ Checking performance configuration...');

  const useContractorData = 'src/composables/useContractorData.js';

  if (!fs.existsSync(useContractorData)) {
    console.error('❌ useContractorData.js not found');
    return false;
  }

  const content = fs.readFileSync(useContractorData, 'utf8');

  const checks = [
    { name: 'Cache implementation', pattern: /cache.*=.*new Map\(\)/ },
    { name: 'Cache timeout', pattern: /cacheTimeout.*=.*\d+/ },
    { name: 'Pagination', pattern: /pageSize.*=.*\d+/ },
    { name: 'overlaps() usage', pattern: /\.overlaps\(/ },
  ];

  let allPassed = true;

  checks.forEach((check) => {
    if (check.pattern.test(content)) {
      console.log(`✅ ${check.name} found`);
    } else {
      console.log(`❌ ${check.name} missing`);
      allPassed = false;
    }
  });

  return allPassed;
}

// Main validation function
async function runValidation() {
  const results = {
    databaseSchema: await testDatabaseSchema(),
    deprecatedFields: testDeprecatedFields(),
    componentImports: testComponentImports(),
    performanceConfig: testPerformanceConfig(),
  };

  console.log('\n📋 Validation Summary:');
  console.log('='.repeat(50));

  Object.entries(results).forEach(([test, passed]) => {
    console.log(
      `${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`
    );
  });

  const allPassed = Object.values(results).every((result) => result);

  console.log('\n' + '='.repeat(50));
  console.log(
    `Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`
  );

  if (!allPassed) {
    console.log('\n🔧 Recommended Actions:');
    if (!results.databaseSchema) {
      console.log(
        '1. Check database schema and ensure service_areas field exists'
      );
      console.log('2. Verify overlaps() function is supported');
    }
    if (!results.deprecatedFields) {
      console.log(
        '3. Remove references to deprecated availability and district fields'
      );
    }
    if (!results.componentImports) {
      console.log('4. Fix component import paths');
    }
    if (!results.performanceConfig) {
      console.log('5. Verify performance optimizations are in place');
    }
  }

  return allPassed;
}

// Run the validation
runValidation()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Validation failed with error:', error);
    process.exit(1);
  });
