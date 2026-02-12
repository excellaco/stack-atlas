import { defineConfig } from "vitest/config";

// Single root config covers both frontend and backend tests.
// All tests run in "node" environment — we intentionally have NO component/
// rendering tests (jsdom), only pure-function unit tests and handler-level
// integration tests. Component tests churn too fast in an agentic workflow.
export default defineConfig({
  test: {
    include: ["backend/src/**/*.test.ts", "frontend/src/**/*.test.ts"],
    environment: "node",
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["backend/src/**/*.ts", "frontend/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/data/**"],
    },
  },
});
