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

import { type Locator, type Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly mainHeading: Locator;
  readonly appTitle: Locator;
  readonly welcomeText: Locator;
  readonly simulationEngineerCard: Locator;
  readonly reviewerCard: Locator;
  readonly startSimulationButton: Locator;
  readonly viewResultsButton: Locator;
  readonly header: Locator;
  readonly main: Locator;

  constructor(page: Page) {
    this.page = page;
    this.mainHeading = page.getByRole('heading', {
      level: 2,
      name: 'Choose Your Journey',
    });
    this.appTitle = page.getByText('Bottle Filling Digital Twin');
    this.welcomeText = page.getByText(
      'Welcome to Advanced simulation and visualization'
    );
    this.simulationEngineerCard = page.getByText('I am a Simulation Engineer');
    this.reviewerCard = page.getByText('I am a Reviewer');
    this.startSimulationButton = page.getByRole('button', {
      name: /start simulation/i,
    });
    this.viewResultsButton = page.getByRole('button', {
      name: /view results/i,
    });
    this.header = page.locator('header');
    this.main = page.locator('main');
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.mainHeading.waitFor();
  }

  async clickStartSimulation() {
    await this.startSimulationButton.click();
  }

  async clickViewResults() {
    await this.viewResultsButton.click();
  }

  async verifyMainElements() {
    await this.mainHeading.isVisible();
    await this.appTitle.isVisible();
    await this.simulationEngineerCard.isVisible();
    await this.reviewerCard.isVisible();
    await this.startSimulationButton.isVisible();
    await this.viewResultsButton.isVisible();
  }

  async verifySemanticStructure() {
    await this.header.isVisible();
    await this.main.isVisible();

    // Check heading hierarchy
    const h3Elements = this.page.getByRole('heading', { level: 3 });
    return await h3Elements.count();
  }

  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1280, height: 720 });
  }
}
