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

import React from 'react';
import styles from './Header.module.css';

interface HeaderState {
  isDarkTheme: boolean;
}

export interface HeaderProps {
  appName: string;
  subtitle?: string;
  showOptions?: boolean;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
  onProfileClick?: () => void;
  onThemeClick?: () => void;
  // Logo customization options
  primaryLogo?: {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    position?: 'left' | 'right';
  };
  secondaryLogo?: {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    position?: 'left' | 'right';
  };
  // Additional logos array for multiple logos
  additionalLogos?: Array<{
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    position?: 'left' | 'right';
  }>;
  showAppName?: boolean;
}

class Header extends React.Component<HeaderProps, HeaderState> {
  static defaultProps: Partial<HeaderProps> = {
    subtitle: '',
    showOptions: true,
    showAppName: true,
  };

  constructor(props: HeaderProps) {
    super(props);

    // Check if user has a saved theme preference or if the system prefers dark mode
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    const initialTheme = savedTheme ? savedTheme === 'dark' : systemPrefersDark;

    this.state = {
      isDarkTheme: initialTheme,
    };

    // Apply initial theme
    this.applyTheme(initialTheme);
  }

  handleSettingsClick = (): void => {
    if (this.props.onSettingsClick) {
      this.props.onSettingsClick();
    }
  };

  handleHelpClick = (): void => {
    if (this.props.onHelpClick) {
      this.props.onHelpClick();
    }
  };

  applyTheme = (isDark: boolean): void => {
    const htmlElement = document.documentElement;
    if (isDark) {
      htmlElement.classList.remove('light');
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
      htmlElement.classList.add('light');
    }
  };

  handleThemeClick = (): void => {
    const newTheme = !this.state.isDarkTheme;

    this.setState({ isDarkTheme: newTheme });
    this.applyTheme(newTheme);

    // Save user preference
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');

    // Call the optional callback
    if (this.props.onThemeClick) {
      this.props.onThemeClick();
    }
  };

  handleProfileClick = (): void => {
    if (this.props.onProfileClick) {
      this.props.onProfileClick();
    }
  };

  renderLogo = (logo: {
    src: string;
    alt: string;
    width?: number | string;
    height?: number | string;
    position?: 'left' | 'right';
    key?: string;
  }) => (
    <img
      key={logo.key}
      src={logo.src}
      alt={logo.alt}
      width={logo.width || 32}
      height={logo.height || 32}
      className={styles.logo}
    />
  );

  render() {
    const {
      appName,
      subtitle,
      showOptions,
      primaryLogo,
      secondaryLogo,
      additionalLogos,
      showAppName,
    } = this.props;

    // Separate logos by position
    const leftLogos = [];
    const rightLogos = [];

    // Add primary logo
    if (primaryLogo) {
      const position = primaryLogo.position || 'right';
      const logoElement = this.renderLogo({ ...primaryLogo, key: 'primary' });
      if (position === 'left') {
        leftLogos.push(logoElement);
      } else {
        rightLogos.push(logoElement);
      }
    }

    // Add secondary logo
    if (secondaryLogo) {
      const position = secondaryLogo.position || 'right';
      const logoElement = this.renderLogo({
        ...secondaryLogo,
        key: 'secondary',
      });
      if (position === 'left') {
        leftLogos.push(logoElement);
      } else {
        rightLogos.push(logoElement);
      }
    }

    // Add additional logos
    if (additionalLogos && additionalLogos.length > 0) {
      additionalLogos.forEach((logo, index) => {
        const position = logo.position || 'right';
        const logoElement = this.renderLogo({
          ...logo,
          key: `additional-${index}`,
        });
        if (position === 'left') {
          leftLogos.push(logoElement);
        } else {
          rightLogos.push(logoElement);
        }
      });
    }

    return (
      <header className={styles.header}>
        <div className={styles.logoSection}>
          {/* Left logos at extreme left */}
          {leftLogos.length > 0 && (
            <div className={styles.leftLogosContainer}>{leftLogos}</div>
          )}

          {/* App name and subtitle in center */}
          <div className={styles.textContent}>
            {showAppName && <p className={styles.title}>{appName}</p>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>

        {showOptions && (
          <div className={styles.optionsSection}>
            {/* Right logos at extreme right */}
            {rightLogos.length > 0 && (
              <div className={styles.rightLogosContainer}>{rightLogos}</div>
            )}

            <div className={styles.headerActions}>
              <button
                type='button'
                className={styles.iconButton}
                onClick={this.handleThemeClick}
                title={
                  this.state.isDarkTheme
                    ? 'Switch to Light Theme'
                    : 'Switch to Dark Theme'
                }
                aria-label={
                  this.state.isDarkTheme
                    ? 'Switch to Light Theme'
                    : 'Switch to Dark Theme'
                }
              >
                {this.state.isDarkTheme ? (
                  // Sun icon for switching to light theme
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path d='M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z' />
                  </svg>
                ) : (
                  // Moon icon for switching to dark theme
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path d='M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z' />
                  </svg>
                )}
              </button>

              <button
                type='button'
                className={styles.iconButton}
                onClick={this.handleHelpClick}
                title='Help'
                aria-label='Help'
              >
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  aria-hidden='true'
                >
                  <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z' />
                </svg>
              </button>

              <button
                type='button'
                className={styles.iconButton}
                onClick={this.handleSettingsClick}
                title='Settings'
                aria-label='Settings'
              >
                <svg
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                  aria-hidden='true'
                >
                  <path d='M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z' />
                </svg>
              </button>

              <button
                type='button'
                className={styles.profileButton}
                onClick={this.handleProfileClick}
                title='User Profile'
                aria-label='User Profile'
              >
                <div className={styles.profileAvatar}>
                  <svg
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }
}

export default Header;
