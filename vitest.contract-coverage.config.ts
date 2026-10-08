import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      outputFile: {
        junit: "junit-contract.xml",
      },
      coverage: {
        include: ["src/ts/booking.ts", "src/ts/booking-utils.ts"],
        exclude: ["src/ts/navigation.ts"],
        reportsDirectory: "coverage/contract",
      },
    },
  }),
);
