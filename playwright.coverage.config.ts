import { defineConfig } from '@playwright/test'

const outputDir = 'coverage/e2e/'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '*.spec.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['perfetto', { outputFile: `${outputDir}coverage-report.json.gz` }], ['junit', { outputFile: `${outputDir}coverage-report.xml` }],
    ['json', { outputFile: `${outputDir}coverage-report.json` }],
    ['blob', { outputFile: `${outputDir}coverage-report.zip` }],
    ['html', { outputFolder: `${outputDir}coverage-report` }],
    ['list'], ['line'], ['dot'], ['github']
  ],
  globalTeardown: './tests/e2e/coverage-reporter.mjs',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'vite dist --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
