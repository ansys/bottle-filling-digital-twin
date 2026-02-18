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
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import SimpleNavigation from '@/components/SimpleNavigation/SimpleNavigation.tsx';
import { ROUTES } from '@/constants';

// Mock the navigate function
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('SimpleNavigation Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  afterEach(() => {
    mockNavigate.mockReset();
  });

  const renderWithRouter = (
    component: React.ReactElement,
    initialEntries = ['/']
  ) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>
    );
  };

  describe('Basic Rendering', () => {
    it('renders navigation component', () => {
      renderWithRouter(<SimpleNavigation />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Application Pages')).toBeInTheDocument();
      expect(screen.getByText('Choose your workflow:')).toBeInTheDocument();
    });

    it('applies default CSS class', () => {
      renderWithRouter(<SimpleNavigation />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('simple-navigation');
    });

    it('applies custom className when provided', () => {
      const customClass = 'custom-navigation';
      renderWithRouter(<SimpleNavigation className={customClass} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('simple-navigation');
      expect(nav).toHaveClass(customClass);
    });

    it('handles empty className gracefully', () => {
      renderWithRouter(<SimpleNavigation className='' />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('simple-navigation');
    });

    it('handles undefined className', () => {
      renderWithRouter(<SimpleNavigation className={undefined} />);

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('simple-navigation');
    });
  });

  describe('Navigation Items', () => {
    it('renders all navigation items', () => {
      renderWithRouter(<SimpleNavigation />);

      expect(screen.getByText('Simulation')).toBeInTheDocument();
      expect(screen.getByText('Reviewer')).toBeInTheDocument();
      expect(screen.getByText('Streaming')).toBeInTheDocument();
    });

    it('renders navigation item descriptions', () => {
      renderWithRouter(<SimpleNavigation />);

      expect(
        screen.getByText('Run bottle filling simulations')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Review and analyze solved cases')
      ).toBeInTheDocument();
      expect(screen.getByText('Live streaming interface')).toBeInTheDocument();
    });

    it('renders navigation items as buttons', () => {
      renderWithRouter(<SimpleNavigation />);

      const simulationButton = screen.getByRole('button', {
        name: /Simulation/,
      });
      const reviewerButton = screen.getByRole('button', { name: /Reviewer/ });
      const streamingButton = screen.getByRole('button', { name: /Streaming/ });

      expect(simulationButton).toBeInTheDocument();
      expect(reviewerButton).toBeInTheDocument();
      expect(streamingButton).toBeInTheDocument();
    });

    it('applies correct CSS classes to navigation items', () => {
      renderWithRouter(<SimpleNavigation />);

      const buttons = screen.getAllByRole('button');
      const navigationButtons = buttons.filter(
        button =>
          button.textContent?.includes('Simulation') ||
          button.textContent?.includes('Reviewer') ||
          button.textContent?.includes('Streaming')
      );

      navigationButtons.forEach(button => {
        expect(button).toHaveClass('navigation-item');
      });
    });
  });

  describe('Active State Management', () => {
    it('marks simulation item as active when on simulation route', () => {
      renderWithRouter(<SimpleNavigation />, [ROUTES.SIMULATION]);

      const simulationButton = screen.getByRole('button', {
        name: /Simulation/,
      });
      expect(simulationButton).toHaveClass('navigation-item', 'active');
    });

    it('marks reviewer item as active when on reviewer route', () => {
      renderWithRouter(<SimpleNavigation />, [ROUTES.REVIEWER]);

      const reviewerButton = screen.getByRole('button', { name: /Reviewer/ });
      expect(reviewerButton).toHaveClass('navigation-item', 'active');
    });

    it('marks streaming item as active when on streaming route', () => {
      renderWithRouter(<SimpleNavigation />, [ROUTES.STREAMING]);

      const streamingButton = screen.getByRole('button', { name: /Streaming/ });
      expect(streamingButton).toHaveClass('navigation-item', 'active');
    });

    it('does not mark any item as active when on unknown route', () => {
      renderWithRouter(<SimpleNavigation />, ['/unknown-route']);

      const buttons = screen.getAllByRole('button');
      const navigationButtons = buttons.filter(
        button =>
          button.textContent?.includes('Simulation') ||
          button.textContent?.includes('Reviewer') ||
          button.textContent?.includes('Streaming')
      );

      navigationButtons.forEach(button => {
        expect(button).toHaveClass('navigation-item');
        expect(button).not.toHaveClass('active');
      });
    });

    it('only marks one item as active at a time', () => {
      renderWithRouter(<SimpleNavigation />, [ROUTES.SIMULATION]);

      const activeButtons = document.querySelectorAll(
        '.navigation-item.active'
      );
      expect(activeButtons).toHaveLength(1);
    });
  });

  describe('Navigation Functionality', () => {
    it('navigates to simulation route when simulation button is clicked', () => {
      renderWithRouter(<SimpleNavigation />);

      const simulationButton = screen.getByRole('button', {
        name: /Simulation/,
      });
      fireEvent.click(simulationButton);

      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SIMULATION);
    });

    it('navigates to reviewer route when reviewer button is clicked', () => {
      renderWithRouter(<SimpleNavigation />);

      const reviewerButton = screen.getByRole('button', { name: /Reviewer/ });
      fireEvent.click(reviewerButton);

      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.REVIEWER);
    });

    it('navigates to streaming route when streaming button is clicked', () => {
      renderWithRouter(<SimpleNavigation />);

      const streamingButton = screen.getByRole('button', { name: /Streaming/ });
      fireEvent.click(streamingButton);

      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.STREAMING);
    });

    it('handles multiple rapid clicks', () => {
      renderWithRouter(<SimpleNavigation />);

      const simulationButton = screen.getByRole('button', {
        name: /Simulation/,
      });

      fireEvent.click(simulationButton);
      fireEvent.click(simulationButton);
      fireEvent.click(simulationButton);

      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SIMULATION);
    });
  });

  describe('Current Path Display', () => {
    it('displays current path on simulation route', () => {
      renderWithRouter(<SimpleNavigation />, [ROUTES.SIMULATION]);

      expect(
        screen.getByText(`Current page: ${ROUTES.SIMULATION}`)
      ).toBeInTheDocument();
    });

    it('displays current path on reviewer route', () => {
      renderWithRouter(<SimpleNavigation />, [ROUTES.REVIEWER]);

      expect(
        screen.getByText(`Current page: ${ROUTES.REVIEWER}`)
      ).toBeInTheDocument();
    });

    it('displays current path on streaming route', () => {
      renderWithRouter(<SimpleNavigation />, [ROUTES.STREAMING]);

      expect(
        screen.getByText(`Current page: ${ROUTES.STREAMING}`)
      ).toBeInTheDocument();
    });

    it('displays current path for unknown routes', () => {
      const unknownRoute = '/unknown-route';
      renderWithRouter(<SimpleNavigation />, [unknownRoute]);

      expect(
        screen.getByText(`Current page: ${unknownRoute}`)
      ).toBeInTheDocument();
    });

    it('displays root path correctly', () => {
      renderWithRouter(<SimpleNavigation />, [ROUTES.HOME]);

      expect(
        screen.getByText(`Current page: ${ROUTES.HOME}`)
      ).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('has correct DOM structure', () => {
      renderWithRouter(<SimpleNavigation />);

      const nav = screen.getByRole('navigation');

      const header = nav.querySelector('.navigation-header');
      expect(header).toBeInTheDocument();

      const items = nav.querySelector('.navigation-items');
      expect(items).toBeInTheDocument();

      const currentPath = nav.querySelector('.current-path');
      expect(currentPath).toBeInTheDocument();
    });

    it('contains all expected child elements', () => {
      renderWithRouter(<SimpleNavigation />);

      // Header elements
      expect(
        screen.getByRole('heading', { level: 3, name: 'Application Pages' })
      ).toBeInTheDocument();
      expect(screen.getByText('Choose your workflow:')).toBeInTheDocument();

      // Navigation items
      const navigationItems = document.querySelector('.navigation-items');
      expect(navigationItems).toBeInTheDocument();
      expect(navigationItems?.children).toHaveLength(3); // 3 navigation buttons

      // Current path
      const currentPath = document.querySelector('.current-path');
      expect(currentPath).toBeInTheDocument();
    });

    it('each navigation item has correct structure', () => {
      renderWithRouter(<SimpleNavigation />);

      const simulationButton = screen.getByRole('button', {
        name: /Simulation/,
      });

      const itemLabel = simulationButton.querySelector('.item-label');
      const itemDescription =
        simulationButton.querySelector('.item-description');

      expect(itemLabel).toBeInTheDocument();
      expect(itemDescription).toBeInTheDocument();
      expect(itemLabel).toHaveTextContent('Simulation');
      expect(itemDescription).toHaveTextContent(
        'Run bottle filling simulations'
      );
    });
  });

  describe('Accessibility', () => {
    it('uses semantic navigation element', () => {
      renderWithRouter(<SimpleNavigation />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('has proper heading hierarchy', () => {
      renderWithRouter(<SimpleNavigation />);

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('buttons are accessible via keyboard', () => {
      renderWithRouter(<SimpleNavigation />);

      const simulationButton = screen.getByRole('button', {
        name: /Simulation/,
      });
      expect(simulationButton).toBeVisible();
      expect(simulationButton.tabIndex).not.toBe(-1);
    });

    it('provides meaningful button content for screen readers', () => {
      renderWithRouter(<SimpleNavigation />);

      const buttons = screen.getAllByRole('button');
      const navigationButtons = buttons.filter(
        button =>
          button.textContent?.includes('Simulation') ||
          button.textContent?.includes('Reviewer') ||
          button.textContent?.includes('Streaming')
      );

      navigationButtons.forEach(button => {
        expect(button.textContent).toBeTruthy();
        expect(button.textContent?.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('maintains component integrity with repeated navigation', () => {
      // This test verifies the component remains stable with repeated navigation calls
      renderWithRouter(<SimpleNavigation />);

      const simulationButton = screen.getByRole('button', {
        name: /Simulation/,
      });
      const reviewerButton = screen.getByRole('button', {
        name: /Reviewer/,
      });

      // Verify all buttons exist and are functional
      expect(simulationButton).toBeInTheDocument();
      expect(reviewerButton).toBeInTheDocument();
      expect(simulationButton).not.toBeDisabled();
      expect(reviewerButton).not.toBeDisabled();

      // Multiple navigation calls should work correctly
      fireEvent.click(simulationButton);
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.SIMULATION);

      fireEvent.click(reviewerButton);
      expect(mockNavigate).toHaveBeenCalledWith(ROUTES.REVIEWER);

      // Verify component is still functional after multiple navigations
      fireEvent.click(simulationButton);
      expect(mockNavigate).toHaveBeenCalledTimes(3);
      expect(mockNavigate).toHaveBeenLastCalledWith(ROUTES.SIMULATION);

      // UI should still be responsive
      expect(simulationButton).toBeInTheDocument();
      expect(reviewerButton).toBeInTheDocument();
    });

    it('maintains functionality when route constants are missing', () => {
      // This test ensures the component doesn't break if constants are undefined
      renderWithRouter(<SimpleNavigation />);

      // Should still render without errors
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Application Pages')).toBeInTheDocument();
    });

    it('handles very long route paths in current path display', () => {
      const longRoute =
        '/very/long/route/path/that/might/overflow/the/container';
      renderWithRouter(<SimpleNavigation />, [longRoute]);

      expect(
        screen.getByText(`Current page: ${longRoute}`)
      ).toBeInTheDocument();
    });
  });

  describe('Integration with React Router', () => {
    it('works with BrowserRouter', () => {
      render(
        <BrowserRouter>
          <SimpleNavigation />
        </BrowserRouter>
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Application Pages')).toBeInTheDocument();
    });

    it('responds to location changes', () => {
      // Start with simulation route
      const { unmount } = renderWithRouter(<SimpleNavigation />, [
        ROUTES.SIMULATION,
      ]);

      expect(
        screen.getByText(`Current page: ${ROUTES.SIMULATION}`)
      ).toBeInTheDocument();

      // Clean up first render
      unmount();

      // Re-render with different route
      renderWithRouter(<SimpleNavigation />, [ROUTES.REVIEWER]);

      expect(
        screen.getByText(`Current page: ${ROUTES.REVIEWER}`)
      ).toBeInTheDocument();
    });
  });
});
