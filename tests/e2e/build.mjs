import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Define absolute paths for the project root & all source/destination directories
const projectRoot = process.cwd()
const outputDirectory = resolve(projectRoot, 'dist')
const sourceTypeScriptDirectory = resolve(projectRoot, 'src/ts')
const sourceAssetsDirectory = resolve(projectRoot, 'src/assets')
const sourceHamlFile = resolve(projectRoot, 'src/haml/index.haml')
const sourceStylusDirectory = resolve(projectRoot, 'src/styl')

// Ensure the necessary output subdirectories exist before writing files
mkdirSync(resolve(outputDirectory, 'css'), { recursive: true })
mkdirSync(resolve(outputDirectory, 'js'), { recursive: true })

// Execute the HAML CLI to compile the source HAML file into HTML
const html = execFileSync('haml', ['render', sourceHamlFile], {
  cwd: projectRoot,
  encoding: 'utf8',
})
writeFileSync(resolve(outputDirectory, 'index.html'), html)

// If there are static assets, recursively copy the entire directory to the dist folder
if (existsSync(sourceAssetsDirectory)) {
  cpSync(sourceAssetsDirectory, resolve(outputDirectory, 'assets'), { recursive: true })
}

// Execute the Stylus CLI to compile stylesheets & output them to the dist/css directory
execFileSync(
  'stylus',
  [sourceStylusDirectory, '--out', resolve(outputDirectory, 'css')],
  { cwd: projectRoot, stdio: 'inherit' },
)

// Gather all TypeScript files from the source directory
const typeScriptFiles = readdirSync(sourceTypeScriptDirectory)
  .filter((file) => file.endsWith('.ts'))
  .map((file) => resolve(sourceTypeScriptDirectory, file))

// Fail early if no TypeScript files were found to compile
if (typeScriptFiles.length === 0) {
  throw new Error(`No TypeScript files found in ${sourceTypeScriptDirectory}.`)
}

// Execute the TypeScript compiler (tsc) with specific targets & modular configurations
execFileSync(
  'tsc',
  [
    '--target',
    'ES2022',
    '--module',
    'ESNext',
    '--moduleResolution',
    'bundler',
    '--lib',
    'ES2022,DOM',
    '--sourceMap',
    '--outDir',
    resolve(outputDirectory, 'js'),
    '--rootDir',
    sourceTypeScriptDirectory,
    ...typeScriptFiles,
  ],
  { cwd: projectRoot, stdio: 'inherit' },
)

// Verify that the critical build artifacts were successfully generated
for (const outputFile of [
  resolve(outputDirectory, 'index.html'),
  resolve(outputDirectory, 'css/index.css'),
  resolve(outputDirectory, 'js/navigation.js'),
  resolve(outputDirectory, 'js/booking.js'),
]) {
  if (!existsSync(outputFile)) {
    throw new Error(`The E2E build did not produce required file: ${outputFile}`)
  }
}

// Perform a final sanity check to ensure the generated HTML properly references the booking script
const renderedHtml = readFileSync(resolve(outputDirectory, 'index.html'), 'utf8')
if (!renderedHtml.includes('src="js/booking.js"')) {
  throw new Error('The rendered page does not reference the booking script.')
}
