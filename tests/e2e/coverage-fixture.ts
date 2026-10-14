import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { test as base } from '@playwright/test'

// Extend the base Playwright test fixture to automatically capture V8 code coverage during test execution
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    // Attach a Chrome DevTools Protocol (CDP) session to the current page to access the V8 profiler directly
    const client = await page.context().newCDPSession(page)

    // Enable the profiler & begin tracking execution coverage
    await client.send('Profiler.enable')
    await client.send('Profiler.startPreciseCoverage', {
      callCount: false, // Optimizes performance by tracking execution boolean state rather than exact hit counts
      detailed: true,
    })

    try {
      // Yield execution to the actual test block
      await use(page)
    } finally {
      // The finally block ensures coverage data is always extracted & the profiler is disabled, even if the test fails
      const { result } = await client.send('Profiler.takePreciseCoverage')
      await client.send('Profiler.stopPreciseCoverage')
      await client.send('Profiler.disable')

      // Resolve a unique output path for this specific test's coverage data
      const coverageFile : string = testInfo.outputPath('e2e-v8-coverage.json')

      // Create necessary directories & dump the raw JSON coverage result to disk
      await mkdir(dirname(coverageFile), { recursive: true })
      await writeFile(coverageFile, JSON.stringify(result))

      // Clean up the CDP connection
      await client.detach()
    }
  },
})

// Re-export Playwright's expect so consumers can import everything directly from this fixture
export { expect } from '@playwright/test'
