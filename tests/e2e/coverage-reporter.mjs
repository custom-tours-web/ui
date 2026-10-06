import { readdir, readFile, mkdir } from "node:fs/promises";
import { resolve, relative } from "node:path";
import V8ToIstanbul from "v8-to-istanbul";
import libCoverage from "istanbul-lib-coverage";
import reports from "istanbul-reports";
import libReport from "istanbul-lib-report";

const projectRoot = process.cwd();
const rawCoverageDirectory = resolve(projectRoot, "test-results");
const browserScriptDirectory = resolve(projectRoot, "dist/js");
const outputDirectory = resolve(projectRoot, "coverage/e2e");

async function findCoverageFiles(directory) {
  let files = [];
  for (const entry of await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  })) {
    const entryPath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await findCoverageFiles(entryPath));
    } else if (entry.isFile() && entry.name === "e2e-v8-coverage.json") {
      files.push(entryPath);
    }
  }
  return files;
}

export default async function generateE2ECoverage() {
  const coverageFiles = await findCoverageFiles(rawCoverageDirectory);
  if (coverageFiles.length === 0) {
    throw new Error(
      "No browser coverage was collected. Run the E2E tests before generating the report.",
    );
  }

  const coverageMap = libCoverage.createCoverageMap({});
  for (const coverageFile of coverageFiles) {
    const scripts = JSON.parse(await readFile(coverageFile, "utf8"));
    for (const script of scripts) {
      if (!script.url.startsWith("http://127.0.0.1:4173/")) {
        continue;
      }
      const scriptUrl = new URL(script.url);
      if (!scriptUrl.pathname.startsWith("/js/")) {
        continue;
      }

      const scriptPath = resolve(browserScriptDirectory, `.${scriptUrl.pathname.slice(3)}`);
      if (!scriptPath.startsWith(`${browserScriptDirectory}/`)) {
        continue;
      }
      const converter = new V8ToIstanbul(scriptPath, 0, {
        source: await readFile(scriptPath, "utf8"),
      });
      await converter.load();
      converter.applyCoverage(script.functions);
      coverageMap.merge(converter.toIstanbul());
    }
  }

  if (coverageMap.files().length === 0) {
    throw new Error("No application JavaScript coverage was collected from Chromium.");
  }

  await mkdir(outputDirectory, { recursive: true });
  const reportContext = libReport.createContext({
    dir: outputDirectory,
    coverageMap,
    defaultSummarizer: "nested",
  });
  reports.create("html").execute(reportContext);
  reports.create("lcovonly").execute(reportContext);
  reports.create("text").execute(reportContext);
  console.log(`E2E coverage reports written to ${relative(projectRoot, outputDirectory)}.`);
}
