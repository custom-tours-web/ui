import { execFileSync } from "node:child_process"
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const projectRoot = process.cwd()
const outputDirectory = resolve(projectRoot, "dist")
const sourceTypeScriptDirectory = resolve(projectRoot, "src/ts")
const sourceAssetsDirectory = resolve(projectRoot, "src/assets")
const sourceHamlFile = resolve(projectRoot, "src/haml/index.haml")
const sourceStylusDirectory = resolve(projectRoot, "src/styl")

mkdirSync(resolve(outputDirectory, "css"), { recursive: true })
mkdirSync(resolve(outputDirectory, "js"), { recursive: true })

const html = execFileSync("haml", ["render", sourceHamlFile], {
  cwd: projectRoot,
  encoding: "utf8",
})
writeFileSync(resolve(outputDirectory, "index.html"), html)

if (existsSync(sourceAssetsDirectory)) {
  cpSync(sourceAssetsDirectory, resolve(outputDirectory, "assets"), { recursive: true })
}

execFileSync(
  "stylus",
  [sourceStylusDirectory, "--out", resolve(outputDirectory, "css")],
  { cwd: projectRoot, stdio: "inherit" },
)

const typeScriptFiles = readdirSync(sourceTypeScriptDirectory)
  .filter((file) => file.endsWith(".ts"))
  .map((file) => resolve(sourceTypeScriptDirectory, file))
if (typeScriptFiles.length === 0) {
  throw new Error(`No TypeScript files found in ${sourceTypeScriptDirectory}.`)
}

execFileSync(
  "tsc",
  [
    "--target",
    "ES2022",
    "--module",
    "ESNext",
    "--moduleResolution",
    "bundler",
    "--lib",
    "ES2022,DOM",
    "--sourceMap",
    "--outDir",
    resolve(outputDirectory, "js"),
    "--rootDir",
    sourceTypeScriptDirectory,
    ...typeScriptFiles,
  ],
  { cwd: projectRoot, stdio: "inherit" },
)

for (const outputFile of [
  resolve(outputDirectory, "index.html"),
  resolve(outputDirectory, "css/index.css"),
  resolve(outputDirectory, "js/navigation.js"),
  resolve(outputDirectory, "js/booking.js"),
]) {
  if (!existsSync(outputFile)) {
    throw new Error(`The E2E build did not produce required file: ${outputFile}`)
  }
}

const renderedHtml = readFileSync(resolve(outputDirectory, "index.html"), "utf8")
if (!renderedHtml.includes('src="js/booking.js"')) {
  throw new Error("The rendered page does not reference the booking script.")
}
