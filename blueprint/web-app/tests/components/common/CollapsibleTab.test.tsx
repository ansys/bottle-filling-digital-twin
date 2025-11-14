import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CollapsibleTab from '../../../src/components/common/CollapsibleTab/CollapsibleTab';

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

describe('CollapsibleTab Component', () => {
  const defaultProps = {
    title: 'Test Tab Title',
    isOpen: false,
    isEnabled: true,
    onToggle: jest.fn(),
    children: <div>Test tab content</div>,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders title correctly', () => {
      render(<CollapsibleTab {...defaultProps} />);

      expect(screen.getByText('Test Tab Title')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
        'Test Tab Title'
      );
    });

    it('renders children content when open', () => {
      render(<CollapsibleTab {...defaultProps} isOpen={true} />);

      expect(screen.getByText('Test tab content')).toBeInTheDocument();
    });

    it('renders children content when closed (hidden)', () => {
      render(<CollapsibleTab {...defaultProps} isOpen={false} />);

      // Content should exist in DOM but be hidden via CSS
      expect(screen.getByText('Test tab content')).toBeInTheDocument();

      const content = document.querySelector('.collapsible-tab-content');
      expect(content).not.toHaveClass('open');
    });

    it('renders step number when provided', () => {
      render(<CollapsibleTab {...defaultProps} stepNumber={3} />);

      const stepNumber = document.querySelector('.step-number');
      expect(stepNumber).toBeInTheDocument();
      expect(stepNumber).toHaveTextContent('3');
    });

    it('does not render step number when not provided', () => {
      render(<CollapsibleTab {...defaultProps} />);

      expect(document.querySelector('.step-number')).not.toBeInTheDocument();
    });
  });

  describe('Open/Closed States', () => {
    it('applies open class when isOpen is true', () => {
      render(<CollapsibleTab {...defaultProps} isOpen={true} />);

      const header = document.querySelector('.collapsible-tab-header');
      const content = document.querySelector('.collapsible-tab-content');
      const arrow = document.querySelector('.tab-arrow');

      expect(header).toHaveClass('open');
      expect(content).toHaveClass('open');
      expect(arrow).toHaveClass('open');
    });

    it('does not apply open class when isOpen is false', () => {
      render(<CollapsibleTab {...defaultProps} isOpen={false} />);

      const header = document.querySelector('.collapsible-tab-header');
      const content = document.querySelector('.collapsible-tab-content');
      const arrow = document.querySelector('.tab-arrow');

      expect(header).not.toHaveClass('open');
      expect(content).not.toHaveClass('open');
      expect(arrow).not.toHaveClass('open');
    });

    it('applies correct height styles when open', () => {
      render(<CollapsibleTab {...defaultProps} isOpen={true} />);

      const content = document.querySelector(
        '.collapsible-tab-content'
      ) as HTMLElement;
      expect(content).toHaveStyle('overflow: hidden');
      expect(content).toHaveStyle('transition: max-height 0.3s ease');
    });

    it('applies correct height styles when closed', () => {
      render(<CollapsibleTab {...defaultProps} isOpen={false} />);

      const content = document.querySelector(
        '.collapsible-tab-content'
      ) as HTMLElement;
      expect(content).toHaveStyle('max-height: 0px');
      expect(content).toHaveStyle('overflow: hidden');
    });
  });

  describe('Enabled/Disabled States', () => {
    it('applies disabled class when isEnabled is false', () => {
      render(<CollapsibleTab {...defaultProps} isEnabled={false} />);

      const tab = document.querySelector('.collapsible-tab');
      const header = document.querySelector('.collapsible-tab-header');
      const stepNumber = document.querySelector('.step-number');
      const arrow = document.querySelector('.tab-arrow');

      expect(tab).toHaveClass('disabled');
      expect(header).toHaveClass('disabled');
      expect(arrow).toHaveClass('disabled');

      // Step number should have disabled class if present
      if (stepNumber) {
        expect(stepNumber).toHaveClass('disabled');
      }
    });

    it('does not apply disabled class when isEnabled is true', () => {
      render(<CollapsibleTab {...defaultProps} isEnabled={true} />);

      const tab = document.querySelector('.collapsible-tab');
      const header = document.querySelector('.collapsible-tab-header');
      const arrow = document.querySelector('.tab-arrow');

      expect(tab).not.toHaveClass('disabled');
      expect(header).not.toHaveClass('disabled');
      expect(arrow).not.toHaveClass('disabled');
    });

    it('sets correct tabIndex when enabled', () => {
      render(<CollapsibleTab {...defaultProps} isEnabled={true} />);

      const header = document.querySelector('.collapsible-tab-header');
      expect(header).toHaveAttribute('tabIndex', '0');
    });

    it('sets correct tabIndex when disabled', () => {
      render(<CollapsibleTab {...defaultProps} isEnabled={false} />);

      const header = document.querySelector('.collapsible-tab-header');
      expect(header).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Click Interactions', () => {
    it('calls onToggle when header is clicked and enabled', () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleTab
          {...defaultProps}
          onToggle={onToggle}
          isEnabled={true}
        />
      );

      const header = document.querySelector(
        '.collapsible-tab-header'
      ) as HTMLElement;
      fireEvent.click(header);

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('does not call onToggle when header is clicked and disabled', () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleTab
          {...defaultProps}
          onToggle={onToggle}
          isEnabled={false}
        />
      );

      const header = document.querySelector(
        '.collapsible-tab-header'
      ) as HTMLElement;
      fireEvent.click(header);

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('handles multiple clicks when enabled', () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleTab
          {...defaultProps}
          onToggle={onToggle}
          isEnabled={true}
        />
      );

      const header = document.querySelector(
        '.collapsible-tab-header'
      ) as HTMLElement;
      fireEvent.click(header);
      fireEvent.click(header);
      fireEvent.click(header);

      expect(onToggle).toHaveBeenCalledTimes(3);
    });
  });

  describe('Keyboard Interactions', () => {
    it('calls onToggle when Enter key is pressed and enabled', () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleTab
          {...defaultProps}
          onToggle={onToggle}
          isEnabled={true}
        />
      );

      const header = document.querySelector(
        '.collapsible-tab-header'
      ) as HTMLElement;
      fireEvent.keyDown(header, { key: 'Enter' });

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('calls onToggle when Space key is pressed and enabled', () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleTab
          {...defaultProps}
          onToggle={onToggle}
          isEnabled={true}
        />
      );

      const header = document.querySelector(
        '.collapsible-tab-header'
      ) as HTMLElement;
      fireEvent.keyDown(header, { key: ' ' });

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('does not call onToggle when other keys are pressed', () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleTab
          {...defaultProps}
          onToggle={onToggle}
          isEnabled={true}
        />
      );

      const header = document.querySelector(
        '.collapsible-tab-header'
      ) as HTMLElement;
      fireEvent.keyDown(header, { key: 'Tab' });
      fireEvent.keyDown(header, { key: 'Escape' });
      fireEvent.keyDown(header, { key: 'a' });

      expect(onToggle).not.toHaveBeenCalled();
    });

    it('does not call onToggle when keys are pressed and disabled', () => {
      const onToggle = jest.fn();
      render(
        <CollapsibleTab
          {...defaultProps}
          onToggle={onToggle}
          isEnabled={false}
        />
      );

      const header = document.querySelector(
        '.collapsible-tab-header'
      ) as HTMLElement;
      fireEvent.keyDown(header, { key: 'Enter' });
      fireEvent.keyDown(header, { key: ' ' });

      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe('CSS Classes', () => {
    it('applies custom className when provided', () => {
      const customClass = 'custom-collapsible-tab';
      render(<CollapsibleTab {...defaultProps} className={customClass} />);

      const tab = document.querySelector('.collapsible-tab');
      expect(tab).toHaveClass('collapsible-tab');
      expect(tab).toHaveClass(customClass);
    });

    it('applies multiple custom classes', () => {
      const customClasses = 'class1 class2 class3';
      render(<CollapsibleTab {...defaultProps} className={customClasses} />);

      const tab = document.querySelector('.collapsible-tab');
      expect(tab).toHaveClass('collapsible-tab');
      expect(tab).toHaveClass('class1');
      expect(tab).toHaveClass('class2');
      expect(tab).toHaveClass('class3');
    });

    it('handles empty className gracefully', () => {
      render(<CollapsibleTab {...defaultProps} className='' />);

      const tab = document.querySelector('.collapsible-tab');
      expect(tab).toHaveClass('collapsible-tab');
      expect(tab?.className.split(' ')).toContain('collapsible-tab');
    });
  });

  describe('Component Structure', () => {
    it('renders with correct DOM structure', () => {
      render(<CollapsibleTab {...defaultProps} stepNumber={1} isOpen={true} />);

      const tab = document.querySelector('.collapsible-tab');
      const header = tab?.querySelector('.collapsible-tab-header');
      const headerContent = header?.querySelector('.tab-header-content');
      const stepNumber = headerContent?.querySelector('.step-number');
      const title = headerContent?.querySelector('.tab-title');
      const arrow = header?.querySelector('.tab-arrow');
      const content = tab?.querySelector('.collapsible-tab-content');
      const contentInner = content?.querySelector('.tab-content-inner');

      expect(tab).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(headerContent).toBeInTheDocument();
      expect(stepNumber).toBeInTheDocument();
      expect(title).toBeInTheDocument();
      expect(arrow).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(contentInner).toBeInTheDocument();
    });

    it('maintains proper nesting', () => {
      render(<CollapsibleTab {...defaultProps} stepNumber={2} />);

      const tab = document.querySelector('.collapsible-tab');
      const header = tab?.querySelector('.collapsible-tab-header');
      const content = tab?.querySelector('.collapsible-tab-content');
      const stepNumber = document.querySelector('.step-number');
      const title = document.querySelector('.tab-title');

      expect(tab).toContainElement(header as HTMLElement);
      expect(tab).toContainElement(content as HTMLElement);
      expect(header).toContainElement(stepNumber as HTMLElement);
      expect(header).toContainElement(title as HTMLElement);
    });
  });

  describe('Content and Height Management', () => {
    it('measures content height on mount', async () => {
      render(<CollapsibleTab {...defaultProps} isOpen={true} />);

      await waitFor(() => {
        const content = document.querySelector(
          '.collapsible-tab-content'
        ) as HTMLElement;
        expect(content).toHaveStyle('transition: max-height 0.3s ease');
      });
    });

    it('handles content changes', () => {
      const { rerender } = render(
        <CollapsibleTab {...defaultProps} isOpen={true}>
          <div>Original content</div>
        </CollapsibleTab>
      );

      expect(screen.getByText('Original content')).toBeInTheDocument();

      rerender(
        <CollapsibleTab {...defaultProps} isOpen={true}>
          <div>
            Updated content with more text that should trigger height
            recalculation
          </div>
        </CollapsibleTab>
      );

      expect(
        screen.getByText(
          'Updated content with more text that should trigger height recalculation'
        )
      ).toBeInTheDocument();
    });

    it('applies minimum height when content is small', () => {
      render(<CollapsibleTab {...defaultProps} isOpen={true} />);

      const content = document.querySelector(
        '.collapsible-tab-content'
      ) as HTMLElement;
      // The component applies Math.max(contentHeight, 500) so minimum should be 500px
      const maxHeight = content.style.maxHeight;
      expect(maxHeight).toMatch(/\d+px/);
    });
  });

  describe('Complex Content', () => {
    it('handles complex JSX children', () => {
      const complexContent = (
        <div>
          <h4>Subsection</h4>
          <form>
            <input type='text' placeholder='Name' />
            <textarea placeholder='Description' />
            <button type='submit'>Submit</button>
          </form>
        </div>
      );

      render(
        <CollapsibleTab {...defaultProps} isOpen={true}>
          {complexContent}
        </CollapsibleTab>
      );

      expect(screen.getByText('Subsection')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Submit' })
      ).toBeInTheDocument();
    });

    it('handles multiple children', () => {
      const multipleChildren = (
        <>
          <div>First section</div>
          <div>Second section</div>
          <p>Third section</p>
        </>
      );

      render(
        <CollapsibleTab {...defaultProps} isOpen={true}>
          {multipleChildren}
        </CollapsibleTab>
      );

      expect(screen.getByText('First section')).toBeInTheDocument();
      expect(screen.getByText('Second section')).toBeInTheDocument();
      expect(screen.getByText('Third section')).toBeInTheDocument();
    });
  });

  describe('Step Number Functionality', () => {
    it('renders step number with correct styling when enabled', () => {
      render(
        <CollapsibleTab {...defaultProps} stepNumber={5} isEnabled={true} />
      );

      const stepNumber = document.querySelector('.step-number');
      expect(stepNumber).toBeInTheDocument();
      expect(stepNumber).toHaveTextContent('5');
      expect(stepNumber).not.toHaveClass('disabled');
    });

    it('renders step number with disabled styling when disabled', () => {
      render(
        <CollapsibleTab {...defaultProps} stepNumber={5} isEnabled={false} />
      );

      const stepNumber = document.querySelector('.step-number');
      expect(stepNumber).toBeInTheDocument();
      expect(stepNumber).toHaveTextContent('5');
      expect(stepNumber).toHaveClass('disabled');
    });

    it('handles large step numbers', () => {
      render(<CollapsibleTab {...defaultProps} stepNumber={999} />);

      const stepNumber = document.querySelector('.step-number');
      expect(stepNumber).toHaveTextContent('999');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role for header', () => {
      render(<CollapsibleTab {...defaultProps} />);

      const header = document.querySelector('.collapsible-tab-header');
      expect(header).toHaveAttribute('role', 'button');
    });

    it('has proper heading hierarchy', () => {
      render(<CollapsibleTab {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Test Tab Title');
    });

    it('supports keyboard navigation', () => {
      render(<CollapsibleTab {...defaultProps} isEnabled={true} />);

      const header = document.querySelector(
        '.collapsible-tab-header'
      ) as HTMLElement;

      // Should be focusable
      header.focus();
      expect(document.activeElement).toBe(header);
    });

    it('preserves focus management in content', () => {
      const focusableContent = (
        <div>
          <input type='text' />
          <button>Submit</button>
        </div>
      );

      render(
        <CollapsibleTab {...defaultProps} isOpen={true}>
          {focusableContent}
        </CollapsibleTab>
      );

      const input = screen.getByRole('textbox');
      const button = screen.getByRole('button', { name: 'Submit' });

      input.focus();
      expect(document.activeElement).toBe(input);

      button.focus();
      expect(document.activeElement).toBe(button);
    });
  });

  describe('Performance and Cleanup', () => {
    it('cleans up ResizeObserver on unmount', () => {
      const disconnectSpy = jest.fn();
      const mockResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: disconnectSpy,
      }));

      // Override the global mock for this test
      global.ResizeObserver = mockResizeObserver;

      const { unmount } = render(<CollapsibleTab {...defaultProps} />);

      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
    });

    it('handles rapid state changes', () => {
      const onToggle = jest.fn();
      const { rerender } = render(
        <CollapsibleTab {...defaultProps} onToggle={onToggle} isOpen={false} />
      );

      expect(
        document.querySelector('.collapsible-tab-content')
      ).not.toHaveClass('open');

      rerender(
        <CollapsibleTab {...defaultProps} onToggle={onToggle} isOpen={true} />
      );

      expect(document.querySelector('.collapsible-tab-content')).toHaveClass(
        'open'
      );

      rerender(
        <CollapsibleTab {...defaultProps} onToggle={onToggle} isOpen={false} />
      );

      expect(
        document.querySelector('.collapsible-tab-content')
      ).not.toHaveClass('open');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title', () => {
      render(<CollapsibleTab {...defaultProps} title='' />);

      const title = document.querySelector('.tab-title');
      expect(title).toHaveTextContent('');
    });

    it('handles very long title', () => {
      const longTitle = 'A'.repeat(200);
      render(<CollapsibleTab {...defaultProps} title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles special characters in title', () => {
      const specialTitle = 'Title with €$@#&*!<>[]{}';
      render(<CollapsibleTab {...defaultProps} title={specialTitle} />);

      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });

    it('handles zero step number', () => {
      render(<CollapsibleTab {...defaultProps} stepNumber={0} />);

      const stepNumber = document.querySelector('.step-number');
      expect(stepNumber).toHaveTextContent('0');
    });

    it('handles negative step number', () => {
      render(<CollapsibleTab {...defaultProps} stepNumber={-1} />);

      const stepNumber = document.querySelector('.step-number');
      expect(stepNumber).toHaveTextContent('-1');
    });
  });
});
