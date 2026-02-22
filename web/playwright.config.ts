import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4273",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run build && npx http-server dist -a 127.0.0.1 -p 4273 -s",
    port: 4273,
    // Avoid hitting unrelated apps that may already be using this port locally.
    reuseExistingServer: false
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
