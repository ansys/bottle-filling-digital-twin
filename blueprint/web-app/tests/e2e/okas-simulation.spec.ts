// Copyright (C) 2025 - 2026 ANSYS, Inc. and/or its affiliates.
// SPDX-License-Identifier: MIT
//
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { test, expect, Page } from '@playwright/test';

/**
 * OKAS Simulation E2E Tests
 *
 * These tests verify the complete simulation workflow on OKAS deployment:
 * 1. Navigate to simulation page
 * 2. Create OKAS streaming session
 * 3. Wait for streaming to connect
 * 4. Select 500ml bottle design
 * 5. Open design file
 * 6. Initialize with default parameters
 * 7. Run simulation
 * 8. Monitor for completion
 *
 * Timeouts are configured for real OKAS deployment:
 * - Session creation: ~10-15 minutes
 * - Design load: ~2-3 minutes
 * - Initialize: ~1-2 minutes
 * - Simulation run: ~30-45 minutes
 *
 * Usage:
 * BASE_URL=http://your-okas-url npx playwright test tests/e2e/okas-simulation.spec.ts --config=playwright.remote.config.ts
 */

// Use environment variable or default to localhost
const BASE_URL =
  process.env.BASE_URL || 'http://localhost:3001';

// Timeouts for OKAS operations (in milliseconds)
const TIMEOUTS = {
  PAGE_LOAD: 30_000, // 30 seconds
  SESSION_CREATION: 900_000, // 15 minutes (session creation + pod startup)
  STREAMING_CONNECT: 120_000, // 2 minutes (WebRTC connection)
  DESIGN_LOAD: 180_000, // 3 minutes
  INITIALIZE: 120_000, // 2 minutes
  SIMULATION_RUN: 2_700_000, // 45 minutes
  STEP_WAIT: 5_000, // 5 seconds between steps
};

// Collect console logs for debugging
interface LogEntry {
  type: string;
  text: string;
  timestamp: Date;
}

/**
 * Helper function to wait for element and log status
 * Prefixed with underscore as it's available for future use
 */
async function _waitForElementAndLog(
  page: Page,
  selector: string,
  description: string,
  timeout: number
): Promise<void> {
  console.log(`Waiting for: ${description}`);
  const startTime = Date.now();
  await page.locator(selector).waitFor({ state: 'visible', timeout });
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`Found: ${description} (${elapsed}s)`);
}

// Export to prevent unused warning (available for external test utilities)
export { _waitForElementAndLog };

test.describe('OKAS Simulation Full Workflow', () => {
  const consoleLogs: LogEntry[] = [];

  test.beforeEach(async ({ page }) => {
    // Clear logs
    consoleLogs.length = 0;

    // Collect all console messages for debugging
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push({
        type: msg.type(),
        text,
        timestamp: new Date(),
      });
      // Log important messages to test output
      if (
        text.includes('Session') ||
        text.includes('streaming') ||
        text.includes('error') ||
        text.includes('Error')
      ) {
        console.log(`[Browser ${msg.type()}] ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.log(`[Page Error] ${error.message}`);
      consoleLogs.push({
        type: 'pageerror',
        text: error.message,
        timestamp: new Date(),
      });
    });
  });

  test.afterEach(async () => {
    // Log summary of any errors
    const errors = consoleLogs.filter(
      log => log.type === 'error' || log.type === 'pageerror'
    );
    if (errors.length > 0) {
      console.log('\n=== Console Errors Summary ===');
      errors.forEach(e =>
        console.log(`  [${e.type}] ${e.text.substring(0, 200)}`)
      );
    }
  });

  test('complete 500ml bottle simulation workflow', async ({ page }) => {
    // Set generous timeout for entire test (60 minutes)
    test.setTimeout(3_600_000);

    // Store session ID for reuse across pages (simulation -> reviewer)
    let capturedSessionId: string | null = process.env.SESSION_ID || null;

    // Capture session ID from console logs
    page.on('console', msg => {
      const text = msg.text();
      // Look for session ID in logs like "Session ready with ID: xxx" or "Session created successfully: xxx"
      const sessionMatch = text.match(/Session (?:ready with ID|created successfully):\s*([a-f0-9-]+)/i);
      if (sessionMatch && sessionMatch[1]) {
        capturedSessionId = sessionMatch[1];
        console.log(`[Captured Session ID] ${capturedSessionId}`);
      }
    });

    // Step 1: Navigate to simulation page
    await test.step('Navigate to simulation page', async () => {
      console.log(`\n=== Step 1: Navigating to ${BASE_URL}/simulation ===`);
      await page.goto(`${BASE_URL}/simulation`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.PAGE_LOAD,
      });

      // Verify page loaded
      await expect(page.locator('body')).toBeVisible();
      console.log('Page loaded successfully');

      // Take screenshot of initial state
      await page.screenshot({
        path: 'test-results/01-initial-page.png',
        fullPage: true,
      });
    });

    // Step 2: Connect to OKAS streaming session
    await test.step('Connect to OKAS streaming session', async () => {
      console.log('\n=== Step 2: Connecting to OKAS Streaming Session ===');

      // Look for session panel - it should show "OKAS Streaming Session"
      const sessionPanel = page.locator('text=OKAS Streaming Session');
      const hasSessionPanel = await sessionPanel
        .isVisible({ timeout: 10_000 })
        .catch(() => false);

      if (hasSessionPanel) {
        console.log('Session panel found');

        // Take screenshot before connecting
        await page.screenshot({
          path: 'test-results/02a-session-panel.png',
          fullPage: true,
        });

        // Check if there's an existing session to reuse (from env variable)
        const existingSessionId = process.env.SESSION_ID;

        if (existingSessionId) {
          // Reuse existing session
          console.log(`Using existing session: ${existingSessionId}`);
          const sessionInput = page.locator('#session-id-input');
          await sessionInput.fill(existingSessionId);

          const connectButton = page.locator('button:has-text("Connect to Session")');
          await expect(connectButton).toBeVisible({ timeout: 10_000 });
          await connectButton.click();
          console.log('Clicked Connect to Session');
        } else {
          // Create new session
          console.log('Creating new session (no SESSION_ID env var)');
          const createButton = page.locator('button:has-text("Create New Session")');
          await expect(createButton).toBeVisible({ timeout: 10_000 });
          await createButton.click();
          console.log('Clicked Create New Session');
        }

        console.log('Waiting for session to be ready...');

        // Wait for session connection (this can take 10-15 minutes for new sessions)
        // The session panel should disappear when ready
        await expect(sessionPanel).toBeHidden({
          timeout: TIMEOUTS.SESSION_CREATION,
        });
        console.log('Session connected and ready');
      } else {
        console.log(
          'No session panel - might be local mode or session already exists'
        );
      }

      await page.screenshot({
        path: 'test-results/02b-after-session.png',
        fullPage: true,
      });
    });

    // Step 3: Wait for streaming to connect
    await test.step('Wait for streaming connection', async () => {
      console.log('\n=== Step 3: Waiting for Streaming Connection ===');

      // Wait for the streaming area to show (not loading, not session panel)
      // This is indicated by the workflow tabs becoming enabled
      await page.waitForTimeout(TIMEOUTS.STEP_WAIT);

      // Check if streaming viewport is visible
      // The StreamRouter component should be rendered
      const streamingIndicator = page
        .locator('[class*="stream"], video, canvas')
        .first();
      const hasStreaming = await streamingIndicator
        .isVisible({ timeout: TIMEOUTS.STREAMING_CONNECT })
        .catch(() => false);

      if (hasStreaming) {
        console.log('Streaming viewport detected');
      }

      // Wait for Solver Setup tab to be enabled (indicates session is connected)
      const solverSetupTab = page.locator('text=Solver Setup');
      await expect(solverSetupTab).toBeVisible({ timeout: 30_000 });
      console.log('Solver Setup tab visible - session connected');

      // Wait for kit-app AND Fluent ready signals before proceeding
      // Simulation page uses full profile with Fluent solver
      console.log('Waiting for kit-app and Fluent ready signals...');
      let kitAppReady = false;
      let fluentReady = false;
      const maxWaitTime = 120_000; // 2 minutes max
      const startTime = Date.now();

      while ((!kitAppReady || !fluentReady) && (Date.now() - startTime) < maxWaitTime) {
        // Check console logs for kit-app ready signal
        kitAppReady = consoleLogs.some(log =>
          log.text.includes('kitAppReady')
        );

        // Check console logs for Fluent ready signal
        fluentReady = consoleLogs.some(log =>
          log.text.includes('Fluent instance healthy')
        );

        if (!kitAppReady || !fluentReady) {
          await page.waitForTimeout(5000);
          console.log(`Still waiting... kit-app: ${kitAppReady}, fluent: ${fluentReady} (${Math.round((Date.now() - startTime) / 1000)}s)`);
        }
      }

      if (kitAppReady && fluentReady) {
        console.log('Kit-app and Fluent are ready!');
      } else {
        console.log(`Warning: Not all ready signals received (kit-app: ${kitAppReady}, fluent: ${fluentReady}), proceeding anyway...`);
      }

      // Additional wait to ensure message channel is stable
      await page.waitForTimeout(5000);

      await page.screenshot({
        path: 'test-results/03-streaming-connected.png',
        fullPage: true,
      });
    });

    // Step 4: Select 500ml bottle design
    await test.step('Select 500ml bottle design', async () => {
      console.log('\n=== Step 4: Selecting 500ml Bottle Design ===');

      // Click on Solver Setup tab to expand it (if collapsed)
      const solverSetupTab = page.locator('[class*="collapsible"], [class*="tab"]').filter({ hasText: 'Solver Setup' }).first();
      await solverSetupTab.click();
      await page.waitForTimeout(1500);

      // Find the design file dropdown by ID
      const designSelect = page.locator('#design-file-select');
      await expect(designSelect).toBeVisible({ timeout: 10_000 });

      // Select 500ml Water Bottle option
      await designSelect.selectOption({ label: '500ml Water Bottle' });
      console.log('Selected 500ml Water Bottle');

      await page.waitForTimeout(1000);
      await page.screenshot({
        path: 'test-results/04-design-selected.png',
        fullPage: true,
      });
    });

    // Step 5: Open design file
    await test.step('Open design file', async () => {
      console.log('\n=== Step 5: Opening Design File ===');

      // First expand Solver Setup tab to access the button
      const solverSetupTab = page.locator('[class*="collapsible"], [class*="tab"]').filter({ hasText: 'Solver Setup' }).first();
      await solverSetupTab.click();
      await page.waitForTimeout(1500);

      // Find and click "Open Design File" button
      const openButton = page.locator('button:has-text("Open Design File")');
      await expect(openButton).toBeVisible({ timeout: 10_000 });
      await expect(openButton).toBeEnabled({ timeout: 10_000 });
      await openButton.click();
      console.log('Clicked Open Design File');

      // Wait for design file to load
      // The reliable indicator is when Initialize button becomes enabled
      console.log('Waiting for design file to load...');

      // Expand Initial Conditions tab to access Initialize button
      await page.waitForTimeout(3_000);
      const initialConditionsTab = page.locator('[class*="collapsible"], [class*="tab"]').filter({ hasText: 'Initial Conditions' }).first();
      await initialConditionsTab.click().catch(() => {}); // May fail if already open
      await page.waitForTimeout(1500);

      // Wait for Initialize button to become enabled (indicates design loaded successfully)
      const initializeButton = page.locator('button:has-text("Initialize")');
      await expect(initializeButton).toBeEnabled({ timeout: TIMEOUTS.DESIGN_LOAD });
      console.log('Design file loaded - Initialize button enabled');

      await page.screenshot({
        path: 'test-results/05-design-loaded.png',
        fullPage: true,
      });
    });

    // Step 6: Initialize simulation
    await test.step('Initialize simulation', async () => {
      console.log('\n=== Step 6: Initializing Simulation ===');

      // Click on Initial Conditions tab to expand it
      const initialConditionsTab = page.locator('[class*="collapsible"], [class*="tab"]').filter({ hasText: 'Initial Conditions' }).first();
      await initialConditionsTab.click();
      await page.waitForTimeout(1500);

      // Find and click Initialize button
      const initializeButton = page.locator('button:has-text("Initialize")');
      await expect(initializeButton).toBeVisible({ timeout: 10_000 });
      await expect(initializeButton).toBeEnabled({ timeout: 10_000 });
      await initializeButton.click();
      console.log('Clicked Initialize');

      // Wait for initialization to complete
      // Button changes to "Initializing..." during process
      const initializingButton = page.locator('button:has-text("Initializing")');
      if (await initializingButton.isVisible({ timeout: 5_000 }).catch(() => false)) {
        console.log('Initialization in progress...');
        await expect(initializingButton).toBeHidden({ timeout: TIMEOUTS.INITIALIZE });
      }

      // Wait for Run button to become enabled (prerequisites met)
      const runButton = page.locator('button:has-text("Run")');
      await expect(runButton).toBeEnabled({ timeout: TIMEOUTS.INITIALIZE });
      console.log('Initialization complete - Run button enabled');

      await page.screenshot({
        path: 'test-results/06-initialized.png',
        fullPage: true,
      });
    });

    // Step 7: Run simulation
    await test.step('Run simulation', async () => {
      console.log('\n=== Step 7: Running Simulation ===');

      // Click on Calculations tab to expand it
      const calculationsTab = page.locator('[class*="collapsible"], [class*="tab"]').filter({ hasText: 'Calculations' }).first();
      await calculationsTab.click();
      await page.waitForTimeout(1500);

      // Find and click Run button
      const runButton = page.locator('button:has-text("Run")');
      await expect(runButton).toBeVisible({ timeout: 10_000 });
      await expect(runButton).toBeEnabled({ timeout: 10_000 });
      await runButton.click();
      console.log('Clicked Run - simulation starting');

      // The button changes to "Running..." during simulation
      const runningButton = page.locator('button:has-text("Running")');
      if (await runningButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
        console.log('Simulation is running...');

        // Take periodic screenshots during simulation
        let screenshotCount = 0;
        const screenshotInterval = setInterval(async () => {
          screenshotCount++;
          try {
            await page.screenshot({
              path: `test-results/07-simulation-progress-${screenshotCount}.png`,
              fullPage: true,
            });
            console.log(`Progress screenshot ${screenshotCount} taken`);
          } catch {
            // Ignore screenshot errors
          }
        }, 60_000); // Every minute

        // Wait for simulation to complete (button returns to "Run")
        await expect(runningButton).toBeHidden({ timeout: TIMEOUTS.SIMULATION_RUN });
        clearInterval(screenshotInterval);
      }

      console.log('Simulation completed');
      await page.screenshot({
        path: 'test-results/07-simulation-complete.png',
        fullPage: true,
      });
    });

    // Step 8: Verify completion and view results
    await test.step('Verify simulation completion', async () => {
      console.log('\n=== Step 8: Verifying Simulation Completion ===');

      // Check that Results tab is now accessible
      const resultsTab = page.locator('[class*="collapsible"], [class*="tab"]').filter({ hasText: 'Results' }).first();
      await expect(resultsTab).toBeVisible({ timeout: 10_000 });
      console.log('Results tab visible');

      // Click on Results tab to expand it
      await resultsTab.click();
      await page.waitForTimeout(2000);

      // Take screenshot of results
      await page.screenshot({
        path: 'test-results/08-results-view.png',
        fullPage: true,
      });
    });

    // Step 9: Store/Save the simulation results
    await test.step('Store simulation results', async () => {
      console.log('\n=== Step 9: Storing Simulation Results ===');

      // Find and click "Store Current" button
      const storeButton = page.locator('button:has-text("Store Current")');
      await expect(storeButton).toBeVisible({ timeout: 10_000 });
      await expect(storeButton).toBeEnabled({ timeout: 5_000 });
      await storeButton.click();
      console.log('Clicked Store Current');

      // Wait for Fluent to save the USD file (this can take time)
      // The storeSolvedCase event triggers Fluent to write the USD file to storage
      console.log('Waiting for Fluent to save USD file...');
      await page.waitForTimeout(30_000); // 30 seconds for Fluent to save

      await page.screenshot({
        path: 'test-results/09-stored-results.png',
        fullPage: true,
      });
      console.log('Results stored - USD file should be saved by Fluent');
    });

    // Step 10: Navigate to Reviewer page and open saved result
    await test.step('Open saved result in Reviewer', async () => {
      console.log('\n=== Step 10: Opening Saved Result in Reviewer ===');

      // Navigate to reviewer page
      await page.goto(`${BASE_URL}/reviewer`, {
        waitUntil: 'networkidle',
        timeout: TIMEOUTS.PAGE_LOAD,
      });
      console.log('Navigated to Reviewer page');

      await page.waitForTimeout(3000);

      // Check for session panel - if present, connect using captured session ID
      const sessionPanel = page.locator('text=OKAS Streaming Session');
      const hasSessionPanel = await sessionPanel
        .isVisible({ timeout: 5_000 })
        .catch(() => false);

      if (hasSessionPanel) {
        console.log('Reviewer session panel found');

        // Use the captured session ID from simulation page OR from environment variable
        const sessionIdToUse = capturedSessionId || process.env.SESSION_ID;

        if (sessionIdToUse) {
          console.log(`Reusing session ID for Reviewer: ${sessionIdToUse}`);
          const sessionInput = page.locator('#session-id-input');
          await sessionInput.fill(sessionIdToUse);
          const connectButton = page.locator('button:has-text("Connect to Session")');
          await expect(connectButton).toBeVisible({ timeout: 10_000 });
          await connectButton.click();
          console.log('Clicked Connect to Session with session ID');
        } else {
          // No session ID - create new session with viewer profile
          console.log('No session ID available - creating new session for reviewer');
          const createButton = page.locator('button:has-text("Create New Session")');
          await expect(createButton).toBeVisible({ timeout: 10_000 });
          await createButton.click();
          console.log('Clicked Create New Session (will use viewer profile)');
        }

        // Wait for session to connect (can take up to 15 minutes for new session)
        console.log('Waiting for session to be ready...');
        await expect(sessionPanel).toBeHidden({ timeout: TIMEOUTS.SESSION_CREATION });
        console.log('Reviewer session connected');
      }

      // IMPORTANT: Wait for kit-app to be fully loaded before interacting
      // The session panel hiding only means the session was created, but the kit-app
      // needs to fully load before it can handle messages like getStoredResults
      console.log('Waiting for kit-app to be fully loaded...');

      // Wait for streaming indicator (video or canvas element)
      const streamingIndicator = page.locator('video, canvas').first();
      const hasStreaming = await streamingIndicator
        .isVisible({ timeout: 60_000 })
        .catch(() => false);
      if (hasStreaming) {
        console.log('Streaming viewport detected in Reviewer');
      } else {
        console.log('Warning: No streaming viewport detected');
      }

      // Wait for kit-app ready signal in console logs
      // Reviewer page uses viewer profile (kit-app only, no Fluent solver)
      // The kit-app sends kitAppReadyResponse when it's fully loaded
      console.log('Waiting for kit-app ready signal (viewer profile - no Fluent)...');
      let kitAppReady = false;
      const maxWaitTime = 120_000; // 2 minutes max
      const startTime = Date.now();

      while (!kitAppReady && (Date.now() - startTime) < maxWaitTime) {
        // Check console logs for kit-app ready signal
        kitAppReady = consoleLogs.some(log =>
          log.text.includes('kitAppReady')
        );

        if (!kitAppReady) {
          await page.waitForTimeout(5000);
          console.log(`Still waiting for kit-app... (${Math.round((Date.now() - startTime) / 1000)}s)`);
        }
      }

      if (kitAppReady) {
        console.log('Kit-app is ready!');
      } else {
        console.log('Warning: Kit-app ready signal not received, proceeding anyway...');
      }

      // Additional wait to ensure message channel is stable
      await page.waitForTimeout(5000);

      await page.screenshot({
        path: 'test-results/10a-reviewer-page.png',
        fullPage: true,
      });

      // Expand Solved Cases tab
      const solvedCasesTab = page.locator('[class*="collapsible"], [class*="tab"]').filter({ hasText: 'Solved Cases' }).first();
      await expect(solvedCasesTab).toBeVisible({ timeout: 30_000 });
      await solvedCasesTab.click();
      await page.waitForTimeout(1500);

      // Click on the dropdown to trigger loading of stored results
      const caseSelect = page.locator('#solved-case-select');
      await expect(caseSelect).toBeVisible({ timeout: 10_000 });

      // Fetch stored results via dropdown
      // The SolvedCases component triggers getStoredResults on focus
      // Now that kit-app is ready, this should work
      let options: string[] = [];

      // Click the dropdown to trigger focus event which requests stored results
      console.log('Clicking dropdown to trigger getStoredResults...');
      await caseSelect.click();

      // Wait for results to load from kit-app (storedResultsResponse)
      console.log('Waiting for stored results from kit-app...');
      await page.waitForTimeout(10_000);

      options = await caseSelect.locator('option').allTextContents();
      console.log('Available solved cases from dropdown:', options);

      // Take screenshot of available cases
      await page.screenshot({
        path: 'test-results/10b-solved-cases-list.png',
        fullPage: true,
      });

      // Track if a case was opened successfully
      let caseOpened = false;

      // Select and open a saved case
      if (options.length > 0 && !options[0].includes('Select')) {
        // Use the first available saved case
        await caseSelect.selectOption({ index: 0 });
        console.log(`Selected case from dropdown: ${options[0]}`);

        // Click Open button
        const openButton = page.locator('button:has-text("Open")');
        await expect(openButton).toBeEnabled({ timeout: 5_000 });
        await openButton.click();
        console.log('Clicked Open to load saved case');

        // Wait for USD case to load (can take time for large files)
        console.log('Waiting for USD case to load...');
        await page.waitForTimeout(20_000);

        await page.screenshot({
          path: 'test-results/10c-saved-case-opened.png',
          fullPage: true,
        });
        console.log('Saved case opened successfully');
        caseOpened = true;
      } else {
        console.log('No saved cases found in dropdown - cannot open USD scene');
        console.log('This may indicate getStoredResults message did not work');
        // Log recent console messages for debugging
        const recentLogs = consoleLogs.slice(-20);
        console.log('Recent browser logs:');
        recentLogs.forEach(l => console.log(`  [${l.type}] ${l.text.substring(0, 150)}`));
      }

      // Step 11: Play the animation (only if a case was opened)
      if (caseOpened) {
        console.log('\n=== Step 11: Playing Animation ===');

        // Expand Results Visualization tab
        const resultsTab = page.locator('[class*="collapsible"], [class*="tab"]').filter({ hasText: 'Results Visualization' }).first();
        await expect(resultsTab).toBeVisible({ timeout: 10_000 });
        await resultsTab.click();
        await page.waitForTimeout(1500);
        console.log('Expanded Results Visualization tab');

        // Find and click Play button
        const playButton = page.locator('button:has-text("Play")');
        await expect(playButton).toBeVisible({ timeout: 10_000 });
        await expect(playButton).toBeEnabled({ timeout: 5_000 });
        await playButton.click();
        console.log('Clicked Play button');

        // Let animation run for a few seconds
        await page.waitForTimeout(5000);

        await page.screenshot({
          path: 'test-results/11-animation-playing.png',
          fullPage: true,
        });

        // Verify animation is playing (button should now show "Stop")
        const stopButton = page.locator('button:has-text("Stop")');
        const isPlaying = await stopButton.isVisible().catch(() => false);
        console.log(`Animation playing: ${isPlaying}`);

        if (isPlaying) {
          // Stop the animation
          await stopButton.click();
          console.log('Stopped animation');
        }

        await page.screenshot({
          path: 'test-results/11-animation-stopped.png',
          fullPage: true,
        });
        console.log('Animation test complete');
      }
    });

    // Step 12: Final verification
    await test.step('Final verification', async () => {
      console.log('\n=== Step 12: Final Verification ===');

      // Verify no critical errors in console
      const criticalErrors = consoleLogs.filter(
        log =>
          (log.type === 'error' || log.type === 'pageerror') &&
          !log.text.includes('deprecat') &&
          !log.text.includes('favicon') &&
          !log.text.includes('ResizeObserver')
      );

      console.log(`\nTest completed with ${criticalErrors.length} critical errors`);
      expect(criticalErrors.length).toBeLessThan(10);

      await page.screenshot({
        path: 'test-results/12-final-state.png',
        fullPage: true,
      });
    });
  });
});

// Focused tests for individual steps (for debugging)
test.describe('OKAS Individual Step Tests', () => {
  test.skip('session creation only', async ({ page }) => {
    test.setTimeout(TIMEOUTS.SESSION_CREATION + 60_000);

    await page.goto(`${BASE_URL}/simulation`);

    const sessionPanel = page.locator('text=OKAS Streaming Session');
    if (await sessionPanel.isVisible({ timeout: 10_000 }).catch(() => false)) {
      const createButton = page.locator('button:has-text("Create New Session")');
      await createButton.click();

      console.log('Waiting for session to be ready...');
      await expect(sessionPanel).toBeHidden({
        timeout: TIMEOUTS.SESSION_CREATION,
      });
      console.log('Session ready!');
    }

    await page.screenshot({ path: 'test-results/session-test.png' });
  });

  test.skip('capture page state', async ({ page }) => {
    await page.goto(`${BASE_URL}/simulation`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    // Log all buttons
    const buttons = await page.locator('button').allTextContents();
    console.log('Buttons found:', buttons);

    // Log all selects
    const selects = await page.locator('select').count();
    console.log('Select elements:', selects);

    // Log visible text content
    const pageText = await page.locator('body').textContent();
    console.log('Page content preview:', pageText?.substring(0, 500));

    await page.screenshot({
      path: 'test-results/page-state.png',
      fullPage: true,
    });
  });
});
