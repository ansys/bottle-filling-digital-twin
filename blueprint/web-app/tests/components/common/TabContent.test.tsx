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

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TabContent from '@/components/common/TabContent/TabContent.tsx';

describe('TabContent Component', () => {
  describe('Basic Rendering', () => {
    it('renders children content correctly', () => {
      const testContent = 'This is tab content';
      render(<TabContent>{testContent}</TabContent>);

      expect(screen.getByText(testContent)).toBeInTheDocument();
    });

    it('renders complex JSX children', () => {
      const complexContent = (
        <div>
          <h2>Title</h2>
          <p>Paragraph content</p>
          <button>Action Button</button>
        </div>
      );

      render(<TabContent>{complexContent}</TabContent>);

      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph content')).toBeInTheDocument();
      expect(screen.getByText('Action Button')).toBeInTheDocument();
    });

    it('renders multiple children', () => {
      render(
        <TabContent>
          <div>First child</div>
          <div>Second child</div>
          <span>Third child</span>
        </TabContent>
      );

      expect(screen.getByText('First child')).toBeInTheDocument();
      expect(screen.getByText('Second child')).toBeInTheDocument();
      expect(screen.getByText('Third child')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('applies default CSS class', () => {
      render(<TabContent>Test content</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('tab-content-wrapper');
      expect(wrapper).toHaveTextContent('Test content');
    });

    it('applies custom className when provided', () => {
      const customClass = 'custom-tab-content';
      render(<TabContent className={customClass}>Test content</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('tab-content-wrapper');
      expect(wrapper).toHaveClass(customClass);
    });

    it('applies multiple custom classes', () => {
      const customClasses = 'class1 class2 class3';
      render(<TabContent className={customClasses}>Test content</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('tab-content-wrapper');
      expect(wrapper).toHaveClass('class1');
      expect(wrapper).toHaveClass('class2');
      expect(wrapper).toHaveClass('class3');
    });

    it('handles empty className gracefully', () => {
      render(<TabContent className=''>Test content</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('tab-content-wrapper');
      expect(wrapper?.className.trim()).toBe('tab-content-wrapper');
    });

    it('handles undefined className', () => {
      render(<TabContent className={undefined}>Test content</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('tab-content-wrapper');
    });
  });

  describe('Component Structure', () => {
    it('renders with correct DOM structure', () => {
      render(<TabContent>Test content</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveTextContent('Test content');
    });

    it('maintains proper nesting for complex content', () => {
      render(
        <TabContent>
          <div className='outer'>
            <div className='inner'>Nested content</div>
          </div>
        </TabContent>
      );

      const wrapper = document.querySelector('.tab-content-wrapper');
      const outer = wrapper?.querySelector('.outer');
      const inner = outer?.querySelector('.inner');

      expect(wrapper).toContainElement(outer as HTMLElement);
      expect(outer).toContainElement(inner as HTMLElement);
      expect(inner).toHaveTextContent('Nested content');
    });
  });

  describe('Props Handling', () => {
    it('handles all props correctly', () => {
      const content = <p>Paragraph content</p>;
      const className = 'special-tab-content';

      render(<TabContent className={className}>{content}</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('tab-content-wrapper');
      expect(wrapper).toHaveClass(className);
      expect(screen.getByText('Paragraph content')).toBeInTheDocument();
    });

    it('handles prop changes correctly', () => {
      const { rerender } = render(
        <TabContent className='initial-class'>Initial content</TabContent>
      );

      let wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('tab-content-wrapper');
      expect(wrapper).toHaveClass('initial-class');

      rerender(
        <TabContent className='updated-class'>Updated content</TabContent>
      );

      wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toHaveClass('tab-content-wrapper');
      expect(wrapper).toHaveClass('updated-class');
      expect(wrapper).not.toHaveClass('initial-class');
    });
  });

  describe('Content Types', () => {
    it('handles string content', () => {
      const stringContent = 'Simple string content';
      render(<TabContent>{stringContent}</TabContent>);

      expect(screen.getByText(stringContent)).toBeInTheDocument();
    });

    it('handles number content', () => {
      const numberContent = 42;
      render(<TabContent>{numberContent}</TabContent>);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('handles boolean content (should not render)', () => {
      render(<TabContent>{true}</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.textContent?.trim()).toBe('');
    });

    it('handles null content', () => {
      render(<TabContent>{null}</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.textContent?.trim()).toBe('');
    });

    it('handles undefined content', () => {
      render(<TabContent>{undefined}</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.textContent?.trim()).toBe('');
    });

    it('handles array of elements', () => {
      const arrayContent = [
        <div key='1'>First item</div>,
        <div key='2'>Second item</div>,
        <div key='3'>Third item</div>,
      ];

      render(<TabContent>{arrayContent}</TabContent>);

      expect(screen.getByText('First item')).toBeInTheDocument();
      expect(screen.getByText('Second item')).toBeInTheDocument();
      expect(screen.getByText('Third item')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('preserves accessibility attributes from children', () => {
      render(
        <TabContent>
          <button aria-label='Close dialog'>×</button>
        </TabContent>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Close dialog');
    });

    it('maintains semantic HTML structure', () => {
      render(
        <TabContent>
          <article>
            <h2>Article Title</h2>
            <p>Article content</p>
          </article>
        </TabContent>
      );

      const article = screen.getByRole('article');
      const heading = screen.getByRole('heading', { level: 2 });

      expect(article).toBeInTheDocument();
      expect(heading).toBeInTheDocument();
      expect(article).toContainElement(heading);
    });

    it('supports interactive elements', () => {
      render(
        <TabContent>
          <input type='text' placeholder='Enter text' />
          <button type='submit'>Submit</button>
        </TabContent>
      );

      const input = screen.getByPlaceholderText('Enter text');
      const button = screen.getByRole('button');

      expect(input).toBeInTheDocument();
      expect(button).toBeInTheDocument();
    });
  });

  describe('Performance and Re-rendering', () => {
    it('re-renders when children change', () => {
      const { rerender } = render(<TabContent>Original content</TabContent>);

      expect(screen.getByText('Original content')).toBeInTheDocument();

      rerender(<TabContent>New content</TabContent>);

      expect(screen.getByText('New content')).toBeInTheDocument();
      expect(screen.queryByText('Original content')).not.toBeInTheDocument();
    });

    it('re-renders when className changes', () => {
      const { rerender } = render(
        <TabContent className='class1'>Content</TabContent>
      );

      let wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('class1');

      rerender(<TabContent className='class2'>Content</TabContent>);

      wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toHaveClass('class2');
      expect(wrapper).not.toHaveClass('class1');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty children gracefully', () => {
      render(<TabContent>{''}</TabContent>);

      const wrapper = document.querySelector('.tab-content-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper?.textContent).toBe('');
    });

    it('handles fragment children', () => {
      render(
        <TabContent>
          <>
            <div>Fragment child 1</div>
            <div>Fragment child 2</div>
          </>
        </TabContent>
      );

      expect(screen.getByText('Fragment child 1')).toBeInTheDocument();
      expect(screen.getByText('Fragment child 2')).toBeInTheDocument();
    });

    it('handles very large content', () => {
      const largeContent = 'A'.repeat(10000);
      render(<TabContent>{largeContent}</TabContent>);

      expect(screen.getByText(largeContent)).toBeInTheDocument();
    });

    it('handles special characters in content', () => {
      const specialContent = 'Content with special chars: €$@#&*!<>[]{}';
      render(<TabContent>{specialContent}</TabContent>);

      expect(screen.getByText(specialContent)).toBeInTheDocument();
    });
  });
});
