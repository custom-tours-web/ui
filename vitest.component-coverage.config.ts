import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        include: ["src/ts/navigation.ts"],
        exclude: [
          "src/ts/booking-request.ts",
          "src/ts/booking-utils.ts",
          "src/ts/booking.ts",
          "src/ts/test.ts",
        ],
        reportsDirectory: "coverage/component",
      },
    },
  }),
);
