import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const client = await page.context().newCDPSession(page);
    await client.send("Profiler.enable");
    await client.send("Profiler.startPreciseCoverage", {
      callCount: false,
      detailed: true,
    });

    try {
      await use(page);
    } finally {
      const { result } = await client.send("Profiler.takePreciseCoverage");
      await client.send("Profiler.stopPreciseCoverage");
      await client.send("Profiler.disable");

      const coverageFile = testInfo.outputPath("e2e-v8-coverage.json");
      await mkdir(dirname(coverageFile), { recursive: true });
      await writeFile(coverageFile, JSON.stringify(result));
      await client.detach();
    }
  },
});

export { expect } from "@playwright/test";
