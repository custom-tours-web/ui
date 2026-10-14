import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
// Import the base Vitest configuration to inherit common settings
import baseConfig from './vitest.config'

const sourceDir : string = 'src/ts/'
// Define a specialized output directory to separate component coverage from standard unit test coverage
const outputDir : string = 'coverage/component/'

// Merge the component-specific overrides with the base configuration
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      outputFile: {
        // Redirect the JUnit XML report to the new component-specific directory
        junit: `${outputDir}coverage-report.xml`,
      },
      coverage: {
        // Restrict this specific coverage run to analyze ONLY the navigation component
        include: [`${sourceDir}navigation.ts`],
        // Explicitly exclude booking-related logic & test utilities from the component coverage metrics
        exclude: [
          `${sourceDir}booking-request.ts`,
          `${sourceDir}booking-utils.ts`,
          `${sourceDir}booking.ts`,
          `${sourceDir}test.ts`,
        ],
        // Output all generated coverage reports to the component folder
        reportsDirectory: outputDir,
      },
    },
  }),
)
