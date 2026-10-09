import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import baseConfig from './vitest.config'

const sourceDir = 'src/ts/'
const outputDir = 'coverage/component/'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      outputFile: {
        junit: `${outputDir}coverage-report.xml`,
      },
      coverage: {
        include: [`${sourceDir}navigation.ts`],
        exclude: [
          `${sourceDir}booking-request.ts`,
          `${sourceDir}booking-utils.ts`,
          `${sourceDir}booking.ts`,
          `${sourceDir}test.ts`,
        ],
        reportsDirectory: outputDir,
      },
    },
  }),
)
