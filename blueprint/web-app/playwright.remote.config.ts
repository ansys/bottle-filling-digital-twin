import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for testing against remote deployment
 * No dev server needed - tests against BASE_URL env variable
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  outputDir: 'test-results/',

  use: {
    baseURL: process.env.BASE_URL || 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    screenshot: 'on', // Capture screenshots on every test
    video: 'on-first-retry', // Record video on first retry
    ignoreHTTPSErrors: true, // Ignore SSL certificate errors for self-signed certs
    // WebRTC-specific settings for headless browser
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // WebRTC specific flags
        '--disable-features=WebRtcHideLocalIpsWithMdns',
        '--enable-features=WebRtcRemoteEventLog',
      ],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Uncomment to run headed for debugging:
        // headless: false,
      },
    },
  ],

  // No webServer - testing against remote deployment
});
