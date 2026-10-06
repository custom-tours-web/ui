import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, ".stryker-tmp/**", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      include: ["src/ts/**/*.ts"],
      exclude: ["src/ts/booking-request.ts", "src/ts/test.ts"],
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "coverage",
    },
  },
});
