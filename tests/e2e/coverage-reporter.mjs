import { readdir, readFile, mkdir } from 'node:fs/promises'
import { resolve, relative } from 'node:path'
import V8ToIstanbul from 'v8-to-istanbul'
import libCoverage from 'istanbul-lib-coverage'
import reports from 'istanbul-reports'
import libReport from 'istanbul-lib-report'

// Set up absolute paths for project directories
const projectRoot = process.cwd()
const browserScriptDirectory = resolve(projectRoot, 'dist/js')
const outputDirectory = resolve(projectRoot, 'coverage/e2e')
const rawCoverageDirectory = resolve(projectRoot, 'test-results')

/**
 * Recursively searches a directory for V8 coverage files.
 *
 * @param {string} directory - The root directory to search.
 * @returns {Promise<string[]>} A list of file paths matching 'e2e-v8-coverage.json'.
 */
async function findCoverageFiles(directory) {
  let files = []

  // Read the directory contents, handling the case where it doesn't exist gracefully
  for (const entry of await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOENT') {
      return []
    }
    throw error
  })) {
    const entryPath = resolve(directory, entry.name)

    // If it's a directory, recursively search inside it
    if (entry.isDirectory()) {
      files = files.concat(await findCoverageFiles(entryPath))
    }
    // If it's our target coverage file, add it to the list
    else if (entry.isFile() && entry.name === 'e2e-v8-coverage.json') {
      files.push(entryPath)
    }
  }
  return files
}

/**
 * Main function to generate Istanbul coverage reports from raw V8 coverage data.
 */
export default async function generateE2ECoverage() {
  // Locate all raw coverage files generated during the E2E test run
  const coverageFiles = await findCoverageFiles(rawCoverageDirectory)
  if (coverageFiles.length === 0) {
    throw new Error(
      'No browser coverage was collected. Run the E2E tests before generating the report.',
    )
  }

  // Initialize a coverage map to merge data from multiple test files
  const coverageMap = libCoverage.createCoverageMap({})

  // Process each coverage file
  for (const coverageFile of coverageFiles) {
    const scripts = JSON.parse(await readFile(coverageFile, 'utf8'))

    // Process each script executed in the browser
    for (const script of scripts) {
      // Only process scripts served from the local test server
      if (!script.url.startsWith('http://127.0.0.1:4173/')) {
        continue
      }

      const scriptUrl = new URL(script.url)

      // Filter out everything except JavaScript files
      if (!scriptUrl.pathname.startsWith('/js/')) {
        continue
      }

      // Map the browser URL back to the local file system path
      const scriptPath = resolve(browserScriptDirectory, `.${scriptUrl.pathname.slice(3)}`)

      // Ensure the script path stays within the intended directory (security check)
      if (!scriptPath.startsWith(`${browserScriptDirectory}/`)) {
        continue
      }

      // Convert V8 coverage format to Istanbul format
      const converter = new V8ToIstanbul(scriptPath, 0, {
        source: await readFile(scriptPath, 'utf8'),
      })
      await converter.load()
      converter.applyCoverage(script.functions)
      coverageMap.merge(converter.toIstanbul())
    }
  }

  // Ensure we actually processed some application code
  if (coverageMap.files().length === 0) {
    throw new Error('No application JavaScript coverage was collected from Chromium.')
  }

  // Prepare the output directory for the reports
  await mkdir(outputDirectory, { recursive: true })
  const reportContext = libReport.createContext({
    dir: outputDirectory,
    coverageMap,
    defaultSummarizer: 'nested',
  })

  // Generate the coverage reports in multiple standard formats
  reports.create('html').execute(reportContext)
  reports.create('lcovonly').execute(reportContext)
  reports.create('text').execute(reportContext)
  reports.create('cobertura').execute(reportContext)

  console.log(`E2E coverage reports written to ${relative(projectRoot, outputDirectory)}.`)
}
