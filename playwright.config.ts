import { defineConfig, devices } from '@playwright/test'

// Define the global Playwright configuration
export default defineConfig({
  // Specify the root directory where all end-to-end test files are located
  testDir: './tests/e2e',

  // Set the glob pattern to match test files
  testMatch: '*.spec.ts',

  // Enable fully parallel execution for faster test runs
  fullyParallel: true,

  // Prevent accidental commits of `test.only` by failing the build if detected in a CI environment
  forbidOnly: Boolean(process.env.CI),

  // Automatically retry failing tests twice on CI to handle flakiness, but disable retries locally for faster debugging
  retries: process.env.CI ? 2 : 0,

  // Output test results to the console using the 'list' format
  reporter: [['list']],

  // Shared options applied to all projects & tests
  use: {
    // Set the base URL for page.goto() so tests can use relative paths
    baseURL: 'http://127.0.0.1:4173',

    // Automatically record a trace only if a test fails, helping with post-mortem debugging
    trace: 'retain-on-failure',
  },

  // Define the environments/browsers to test against
  projects: [
    {
      name: 'chromium',
      // Apply Playwright's pre-configured settings for Desktop Chrome
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Configure a local web server to boot up automatically before tests run
  webServer: {
    // Command to serve the built 'dist' directory via Vite
    command: 'vite dist --host 127.0.0.1 --port 4173 --strictPort',

    // The URL Playwright will ping to verify the server is ready
    url: 'http://127.0.0.1:4173',

    // Reuse an already running server when testing locally, but spawn a fresh one on CI
    reuseExistingServer: !process.env.CI,

    // Give the server up to 30 seconds to start before failing
    timeout: 30_000,
  },
})
