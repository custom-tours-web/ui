import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import baseConfig from "./vitest.config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      coverage: {
        include: ["src/ts/booking.ts", "src/ts/booking-utils.ts", "src/ts/navigation.ts"],
        reportsDirectory: "coverage/integration",
      },
    },
  }),
);
