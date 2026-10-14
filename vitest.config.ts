import { configDefaults, defineConfig } from 'vitest/config'

// Define standard paths for source files & test output
const sourceDir : string = 'src/ts/'
const outputDir : string = 'coverage/'

export default defineConfig({
  test: {
    // Exclude default node_modules/etc., plus Stryker mutation temp files & E2E tests
    exclude: [...configDefaults.exclude, '.stryker-tmp/**', 'tests/e2e/**'],

    // Output test results to the console & generate a JUnit XML report for CI/CD integrations
    reporters: ['default', 'junit'],
    outputFile: {
      junit: `${outputDir}coverage-report.xml`,
    },

    // Configure unit test code coverage
    coverage: {
      // Use the high-performance V8 engine for coverage collection
      provider: 'v8',

      // Only track coverage for source TypeScript files
      include: [`${sourceDir}**/*.ts`],

      // Exclude type definitions or specific non-testable scripts from coverage metrics
      exclude: [`${sourceDir}booking-request.ts`, `${sourceDir}test.ts`],

      // Generate coverage reports in various formats suitable for humans (html, text) & machines/CI (clover, cobertura, lcov, etc.)
      reporter: ['clover', 'cobertura', 'html', 'json', 'teamcity', 'text', 'lcov'],

      // Save all coverage reports to the designated output directory
      reportsDirectory: outputDir,
    },
  },
})
