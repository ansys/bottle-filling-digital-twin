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

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '@/components/Header/Header.tsx';

describe('Header component', () => {
  beforeEach(() => {
    // ensure a clean theme in localStorage and document
    localStorage.removeItem('theme');
    document.documentElement.classList.remove('dark', 'light');
  });

  it('renders appName and subtitle and calls callbacks', () => {
    const onSettings = jest.fn();
    const onHelp = jest.fn();
    const onProfile = jest.fn();
    const onTheme = jest.fn();

    render(
      <Header
        appName='Test App'
        subtitle='Sub'
        onSettingsClick={onSettings}
        onHelpClick={onHelp}
        onProfileClick={onProfile}
        onThemeClick={onTheme}
        showOptions={true}
      />
    );

    expect(screen.getByText('Test App')).toBeInTheDocument();
    expect(screen.getByText('Sub')).toBeInTheDocument();

    const helpBtn = screen.getByLabelText('Help');
    fireEvent.click(helpBtn);
    expect(onHelp).toHaveBeenCalled();

    const settingsBtn = screen.getByLabelText('Settings');
    fireEvent.click(settingsBtn);
    expect(onSettings).toHaveBeenCalled();

    const profileBtn = screen.getByLabelText('User Profile');
    fireEvent.click(profileBtn);
    expect(onProfile).toHaveBeenCalled();
  });

  it('toggles theme and persists preference', () => {
    const onTheme = jest.fn();
    render(<Header appName='A' onThemeClick={onTheme} showOptions={true} />);

    const themeBtn = screen.getByLabelText(/Switch to Dark Theme|Switch to Light Theme/i);
    // initial click toggles theme and saves
    fireEvent.click(themeBtn);
    expect(localStorage.getItem('theme')).toMatch(/dark|light/);
    expect(onTheme).toHaveBeenCalled();
  });

  it('renders logos in left and right positions', () => {
    const primary = { src: '/p.png', alt: 'P', position: 'left' as const };
    const secondary = { src: '/s.png', alt: 'S', position: 'right' as const };

    render(
      // ensure options are visible so both logos render
      <Header appName='A' primaryLogo={primary} secondaryLogo={secondary} showOptions={true} />
    );

    expect(screen.getByAltText('P')).toBeInTheDocument();
    expect(screen.getByAltText('S')).toBeInTheDocument();
  });
});
