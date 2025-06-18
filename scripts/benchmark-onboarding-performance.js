#!/usr/bin/env node

/**
 * ONBOARDING PERFORMANCE BENCHMARKING SCRIPT
 *
 * This script measures and analyzes the performance of the onboarding flow,
 * comparing the new optimized flow against the current flow and generating
 * detailed performance reports.
 *
 * Usage:
 *   node scripts/benchmark-onboarding-performance.js [options]
 *
 * Options:
 *   --url=URL       Base URL to test (default: http://localhost:1420)
 *   --runs=N        Number of test runs per scenario (default: 5)
 *   --report        Generate detailed HTML report
 *   --compare       Compare new vs current flow
 *   --mobile        Test mobile performance
 *   --network=TYPE  Network throttling (fast3g, slow3g, offline)
 */

import puppeteer from 'puppeteer';
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

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  url:
    args.find((arg) => arg.startsWith('--url='))?.split('=')[1] ||
    'http://localhost:1420',
  runs:
    parseInt(args.find((arg) => arg.startsWith('--runs='))?.split('=')[1]) || 5,
  report: args.includes('--report'),
  compare: args.includes('--compare'),
  mobile: args.includes('--mobile'),
  network:
    args.find((arg) => arg.startsWith('--network='))?.split('=')[1] || 'fast3g',
};

// Initialize Supabase client
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    : null;

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  timeToFirstValue: 30000, // 30 seconds
  firstContentfulPaint: 1500, // 1.5 seconds
  timeToInteractive: 3000, // 3 seconds
  cumulativeLayoutShift: 0.1,
  largestContentfulPaint: 2500, // 2.5 seconds
  totalBlockingTime: 300, // 300ms
};

// Network presets
const NETWORK_PRESETS = {
  fast3g: {
    offline: false,
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
    uploadThroughput: (750 * 1024) / 8, // 750 Kbps
    latency: 150,
  },
  slow3g: {
    offline: false,
    downloadThroughput: (500 * 1024) / 8, // 500 Kbps
    uploadThroughput: (500 * 1024) / 8, // 500 Kbps
    latency: 400,
  },
  offline: {
    offline: true,
  },
};

// Device presets
const DEVICE_PRESETS = {
  desktop: {
    name: 'Desktop',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  mobile: {
    name: 'iPhone 12',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  tablet: {
    name: 'iPad',
    userAgent:
      'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    viewport: { width: 768, height: 1024 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
};

class PerformanceBenchmark {
  constructor(options) {
    this.options = options;
    this.results = [];
    this.browser = null;
  }

  async initialize() {
    console.log('🚀 Initializing performance benchmark...');

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });

    console.log('✅ Browser initialized');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runBenchmark() {
    console.log(
      `📊 Starting performance benchmark with ${this.options.runs} runs...`
    );

    const scenarios = [
      { name: 'New Flow (v2)', flowVersion: 'v2' },
      { name: 'Current Flow (v1)', flowVersion: 'v1' },
    ];

    const devices = this.options.mobile
      ? [DEVICE_PRESETS.mobile, DEVICE_PRESETS.tablet]
      : [DEVICE_PRESETS.desktop];

    for (const scenario of scenarios) {
      for (const device of devices) {
        console.log(`\n🧪 Testing ${scenario.name} on ${device.name}...`);

        for (let run = 1; run <= this.options.runs; run++) {
          console.log(`   Run ${run}/${this.options.runs}`);

          const result = await this.runSingleTest(scenario, device, run);
          this.results.push(result);

          // Small delay between runs
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    return this.results;
  }

  async runSingleTest(scenario, device, runNumber) {
    const page = await this.browser.newPage();

    try {
      // Configure device
      await page.emulate(device);

      // Configure network
      if (this.options.network && NETWORK_PRESETS[this.options.network]) {
        await page.emulateNetworkConditions(
          NETWORK_PRESETS[this.options.network]
        );
      }

      // Enable performance monitoring
      await page.setCacheEnabled(false);

      const startTime = Date.now();
      const metrics = {
        scenario: scenario.name,
        flowVersion: scenario.flowVersion,
        device: device.name,
        run: runNumber,
        startTime,
        url: this.options.url,
        network: this.options.network,
      };

      // Start performance tracing
      await page.tracing.start({
        path: `./performance-trace-${scenario.flowVersion}-${device.name}-${runNumber}.json`,
        screenshots: true,
      });

      // Navigate to the application
      const navigationStart = Date.now();
      await page.goto(this.options.url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });

      metrics.navigationTime = Date.now() - navigationStart;

      // Measure Core Web Vitals
      const webVitals = await this.measureWebVitals(page);
      Object.assign(metrics, webVitals);

      // Test onboarding flow
      const onboardingMetrics = await this.testOnboardingFlow(
        page,
        scenario.flowVersion
      );
      Object.assign(metrics, onboardingMetrics);

      // Stop tracing
      await page.tracing.stop();

      metrics.totalTime = Date.now() - startTime;

      return metrics;
    } catch (error) {
      console.error(`❌ Error in test run: ${error.message}`);
      return {
        scenario: scenario.name,
        flowVersion: scenario.flowVersion,
        device: device.name,
        run: runNumber,
        error: error.message,
        failed: true,
      };
    } finally {
      await page.close();
    }
  }

  async measureWebVitals(page) {
    // Measure Core Web Vitals using Performance Observer API
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};

        // First Contentful Paint
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
              vitals.firstContentfulPaint = entry.startTime;
            }
          }
        }).observe({ entryTypes: ['paint'] });

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          vitals.largestContentfulPaint = lastEntry.startTime;
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          vitals.cumulativeLayoutShift = clsValue;
        }).observe({ entryTypes: ['layout-shift'] });

        // Time to Interactive (approximation)
        setTimeout(() => {
          vitals.timeToInteractive = performance.now();
          resolve(vitals);
        }, 100);
      });
    });

    return webVitals;
  }

  async testOnboardingFlow(page, flowVersion) {
    const metrics = {};

    try {
      // Wait for the onboarding to start
      await page.waitForSelector('[data-testid="onboarding-welcome"]', {
        timeout: 10000,
      });

      const onboardingStart = Date.now();

      // Test location selection
      const locationStart = Date.now();

      // Try GPS detection first
      try {
        await page.click('[data-testid="detect-location-btn"]');
        await page.waitForSelector('[data-testid="jobs-list"]', {
          timeout: 15000,
        });
        metrics.locationDetectionTime = Date.now() - locationStart;
        metrics.locationMethod = 'gps';
      } catch {
        // Fallback to manual selection
        await page.click('[data-testid="manual-location-btn"]');
        await page.waitForSelector('[data-testid="district-picker"]', {
          timeout: 5000,
        });
        await page.click('[data-testid="district-option"]:first-child');
        metrics.locationDetectionTime = Date.now() - locationStart;
        metrics.locationMethod = 'manual';
      }

      // Measure time to first value (jobs displayed)
      const jobsDisplayed = Date.now();
      metrics.timeToFirstValue = jobsDisplayed - onboardingStart;

      // Count jobs displayed
      const jobCount = await page.$$eval(
        '[data-testid="job-card"]',
        (jobs) => jobs.length
      );
      metrics.jobsDisplayed = jobCount;

      // Test job interaction
      if (jobCount > 0) {
        const jobInteractionStart = Date.now();
        await page.click('[data-testid="job-card"]:first-child');
        await page.waitForSelector('[data-testid="job-details"]', {
          timeout: 5000,
        });
        metrics.jobInteractionTime = Date.now() - jobInteractionStart;
      }

      // Test skill selection (if new flow)
      if (flowVersion === 'v2') {
        try {
          await page.click('[data-testid="continue-btn"]');
          await page.waitForSelector('[data-testid="skill-selector"]', {
            timeout: 5000,
          });

          // Select a few skills
          const skillElements = await page.$$('[data-testid="skill-option"]');
          for (let i = 0; i < Math.min(3, skillElements.length); i++) {
            await skillElements[i].click();
          }

          await page.click('[data-testid="skills-continue-btn"]');
        } catch (error) {
          console.log('Skill selection step skipped or not found');
        }
      }

      // Test profile completion
      try {
        await page.waitForSelector('[data-testid="profile-form"]', {
          timeout: 5000,
        });

        const profileStart = Date.now();

        // Fill profile form
        await page.type('[data-testid="name-input"]', 'Test User');
        await page.type('[data-testid="phone-input"]', '+51987654321');
        await page.type(
          '[data-testid="description-input"]',
          'Test description for performance testing'
        );

        await page.click('[data-testid="complete-profile-btn"]');
        await page.waitForSelector('[data-testid="onboarding-success"]', {
          timeout: 10000,
        });

        metrics.profileCompletionTime = Date.now() - profileStart;
        metrics.onboardingCompleted = true;
      } catch (error) {
        console.log('Profile completion failed or not required');
        metrics.onboardingCompleted = false;
      }

      metrics.totalOnboardingTime = Date.now() - onboardingStart;
    } catch (error) {
      console.error(`Onboarding flow error: ${error.message}`);
      metrics.onboardingError = error.message;
      metrics.onboardingCompleted = false;
    }

    return metrics;
  }

  analyzeResults() {
    console.log('\n📈 Analyzing performance results...');

    const analysis = {
      summary: {},
      byScenario: {},
      byDevice: {},
      thresholdAnalysis: {},
      recommendations: [],
    };

    // Group results
    const groupedResults = this.groupResults();

    // Calculate summary statistics
    analysis.summary = this.calculateSummaryStats(this.results);

    // Analyze by scenario
    for (const [scenario, results] of Object.entries(
      groupedResults.byScenario
    )) {
      analysis.byScenario[scenario] = this.calculateSummaryStats(results);
    }

    // Analyze by device
    for (const [device, results] of Object.entries(groupedResults.byDevice)) {
      analysis.byDevice[device] = this.calculateSummaryStats(results);
    }

    // Threshold analysis
    analysis.thresholdAnalysis = this.analyzeThresholds();

    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  groupResults() {
    const grouped = {
      byScenario: {},
      byDevice: {},
      byFlowVersion: {},
    };

    for (const result of this.results) {
      if (result.failed) continue;

      // Group by scenario
      if (!grouped.byScenario[result.scenario]) {
        grouped.byScenario[result.scenario] = [];
      }
      grouped.byScenario[result.scenario].push(result);

      // Group by device
      if (!grouped.byDevice[result.device]) {
        grouped.byDevice[result.device] = [];
      }
      grouped.byDevice[result.device].push(result);

      // Group by flow version
      if (!grouped.byFlowVersion[result.flowVersion]) {
        grouped.byFlowVersion[result.flowVersion] = [];
      }
      grouped.byFlowVersion[result.flowVersion].push(result);
    }

    return grouped;
  }

  calculateSummaryStats(results) {
    if (results.length === 0) return {};

    const validResults = results.filter((r) => !r.failed);

    const stats = {
      totalRuns: results.length,
      successfulRuns: validResults.length,
      failureRate:
        (
          ((results.length - validResults.length) / results.length) *
          100
        ).toFixed(2) + '%',
    };

    // Calculate metrics for successful runs
    if (validResults.length > 0) {
      const metrics = [
        'timeToFirstValue',
        'firstContentfulPaint',
        'largestContentfulPaint',
        'timeToInteractive',
        'cumulativeLayoutShift',
        'totalOnboardingTime',
        'navigationTime',
        'locationDetectionTime',
        'jobsDisplayed',
      ];

      for (const metric of metrics) {
        const values = validResults
          .map((r) => r[metric])
          .filter((v) => v !== undefined && v !== null);

        if (values.length > 0) {
          stats[metric] = {
            avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
            min: Math.min(...values).toFixed(2),
            max: Math.max(...values).toFixed(2),
            median: this.calculateMedian(values).toFixed(2),
          };
        }
      }

      // Calculate completion rate
      const completedRuns = validResults.filter(
        (r) => r.onboardingCompleted
      ).length;
      stats.completionRate =
        ((completedRuns / validResults.length) * 100).toFixed(2) + '%';
    }

    return stats;
  }

  calculateMedian(values) {
    const sorted = values.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  analyzeThresholds() {
    const analysis = {};
    const validResults = this.results.filter((r) => !r.failed);

    for (const [threshold, limit] of Object.entries(PERFORMANCE_THRESHOLDS)) {
      const values = validResults
        .map((r) => r[threshold])
        .filter((v) => v !== undefined && v !== null);

      if (values.length > 0) {
        const passedCount = values.filter((v) => v <= limit).length;
        const passRate = ((passedCount / values.length) * 100).toFixed(2);

        analysis[threshold] = {
          threshold: limit,
          passRate: passRate + '%',
          passed: passedCount,
          total: values.length,
          avgValue: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(
            2
          ),
        };
      }
    }

    return analysis;
  }

  generateRecommendations(analysis) {
    const recommendations = [];

    // Time to First Value recommendations
    if (analysis.thresholdAnalysis.timeToFirstValue) {
      const ttfv = analysis.thresholdAnalysis.timeToFirstValue;
      if (parseFloat(ttfv.passRate) < 90) {
        recommendations.push({
          priority: 'High',
          category: 'Performance',
          issue: 'Time to First Value exceeds 30 seconds',
          recommendation:
            'Optimize job loading and implement progressive loading strategies',
          impact: 'Critical for user engagement and onboarding completion',
        });
      }
    }

    // Core Web Vitals recommendations
    if (analysis.thresholdAnalysis.firstContentfulPaint) {
      const fcp = analysis.thresholdAnalysis.firstContentfulPaint;
      if (parseFloat(fcp.passRate) < 80) {
        recommendations.push({
          priority: 'High',
          category: 'Performance',
          issue: 'First Contentful Paint is slow',
          recommendation:
            'Optimize critical rendering path and reduce bundle size',
          impact: 'Affects perceived performance and user experience',
        });
      }
    }

    // Mobile performance recommendations
    if (analysis.byDevice.mobile) {
      const mobileCompletion = parseFloat(
        analysis.byDevice.mobile.completionRate
      );
      if (mobileCompletion < 75) {
        recommendations.push({
          priority: 'High',
          category: 'Mobile',
          issue: 'Low mobile completion rate',
          recommendation: 'Improve mobile UX and reduce friction points',
          impact: 'Critical for mobile-first strategy',
        });
      }
    }

    // Flow comparison recommendations
    if (
      analysis.byScenario['New Flow (v2)'] &&
      analysis.byScenario['Current Flow (v1)']
    ) {
      const newFlowTTFV = parseFloat(
        analysis.byScenario['New Flow (v2)'].timeToFirstValue?.avg || 0
      );
      const currentFlowTTFV = parseFloat(
        analysis.byScenario['Current Flow (v1)'].timeToFirstValue?.avg || 0
      );

      if (newFlowTTFV > currentFlowTTFV) {
        recommendations.push({
          priority: 'Medium',
          category: 'A/B Testing',
          issue: 'New flow is slower than current flow',
          recommendation:
            'Investigate performance regressions in new flow implementation',
          impact: 'May affect A/B test results and user adoption',
        });
      }
    }

    return recommendations;
  }

  async generateReport() {
    console.log('📄 Generating performance report...');

    const analysis = this.analyzeResults();
    const reportData = {
      timestamp: new Date().toISOString(),
      options: this.options,
      results: this.results,
      analysis,
      thresholds: PERFORMANCE_THRESHOLDS,
    };

    // Generate JSON report
    await fs.writeFile(
      'performance-report.json',
      JSON.stringify(reportData, null, 2)
    );

    // Generate HTML report if requested
    if (this.options.report) {
      const htmlReport = this.generateHTMLReport(reportData);
      await fs.writeFile('performance-report.html', htmlReport);
      console.log('✅ HTML report generated: performance-report.html');
    }

    console.log('✅ JSON report generated: performance-report.json');
    return reportData;
  }

  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Onboarding Performance Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1, h2, h3 { color: #333; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .metric-label { color: #666; font-size: 0.9em; }
        .threshold-pass { color: #28a745; }
        .threshold-fail { color: #dc3545; }
        .recommendation { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .recommendation.high { border-color: #dc3545; background: #f8d7da; }
        .recommendation.medium { border-color: #ffc107; background: #fff3cd; }
        .recommendation.low { border-color: #17a2b8; background: #d1ecf1; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .chart-container { width: 100%; height: 400px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Onboarding Performance Report</h1>
        <p><strong>Generated:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
        <p><strong>Test Configuration:</strong> ${data.options.runs} runs per scenario, Network: ${data.options.network}</p>

        <h2>📊 Summary Metrics</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${data.analysis.summary.timeToFirstValue?.avg || 'N/A'}ms</div>
                <div class="metric-label">Avg Time to First Value</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.analysis.summary.completionRate || 'N/A'}</div>
                <div class="metric-label">Completion Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.analysis.summary.firstContentfulPaint?.avg || 'N/A'}ms</div>
                <div class="metric-label">Avg First Contentful Paint</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${data.analysis.summary.failureRate || 'N/A'}</div>
                <div class="metric-label">Failure Rate</div>
            </div>
        </div>

        <h2>🎯 Threshold Analysis</h2>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Threshold</th>
                    <th>Pass Rate</th>
                    <th>Average Value</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(data.analysis.thresholdAnalysis)
                  .map(
                    ([metric, analysis]) => `
                    <tr>
                        <td>${metric}</td>
                        <td>${analysis.threshold}ms</td>
                        <td>${analysis.passRate}</td>
                        <td>${analysis.avgValue}ms</td>
                        <td class="${parseFloat(analysis.passRate) >= 80 ? 'threshold-pass' : 'threshold-fail'}">
                            ${parseFloat(analysis.passRate) >= 80 ? '✅ Pass' : '❌ Fail'}
                        </td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>

        <h2>📱 Performance by Device</h2>
        <div class="metric-grid">
            ${Object.entries(data.analysis.byDevice)
              .map(
                ([device, stats]) => `
                <div class="metric-card">
                    <h4>${device}</h4>
                    <p><strong>Completion Rate:</strong> ${stats.completionRate || 'N/A'}</p>
                    <p><strong>Avg TTFV:</strong> ${stats.timeToFirstValue?.avg || 'N/A'}ms</p>
                    <p><strong>Failure Rate:</strong> ${stats.failureRate || 'N/A'}</p>
                </div>
            `
              )
              .join('')}
        </div>

        <h2>🔄 Flow Comparison</h2>
        <div class="metric-grid">
            ${Object.entries(data.analysis.byScenario)
              .map(
                ([scenario, stats]) => `
                <div class="metric-card">
                    <h4>${scenario}</h4>
                    <p><strong>Completion Rate:</strong> ${stats.completionRate || 'N/A'}</p>
                    <p><strong>Avg TTFV:</strong> ${stats.timeToFirstValue?.avg || 'N/A'}ms</p>
                    <p><strong>Avg Total Time:</strong> ${stats.totalOnboardingTime?.avg || 'N/A'}ms</p>
                </div>
            `
              )
              .join('')}
        </div>

        <h2>💡 Recommendations</h2>
        ${data.analysis.recommendations
          .map(
            (rec) => `
            <div class="recommendation ${rec.priority.toLowerCase()}">
                <h4>${rec.priority} Priority: ${rec.issue}</h4>
                <p><strong>Category:</strong> ${rec.category}</p>
                <p><strong>Recommendation:</strong> ${rec.recommendation}</p>
                <p><strong>Impact:</strong> ${rec.impact}</p>
            </div>
        `
          )
          .join('')}

        <h2>📋 Detailed Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Scenario</th>
                    <th>Device</th>
                    <th>Run</th>
                    <th>TTFV (ms)</th>
                    <th>FCP (ms)</th>
                    <th>Completed</th>
                    <th>Jobs Shown</th>
                </tr>
            </thead>
            <tbody>
                ${data.results
                  .filter((r) => !r.failed)
                  .map(
                    (result) => `
                    <tr>
                        <td>${result.scenario}</td>
                        <td>${result.device}</td>
                        <td>${result.run}</td>
                        <td>${result.timeToFirstValue || 'N/A'}</td>
                        <td>${result.firstContentfulPaint || 'N/A'}</td>
                        <td>${result.onboardingCompleted ? '✅' : '❌'}</td>
                        <td>${result.jobsDisplayed || 'N/A'}</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`;
  }

  async saveToDatabase(results) {
    if (!supabase) {
      console.log('⚠️  Supabase not configured, skipping database save');
      return;
    }

    console.log('💾 Saving results to database...');

    try {
      const performanceData = results.map((result) => ({
        flow_version: result.flowVersion,
        total_time_seconds: Math.round(
          (result.totalOnboardingTime || 0) / 1000
        ),
        time_to_first_value_seconds: Math.round(
          (result.timeToFirstValue || 0) / 1000
        ),
        steps_completed: result.onboardingCompleted ? 5 : 3,
        total_steps: 5,
        completion_rate: result.onboardingCompleted ? 100 : 60,
        jobs_viewed: result.jobsDisplayed || 0,
        jobs_applied: 0, // Would need to track this separately
        location_detection_time_seconds: Math.round(
          (result.locationDetectionTime || 0) / 1000
        ),
        location_detection_success: result.locationMethod !== 'failed',
        profile_completion_percentage: result.onboardingCompleted ? 100 : 0,
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('onboarding_performance')
        .insert(performanceData);

      if (error) {
        console.error('❌ Error saving to database:', error);
      } else {
        console.log('✅ Results saved to database');
      }
    } catch (error) {
      console.error('❌ Database save error:', error);
    }
  }
}

// Main execution function
async function main() {
  const benchmark = new PerformanceBenchmark(options);

  try {
    await benchmark.initialize();

    console.log(`🎯 Performance Benchmark Configuration:`);
    console.log(`   URL: ${options.url}`);
    console.log(`   Runs per scenario: ${options.runs}`);
    console.log(`   Network: ${options.network}`);
    console.log(`   Mobile testing: ${options.mobile ? 'Yes' : 'No'}`);
    console.log(`   Generate report: ${options.report ? 'Yes' : 'No'}`);

    const results = await benchmark.runBenchmark();

    console.log('\n📊 Performance Benchmark Results:');
    console.log(`   Total test runs: ${results.length}`);
    console.log(
      `   Successful runs: ${results.filter((r) => !r.failed).length}`
    );
    console.log(`   Failed runs: ${results.filter((r) => r.failed).length}`);

    // Analyze results
    const analysis = benchmark.analyzeResults();

    // Display key metrics
    console.log('\n🎯 Key Performance Metrics:');
    if (analysis.summary.timeToFirstValue) {
      console.log(
        `   Average Time to First Value: ${analysis.summary.timeToFirstValue.avg}ms`
      );
    }
    if (analysis.summary.completionRate) {
      console.log(`   Completion Rate: ${analysis.summary.completionRate}`);
    }
    if (analysis.summary.firstContentfulPaint) {
      console.log(
        `   Average First Contentful Paint: ${analysis.summary.firstContentfulPaint.avg}ms`
      );
    }

    // Display threshold analysis
    console.log('\n🚦 Threshold Analysis:');
    for (const [metric, analysis] of Object.entries(
      analysis.thresholdAnalysis
    )) {
      const status =
        parseFloat(analysis.passRate) >= 80 ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${metric}: ${analysis.passRate} ${status}`);
    }

    // Display recommendations
    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      analysis.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`      → ${rec.recommendation}`);
      });
    }

    // Generate report
    await benchmark.generateReport();

    // Save to database
    await benchmark.saveToDatabase(results);

    console.log('\n🎉 Performance benchmark completed successfully!');

    // Exit with appropriate code
    const hasFailures = results.some((r) => r.failed);
    const hasThresholdFailures = Object.values(analysis.thresholdAnalysis).some(
      (a) => parseFloat(a.passRate) < 80
    );

    if (hasFailures || hasThresholdFailures) {
      console.log("⚠️  Some tests failed or didn't meet thresholds");
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
  } finally {
    await benchmark.cleanup();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { PerformanceBenchmark };
