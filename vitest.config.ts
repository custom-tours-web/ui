import { configDefaults, defineConfig } from 'vitest/config'

const sourceDir : string = 'src/ts/'
const outputDir : string = 'coverage/'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, '.stryker-tmp/**', 'tests/e2e/**'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: `${outputDir}coverage-report.xml`,
    },
    coverage: {
      provider: 'v8',
      include: [`${sourceDir}**/*.ts`],
      exclude: [`${sourceDir}booking-request.ts`, `${sourceDir}test.ts`],
      reporter: ['clover', 'cobertura', 'html', 'json', 'teamcity', 'text', 'lcov'],
      reportsDirectory: outputDir,
    },
  },
})
