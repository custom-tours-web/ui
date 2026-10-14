import { defineConfig } from '@playwright/test'

// Define the central output directory for all coverage reports
const outputDir : string = 'coverage/e2e/'

// Export a Playwright configuration specifically tailored for capturing test coverage
export default defineConfig({
  // Point Playwright to the end-to-end test directory
  testDir: './tests/e2e',
  testMatch: '*.spec.ts',

  // Optimize execution by running tests in parallel
  fullyParallel: true,

  // Prevent accidental commits containing `test.only` by failing the build on CI
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,

  // Configure an extensive array of reporters to output coverage data in multiple formats
  reporter: [
    ['perfetto', { outputFile: `${outputDir}coverage-report.json.gz` }], // Compressed trace format
    ['junit', { outputFile: `${outputDir}coverage-report.xml` }], // XML format often used by CI/CD tools
    ['json', { outputFile: `${outputDir}coverage-report.json` }], // Standard JSON report
    ['blob', { outputFile: `${outputDir}coverage-report.zip` }], // Zip archive of the report data
    ['html', { outputFolder: `${outputDir}coverage-report` }], // Interactive HTML report

    // Standard terminal reporters
    ['list'], ['line'], ['dot'], ['github']
  ],

  // Execute the custom coverage reporter script after all tests have completed to process the V8 data
  globalTeardown: './tests/e2e/coverage-reporter.mjs',

  use: {
    // Set the base URL so tests can use relative paths
    baseURL: 'http://127.0.0.1:4173',

    // Keep traces only for failing tests to save space while aiding debugging
    trace: 'retain-on-failure',
  },

  // Specify the browsers/environments to test against
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  // Start the local Vite server to serve the application before running tests
  webServer: {
    command: 'vite dist --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI, // Save startup time locally
    timeout: 30_000,
  },
})
