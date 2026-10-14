import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
// Import the shared base configuration to inherit standard testing settings
import baseConfig from './vitest.config'

// Define standard paths for source files & the specialized output directory for contract testing
const sourceDir : string = 'src/ts/'
const outputDir : string = 'coverage/contract/'

// Merge the specific contract test overrides with the base configuration
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      outputFile: {
        // Redirect the JUnit XML report to the dedicated contract coverage directory
        junit: `${outputDir}coverage-report.xml`,
      },
      coverage: {
        // Restrict coverage tracking to just the API booking payload & utility scripts for contract tests
        include: [`${sourceDir}booking.ts`, `${sourceDir}booking-utils.ts`],

        // Explicitly exclude UI-focused scripts like navigation from contract coverage metrics
        exclude: [`${sourceDir}navigation.ts`],

        // Output all coverage reports to the contract folder
        reportsDirectory: outputDir,
      },
    },
  }),
)
