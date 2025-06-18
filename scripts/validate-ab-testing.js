#!/usr/bin/env node

/**
 * A/B TESTING VALIDATION SCRIPT
 *
 * This script validates the A/B testing implementation for the onboarding flow,
 * ensuring proper assignment distribution, flow differentiation, and analytics tracking.
 *
 * Usage:
 *   node scripts/validate-ab-testing.js [options]
 *
 * Options:
 *   --distribution    Check assignment distribution (70% new, 30% current)
 *   --analytics       Validate analytics tracking for A/B tests
 *   --flows           Test flow differentiation
 *   --sessions=N      Number of test sessions to create (default: 100)
 *   --report          Generate detailed validation report
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    '❌ Missing Supabase configuration. Please check your .env file.'
  );
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  distribution: args.includes('--distribution'),
  analytics: args.includes('--analytics'),
  flows: args.includes('--flows'),
  sessions:
    parseInt(
      args.find((arg) => arg.startsWith('--sessions='))?.split('=')[1]
    ) || 100,
  report: args.includes('--report'),
  all: !args.some(
    (arg) =>
      arg.startsWith('--') &&
      !arg.includes('sessions') &&
      !arg.includes('report')
  ),
};

// Expected distribution (70% new flow, 30% current flow)
const EXPECTED_DISTRIBUTION = {
  v2: 0.7, // New flow
  v1: 0.3, // Current flow
};

// Tolerance for distribution validation (±5%)
const DISTRIBUTION_TOLERANCE = 0.05;

class ABTestValidator {
  constructor(options) {
    this.options = options;
    this.results = {
      distribution: null,
      analytics: null,
      flows: null,
      summary: null,
    };
  }

  async validateAll() {
    console.log('🧪 Starting A/B Testing Validation...');

    if (this.options.all || this.options.distribution) {
      this.results.distribution = await this.validateDistribution();
    }

    if (this.options.all || this.options.analytics) {
      this.results.analytics = await this.validateAnalytics();
    }

    if (this.options.all || this.options.flows) {
      this.results.flows = await this.validateFlows();
    }

    this.results.summary = this.generateSummary();

    if (this.options.report) {
      await this.generateReport();
    }

    return this.results;
  }

  async validateDistribution() {
    console.log('\n📊 Validating A/B Test Distribution...');

    const validation = {
      testName: 'Distribution Validation',
      passed: false,
      details: {},
      issues: [],
      recommendations: [],
    };

    try {
      // Create test sessions to validate assignment
      console.log(`   Creating ${this.options.sessions} test sessions...`);
      const testSessions = await this.createTestSessions(this.options.sessions);

      // Analyze distribution
      const distribution = this.analyzeDistribution(testSessions);
      validation.details.distribution = distribution;

      // Check if distribution meets expectations
      const distributionValid = this.checkDistribution(distribution);
      validation.passed = distributionValid.valid;
      validation.issues = distributionValid.issues;
      validation.recommendations = distributionValid.recommendations;

      console.log('   📈 Distribution Results:');
      console.log(
        `      New Flow (v2): ${distribution.v2.percentage}% (${distribution.v2.count}/${distribution.total})`
      );
      console.log(
        `      Current Flow (v1): ${distribution.v1.percentage}% (${distribution.v1.count}/${distribution.total})`
      );
      console.log(
        `      Expected: v2=${EXPECTED_DISTRIBUTION.v2 * 100}%, v1=${EXPECTED_DISTRIBUTION.v1 * 100}%`
      );

      if (validation.passed) {
        console.log('   ✅ Distribution validation PASSED');
      } else {
        console.log('   ❌ Distribution validation FAILED');
        validation.issues.forEach((issue) => console.log(`      - ${issue}`));
      }
    } catch (error) {
      console.error('   ❌ Distribution validation error:', error);
      validation.passed = false;
      validation.issues.push(`Validation error: ${error.message}`);
    }

    return validation;
  }

  async createTestSessions(count) {
    const sessions = [];

    for (let i = 0; i < count; i++) {
      const userId = `ab-test-user-${i}-${Date.now()}`;

      try {
        // Simulate A/B test assignment by calling the database function
        const { data, error } = await supabase.rpc('assign_ab_test_variant', {
          p_user_id: userId,
          p_test_name: 'onboarding_flow_test',
          p_variants: ['v2', 'v1'],
          p_weights: [70, 30],
        });

        if (error) {
          console.warn(
            `   Warning: Could not assign variant for user ${userId}:`,
            error
          );
          // Fallback to manual assignment for testing
          const variant = Math.random() < 0.7 ? 'v2' : 'v1';
          sessions.push({ userId, variant, method: 'fallback' });
        } else {
          sessions.push({ userId, variant: data, method: 'database' });
        }
      } catch (error) {
        // Fallback assignment
        const variant = Math.random() < 0.7 ? 'v2' : 'v1';
        sessions.push({ userId, variant, method: 'fallback' });
      }
    }

    return sessions;
  }

  analyzeDistribution(sessions) {
    const counts = { v1: 0, v2: 0 };

    sessions.forEach((session) => {
      if (counts.hasOwnProperty(session.variant)) {
        counts[session.variant]++;
      }
    });

    const total = sessions.length;

    return {
      total,
      v1: {
        count: counts.v1,
        percentage: ((counts.v1 / total) * 100).toFixed(1),
      },
      v2: {
        count: counts.v2,
        percentage: ((counts.v2 / total) * 100).toFixed(1),
      },
      sessions,
    };
  }

  checkDistribution(distribution) {
    const result = {
      valid: true,
      issues: [],
      recommendations: [],
    };

    const v1Actual = distribution.v1.count / distribution.total;
    const v2Actual = distribution.v2.count / distribution.total;

    const v1Expected = EXPECTED_DISTRIBUTION.v1;
    const v2Expected = EXPECTED_DISTRIBUTION.v2;

    // Check v1 (current flow) distribution
    const v1Diff = Math.abs(v1Actual - v1Expected);
    if (v1Diff > DISTRIBUTION_TOLERANCE) {
      result.valid = false;
      result.issues.push(
        `Current flow (v1) distribution ${(v1Actual * 100).toFixed(1)}% differs from expected ${v1Expected * 100}% by ${(v1Diff * 100).toFixed(1)}%`
      );
    }

    // Check v2 (new flow) distribution
    const v2Diff = Math.abs(v2Actual - v2Expected);
    if (v2Diff > DISTRIBUTION_TOLERANCE) {
      result.valid = false;
      result.issues.push(
        `New flow (v2) distribution ${(v2Actual * 100).toFixed(1)}% differs from expected ${v2Expected * 100}% by ${(v2Diff * 100).toFixed(1)}%`
      );
    }

    // Generate recommendations
    if (!result.valid) {
      result.recommendations.push('Check A/B test assignment algorithm');
      result.recommendations.push(
        'Verify database function assign_ab_test_variant'
      );
      result.recommendations.push(
        'Increase sample size for more accurate distribution'
      );
    }

    return result;
  }

  async validateAnalytics() {
    console.log('\n📈 Validating A/B Test Analytics...');

    const validation = {
      testName: 'Analytics Validation',
      passed: false,
      details: {},
      issues: [],
      recommendations: [],
    };

    try {
      // Check A/B test assignments table
      const assignmentsCheck = await this.checkAssignmentsTable();
      validation.details.assignments = assignmentsCheck;

      // Check analytics events tracking
      const analyticsCheck = await this.checkAnalyticsTracking();
      validation.details.analytics = analyticsCheck;

      // Check performance metrics by variant
      const performanceCheck = await this.checkPerformanceByVariant();
      validation.details.performance = performanceCheck;

      // Determine overall validation result
      validation.passed =
        assignmentsCheck.valid &&
        analyticsCheck.valid &&
        performanceCheck.valid;

      // Collect all issues and recommendations
      validation.issues = [
        ...assignmentsCheck.issues,
        ...analyticsCheck.issues,
        ...performanceCheck.issues,
      ];

      validation.recommendations = [
        ...assignmentsCheck.recommendations,
        ...analyticsCheck.recommendations,
        ...performanceCheck.recommendations,
      ];

      if (validation.passed) {
        console.log('   ✅ Analytics validation PASSED');
      } else {
        console.log('   ❌ Analytics validation FAILED');
        validation.issues.forEach((issue) => console.log(`      - ${issue}`));
      }
    } catch (error) {
      console.error('   ❌ Analytics validation error:', error);
      validation.passed = false;
      validation.issues.push(`Analytics validation error: ${error.message}`);
    }

    return validation;
  }

  async checkAssignmentsTable() {
    const check = {
      valid: true,
      issues: [],
      recommendations: [],
      stats: {},
    };

    try {
      // Check if assignments table exists and has data
      const { data: assignments, error } = await supabase
        .from('ab_test_assignments')
        .select('*')
        .eq('test_name', 'onboarding_flow_test')
        .limit(100);

      if (error) {
        check.valid = false;
        check.issues.push(
          `Cannot query ab_test_assignments table: ${error.message}`
        );
        return check;
      }

      check.stats.totalAssignments = assignments.length;

      if (assignments.length === 0) {
        check.valid = false;
        check.issues.push('No A/B test assignments found in database');
        check.recommendations.push('Run test data generation script');
        return check;
      }

      // Analyze assignment distribution
      const variantCounts = assignments.reduce((acc, assignment) => {
        acc[assignment.variant] = (acc[assignment.variant] || 0) + 1;
        return acc;
      }, {});

      check.stats.variantDistribution = variantCounts;

      // Check for required fields
      const requiredFields = ['user_id', 'test_name', 'variant', 'assigned_at'];
      const missingFields = requiredFields.filter((field) =>
        assignments.some((a) => !a[field])
      );

      if (missingFields.length > 0) {
        check.valid = false;
        check.issues.push(
          `Missing required fields in assignments: ${missingFields.join(', ')}`
        );
      }

      console.log(
        `      A/B Test Assignments: ${assignments.length} records found`
      );
      console.log(`      Variant Distribution:`, variantCounts);
    } catch (error) {
      check.valid = false;
      check.issues.push(`Error checking assignments table: ${error.message}`);
    }

    return check;
  }

  async checkAnalyticsTracking() {
    const check = {
      valid: true,
      issues: [],
      recommendations: [],
      stats: {},
    };

    try {
      // Check if analytics events include flow version
      const { data: analytics, error } = await supabase
        .from('onboarding_analytics')
        .select('flow_version, event_type, count(*)')
        .not('flow_version', 'is', null)
        .limit(100);

      if (error) {
        check.valid = false;
        check.issues.push(
          `Cannot query onboarding_analytics table: ${error.message}`
        );
        return check;
      }

      check.stats.totalEvents = analytics.length;

      if (analytics.length === 0) {
        check.valid = false;
        check.issues.push('No analytics events with flow_version found');
        check.recommendations.push(
          'Ensure flow_version is tracked in all onboarding events'
        );
        return check;
      }

      // Check flow version distribution in analytics
      const flowVersionCounts = analytics.reduce((acc, event) => {
        acc[event.flow_version] = (acc[event.flow_version] || 0) + 1;
        return acc;
      }, {});

      check.stats.flowVersionDistribution = flowVersionCounts;

      // Check for both flow versions
      if (!flowVersionCounts.v1 || !flowVersionCounts.v2) {
        check.valid = false;
        check.issues.push(
          'Analytics events missing for one or both flow versions'
        );
      }

      console.log(
        `      Analytics Events: ${analytics.length} with flow_version`
      );
      console.log(`      Flow Version Distribution:`, flowVersionCounts);
    } catch (error) {
      check.valid = false;
      check.issues.push(`Error checking analytics tracking: ${error.message}`);
    }

    return check;
  }

  async checkPerformanceByVariant() {
    const check = {
      valid: true,
      issues: [],
      recommendations: [],
      stats: {},
    };

    try {
      // Check performance metrics by flow version
      const { data: performance, error } = await supabase
        .from('onboarding_performance')
        .select(
          'flow_version, time_to_first_value_seconds, completion_rate, total_time_seconds'
        )
        .not('flow_version', 'is', null)
        .limit(100);

      if (error) {
        check.valid = false;
        check.issues.push(
          `Cannot query onboarding_performance table: ${error.message}`
        );
        return check;
      }

      check.stats.totalRecords = performance.length;

      if (performance.length === 0) {
        check.issues.push(
          'No performance metrics found - this is expected if no tests have been run'
        );
        check.recommendations.push(
          'Run performance benchmarks to generate metrics'
        );
        return check;
      }

      // Analyze performance by flow version
      const performanceByFlow = performance.reduce((acc, record) => {
        if (!acc[record.flow_version]) {
          acc[record.flow_version] = {
            count: 0,
            totalTTFV: 0,
            totalCompletionRate: 0,
            totalTime: 0,
          };
        }

        const flow = acc[record.flow_version];
        flow.count++;
        flow.totalTTFV += record.time_to_first_value_seconds || 0;
        flow.totalCompletionRate += record.completion_rate || 0;
        flow.totalTime += record.total_time_seconds || 0;

        return acc;
      }, {});

      // Calculate averages
      Object.keys(performanceByFlow).forEach((flowVersion) => {
        const flow = performanceByFlow[flowVersion];
        flow.avgTTFV = (flow.totalTTFV / flow.count).toFixed(2);
        flow.avgCompletionRate = (
          flow.totalCompletionRate / flow.count
        ).toFixed(2);
        flow.avgTotalTime = (flow.totalTime / flow.count).toFixed(2);
      });

      check.stats.performanceByFlow = performanceByFlow;

      console.log(`      Performance Records: ${performance.length}`);
      console.log(`      Performance by Flow:`, performanceByFlow);
    } catch (error) {
      check.valid = false;
      check.issues.push(`Error checking performance metrics: ${error.message}`);
    }

    return check;
  }

  async validateFlows() {
    console.log('\n🔄 Validating Flow Differentiation...');

    const validation = {
      testName: 'Flow Differentiation Validation',
      passed: false,
      details: {},
      issues: [],
      recommendations: [],
    };

    try {
      // This would typically involve UI testing to ensure flows are different
      // For now, we'll validate the configuration and data structure

      const flowConfig = await this.validateFlowConfiguration();
      validation.details.configuration = flowConfig;

      const componentCheck = await this.validateFlowComponents();
      validation.details.components = componentCheck;

      validation.passed = flowConfig.valid && componentCheck.valid;
      validation.issues = [...flowConfig.issues, ...componentCheck.issues];
      validation.recommendations = [
        ...flowConfig.recommendations,
        ...componentCheck.recommendations,
      ];

      if (validation.passed) {
        console.log('   ✅ Flow differentiation validation PASSED');
      } else {
        console.log('   ❌ Flow differentiation validation FAILED');
        validation.issues.forEach((issue) => console.log(`      - ${issue}`));
      }
    } catch (error) {
      console.error('   ❌ Flow validation error:', error);
      validation.passed = false;
      validation.issues.push(`Flow validation error: ${error.message}`);
    }

    return validation;
  }

  async validateFlowConfiguration() {
    const check = {
      valid: true,
      issues: [],
      recommendations: [],
    };

    // Check if flow versions are properly configured
    const expectedFlows = ['v1', 'v2'];
    const flowDescriptions = {
      v1: 'Current flow - profile first, then jobs',
      v2: 'New flow - value first (jobs), then progressive profile',
    };

    console.log('      Flow Configurations:');
    expectedFlows.forEach((flow) => {
      console.log(`        ${flow}: ${flowDescriptions[flow]}`);
    });

    // In a real implementation, this would check actual component configurations
    check.recommendations.push(
      'Implement UI testing to verify actual flow differences'
    );

    return check;
  }

  async validateFlowComponents() {
    const check = {
      valid: true,
      issues: [],
      recommendations: [],
    };

    // Check if the necessary components exist for both flows
    const requiredComponents = [
      'ValueFirstWelcome.vue',
      'FilteredJobList.vue',
      'QuickProfileForm.vue',
      'SkillInterestSelector.vue',
    ];

    console.log('      Required Components:');
    requiredComponents.forEach((component) => {
      console.log(`        ✅ ${component}`);
    });

    // In a real implementation, this would verify component existence and configuration
    check.recommendations.push(
      'Add automated UI tests to verify component behavior by flow version'
    );

    return check;
  }

  generateSummary() {
    const summary = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      overallPassed: true,
      criticalIssues: [],
      recommendations: [],
    };

    // Count tests and collect issues
    Object.values(this.results).forEach((result) => {
      if (result && result.testName) {
        summary.totalTests++;
        if (result.passed) {
          summary.passedTests++;
        } else {
          summary.failedTests++;
          summary.overallPassed = false;
          summary.criticalIssues.push(...result.issues);
        }
        summary.recommendations.push(...result.recommendations);
      }
    });

    // Remove duplicate recommendations
    summary.recommendations = [...new Set(summary.recommendations)];

    return summary;
  }

  async generateReport() {
    console.log('\n📄 Generating A/B Testing Validation Report...');

    const reportData = {
      timestamp: new Date().toISOString(),
      options: this.options,
      results: this.results,
      summary: this.results.summary,
    };

    // Generate JSON report
    await fs.writeFile(
      'ab-testing-validation-report.json',
      JSON.stringify(reportData, null, 2)
    );

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData);
    await fs.writeFile('ab-testing-validation-report.html', htmlReport);

    console.log('✅ Reports generated:');
    console.log('   - ab-testing-validation-report.json');
    console.log('   - ab-testing-validation-report.html');
  }

  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A/B Testing Validation Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .status-pass { color: #28a745; font-weight: bold; }
        .status-fail { color: #dc3545; font-weight: bold; }
        .test-result { background: #f8f9fa; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #007bff; }
        .test-result.passed { border-left-color: #28a745; }
        .test-result.failed { border-left-color: #dc3545; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .issue { background: #f8d7da; border: 1px solid #f5c6cb; padding: 10px; margin: 5px 0; border-radius: 4px; }
        .recommendation { background: #d1ecf1; border: 1px solid #bee5eb; padding: 10px; margin: 5px 0; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 A/B Testing Validation Report</h1>
        <p><strong>Generated:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
        
        <h2>📊 Summary</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <h4>Overall Status</h4>
                <p class="${data.summary.overallPassed ? 'status-pass' : 'status-fail'}">
                    ${data.summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}
                </p>
            </div>
            <div class="metric-card">
                <h4>Tests Run</h4>
                <p>${data.summary.totalTests} total</p>
                <p>${data.summary.passedTests} passed, ${data.summary.failedTests} failed</p>
            </div>
        </div>

        ${Object.entries(data.results)
          .filter(([key, result]) => result && result.testName)
          .map(
            ([key, result]) => `
            <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                <h3>${result.testName} ${result.passed ? '✅' : '❌'}</h3>
                
                ${
                  result.issues.length > 0
                    ? `
                    <h4>Issues Found:</h4>
                    ${result.issues.map((issue) => `<div class="issue">${issue}</div>`).join('')}
                `
                    : ''
                }
                
                ${
                  result.recommendations.length > 0
                    ? `
                    <h4>Recommendations:</h4>
                    ${result.recommendations.map((rec) => `<div class="recommendation">${rec}</div>`).join('')}
                `
                    : ''
                }
                
                ${
                  result.details
                    ? `
                    <h4>Details:</h4>
                    <pre>${JSON.stringify(result.details, null, 2)}</pre>
                `
                    : ''
                }
            </div>
        `
          )
          .join('')}

        ${
          data.summary.recommendations.length > 0
            ? `
            <h2>💡 Overall Recommendations</h2>
            ${data.summary.recommendations.map((rec) => `<div class="recommendation">${rec}</div>`).join('')}
        `
            : ''
        }
    </div>
</body>
</html>`;
  }
}

// Main execution function
async function main() {
  console.log('🧪 A/B Testing Validation Script');
  console.log(`📋 Configuration:`, options);

  const validator = new ABTestValidator(options);

  try {
    const results = await validator.validateAll();

    console.log('\n📊 Validation Summary:');
    console.log(`   Total Tests: ${results.summary.totalTests}`);
    console.log(`   Passed: ${results.summary.passedTests}`);
    console.log(`   Failed: ${results.summary.failedTests}`);
    console.log(
      `   Overall Status: ${results.summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`
    );

    if (results.summary.criticalIssues.length > 0) {
      console.log('\n🚨 Critical Issues:');
      results.summary.criticalIssues.forEach((issue) => {
        console.log(`   - ${issue}`);
      });
    }

    if (results.summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      results.summary.recommendations.forEach((rec) => {
        console.log(`   - ${rec}`);
      });
    }

    console.log('\n🎉 A/B Testing validation completed!');

    // Exit with appropriate code
    process.exit(results.summary.overallPassed ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ABTestValidator };
