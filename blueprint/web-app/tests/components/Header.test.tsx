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
import type { HeaderProps } from '@/components/Header/Header.tsx';

describe('Header Component', () => {
  const defaultProps: HeaderProps = {
    appName: 'Test Application',
  };

  describe('Basic Rendering', () => {
    it('renders with required props', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByText('Test Application')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('renders app name correctly', () => {
      render(<Header {...defaultProps} />);

      const title = screen.getByText('Test Application');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('title');
    });

    it('renders subtitle when provided', () => {
      const props = { ...defaultProps, subtitle: 'Version 1.0' };
      render(<Header {...props} />);

      expect(screen.getByText('Version 1.0')).toBeInTheDocument();
      expect(screen.getByText('Version 1.0')).toHaveClass('subtitle');
    });

    it('does not render subtitle when not provided', () => {
      render(<Header {...defaultProps} />);

      expect(
        screen.queryByRole('heading', { level: 2 })
      ).not.toBeInTheDocument();
    });

    it('does not render subtitle when empty string', () => {
      const props = { ...defaultProps, subtitle: '' };
      render(<Header {...props} />);

      // Empty string is falsy, so subtitle element should not be rendered
      const subtitleElement = document.querySelector('.subtitle');
      expect(subtitleElement).not.toBeInTheDocument();
    });
  });

  describe('Options Section', () => {
    it('renders options section by default', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Settings' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'User Profile' })
      ).toBeInTheDocument();
    });

    it('renders options section when showOptions is true', () => {
      const props = { ...defaultProps, showOptions: true };
      render(<Header {...props} />);

      expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Settings' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'User Profile' })
      ).toBeInTheDocument();
    });

    it('does not render options section when showOptions is false', () => {
      const props = { ...defaultProps, showOptions: false };
      render(<Header {...props} />);

      expect(
        screen.queryByRole('button', { name: 'Help' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Settings' })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'User Profile' })
      ).not.toBeInTheDocument();
    });
  });

  describe('Button Interactions', () => {
    it('calls onHelpClick when help button is clicked', () => {
      const mockOnHelpClick = jest.fn();
      const props = { ...defaultProps, onHelpClick: mockOnHelpClick };
      render(<Header {...props} />);

      const helpButton = screen.getByRole('button', { name: 'Help' });
      fireEvent.click(helpButton);

      expect(mockOnHelpClick).toHaveBeenCalledTimes(1);
    });

    it('calls onSettingsClick when settings button is clicked', () => {
      const mockOnSettingsClick = jest.fn();
      const props = { ...defaultProps, onSettingsClick: mockOnSettingsClick };
      render(<Header {...props} />);

      const settingsButton = screen.getByRole('button', { name: 'Settings' });
      fireEvent.click(settingsButton);

      expect(mockOnSettingsClick).toHaveBeenCalledTimes(1);
    });

    it('calls onProfileClick when profile button is clicked', () => {
      const mockOnProfileClick = jest.fn();
      const props = { ...defaultProps, onProfileClick: mockOnProfileClick };
      render(<Header {...props} />);

      const profileButton = screen.getByRole('button', {
        name: 'User Profile',
      });
      fireEvent.click(profileButton);

      expect(mockOnProfileClick).toHaveBeenCalledTimes(1);
    });

    it('does not throw error when clicking buttons without handlers', () => {
      render(<Header {...defaultProps} />);

      const helpButton = screen.getByRole('button', { name: 'Help' });
      const settingsButton = screen.getByRole('button', { name: 'Settings' });
      const profileButton = screen.getByRole('button', {
        name: 'User Profile',
      });

      expect(() => {
        fireEvent.click(helpButton);
        fireEvent.click(settingsButton);
        fireEvent.click(profileButton);
      }).not.toThrow();
    });
  });

  describe('CSS Classes and Structure', () => {
    it('applies correct CSS classes to main elements', () => {
      render(<Header {...defaultProps} />);

      const header = screen.getByRole('banner');
      expect(header).toHaveClass('header');

      const logoSection = header.querySelector('.logoSection');
      expect(logoSection).toBeInTheDocument();

      const optionsSection = header.querySelector('.optionsSection');
      expect(optionsSection).toBeInTheDocument();
    });

    it('applies correct button classes', () => {
      render(<Header {...defaultProps} />);

      const helpButton = screen.getByRole('button', { name: 'Help' });
      const settingsButton = screen.getByRole('button', { name: 'Settings' });
      const profileButton = screen.getByRole('button', {
        name: 'User Profile',
      });

      expect(helpButton).toHaveClass('iconButton');
      expect(settingsButton).toHaveClass('iconButton');
      expect(profileButton).toHaveClass('profileButton');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for buttons', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByLabelText('Help')).toBeInTheDocument();
      expect(screen.getByLabelText('Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('User Profile')).toBeInTheDocument();
    });

    it('has proper button titles for tooltips', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByTitle('Help')).toBeInTheDocument();
      expect(screen.getByTitle('Settings')).toBeInTheDocument();
      expect(screen.getByTitle('User Profile')).toBeInTheDocument();
    });

    xit('has aria-hidden on decorative SVG icons', () => {
      render(<Header {...defaultProps} />);

      const svgIcons = document.querySelectorAll('svg[aria-hidden="true"]');
      expect(svgIcons).toHaveLength(3); // Help, Settings, Profile icons
    });

    it('uses semantic header element', () => {
      render(<Header {...defaultProps} />);

      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  describe('Multiple Clicks and Event Handling', () => {
    it('handles multiple rapid clicks correctly', () => {
      const mockOnHelpClick = jest.fn();
      const props = { ...defaultProps, onHelpClick: mockOnHelpClick };
      render(<Header {...props} />);

      const helpButton = screen.getByRole('button', { name: 'Help' });

      fireEvent.click(helpButton);
      fireEvent.click(helpButton);
      fireEvent.click(helpButton);

      expect(mockOnHelpClick).toHaveBeenCalledTimes(3);
    });

    it('calls different handlers independently', () => {
      const mockOnHelpClick = jest.fn();
      const mockOnSettingsClick = jest.fn();
      const mockOnProfileClick = jest.fn();

      const props = {
        ...defaultProps,
        onHelpClick: mockOnHelpClick,
        onSettingsClick: mockOnSettingsClick,
        onProfileClick: mockOnProfileClick,
      };

      render(<Header {...props} />);

      fireEvent.click(screen.getByRole('button', { name: 'Help' }));
      fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
      fireEvent.click(screen.getByRole('button', { name: 'User Profile' }));

      expect(mockOnHelpClick).toHaveBeenCalledTimes(1);
      expect(mockOnSettingsClick).toHaveBeenCalledTimes(1);
      expect(mockOnProfileClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props Validation and Edge Cases', () => {
    it('handles very long app names', () => {
      const longAppName = 'A'.repeat(100);
      const props = { ...defaultProps, appName: longAppName };
      render(<Header {...props} />);

      expect(screen.getByText(longAppName)).toBeInTheDocument();
    });

    it('handles special characters in app name', () => {
      const specialAppName = 'Test App (v1.0) - Production™';
      const props = { ...defaultProps, appName: specialAppName };
      render(<Header {...props} />);

      expect(screen.getByText(specialAppName)).toBeInTheDocument();
    });

    it('handles very long subtitles', () => {
      const longSubtitle =
        'This is a very long subtitle that might span multiple lines and should be handled gracefully by the component';
      const props = { ...defaultProps, subtitle: longSubtitle };
      render(<Header {...props} />);

      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
    });

    it('handles undefined callback props', () => {
      const props = {
        ...defaultProps,
        onHelpClick: undefined,
        onSettingsClick: undefined,
        onProfileClick: undefined,
      };

      render(<Header {...props} />);

      // Should render buttons without errors
      expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Settings' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'User Profile' })
      ).toBeInTheDocument();
    });
  });

  describe('Component State and Lifecycle', () => {
    it('maintains consistent structure across re-renders', () => {
      const { rerender } = render(<Header {...defaultProps} />);

      expect(screen.getByText('Test Application')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();

      // Re-render with different props
      rerender(<Header {...defaultProps} subtitle='New Subtitle' />);

      expect(screen.getByText('Test Application')).toBeInTheDocument();
      expect(screen.getByText('New Subtitle')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Help' })).toBeInTheDocument();
    });

    it('preserves button functionality across prop changes', () => {
      const mockOnHelpClick1 = jest.fn();
      const mockOnHelpClick2 = jest.fn();

      const { rerender } = render(
        <Header {...defaultProps} onHelpClick={mockOnHelpClick1} />
      );

      fireEvent.click(screen.getByRole('button', { name: 'Help' }));
      expect(mockOnHelpClick1).toHaveBeenCalledTimes(1);

      // Re-render with different handler
      rerender(<Header {...defaultProps} onHelpClick={mockOnHelpClick2} />);

      fireEvent.click(screen.getByRole('button', { name: 'Help' }));
      expect(mockOnHelpClick2).toHaveBeenCalledTimes(1);
      expect(mockOnHelpClick1).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
});
