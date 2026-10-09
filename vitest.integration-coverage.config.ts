import { mergeConfig } from 'vite'
import { defineConfig } from 'vitest/config'
import baseConfig from './vitest.config'

const sourceDir : string = 'src/ts/'
const outputDir : string = 'coverage/integration/'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      outputFile: {
        junit: `${outputDir}coverage-report.xml`,
      },
      coverage: {
        include: [`${sourceDir}booking.ts`, `${sourceDir}booking-utils.ts`, `${sourceDir}navigation.ts`],
        reportsDirectory: outputDir,
      },
    },
  }),
)
