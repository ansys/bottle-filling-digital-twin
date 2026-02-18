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

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0].use.baseURL || 'http://127.0.0.1:3001';

  // Wait for server to be ready with retries
  const maxRetries = 10;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) {
        console.log('✓ Server is ready, proceeding with global setup');
        break;
      }
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.log(
          '✗ Server not ready after maximum retries, skipping global setup verification'
        );
        return; // Skip global setup if server isn't ready
      }
      console.log(
        `⏳ Waiting for server to be ready... (attempt ${retries}/${maxRetries})`
      );
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Optional: Basic browser verification (lightweight)
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('✓ Global setup completed: App is accessible');
  } catch (error) {
    console.log(
      '⚠️ Global setup verification failed, but continuing with tests:',
      error instanceof Error ? error.message : String(error)
    );
    // Don't throw error - let individual tests handle failures
  } finally {
    await browser.close();
  }
}

export default globalSetup;
