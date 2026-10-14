import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
// Import the base configuration to inherit standard test setup & generic reporters
import baseConfig from './vitest.config'

// Define the source path & a specialized output directory for integration test coverage
const sourceDir : string = 'src/ts/'
const outputDir : string = 'coverage/integration/'

// Merge the specific integration test overrides with the foundational base configuration
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      outputFile: {
        // Redirect the JUnit XML report so it doesn't overwrite unit or component test results
        junit: `${outputDir}coverage-report.xml`,
      },
      coverage: {
        // For integration testing, track coverage across multiple interacting modules
        include: [`${sourceDir}booking.ts`, `${sourceDir}booking-utils.ts`, `${sourceDir}navigation.ts`],

        // Output all generated coverage reports into the integration folder
        reportsDirectory: outputDir,
      },
    },
  }),
)
