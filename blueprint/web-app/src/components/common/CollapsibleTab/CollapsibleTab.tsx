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

/**
 * CollapsibleTab Component
 *
 * Reusable collapsible tab that containers can populate with their content.
 * Handles expand/collapse animation, loading states, and enabled/disabled states.
 */

import React, { useRef, useEffect, useState } from 'react';
import './CollapsibleTab.css';

export interface CollapsibleTabProps {
  /** Tab title displayed in header */
  title: string;
  /** Whether the tab is currently expanded */
  isOpen: boolean;
  /** Whether the tab can be interacted with */
  isEnabled: boolean;
  /** Whether to show loading spinner in header */
  isLoading?: boolean;
  /** Loading status text (optional) */
  statusText?: string;
  /** Content to render inside the tab */
  children: React.ReactNode;
  /** Callback when tab header is clicked */
  onToggle: () => void;
  /** Optional CSS class name */
  className?: string;
  /** Tab step number for visual indication */
  stepNumber?: number;
}

const CollapsibleTab: React.FC<CollapsibleTabProps> = ({
  title,
  isOpen,
  isEnabled,
  children,
  onToggle,
  className = '',
  stepNumber,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  // Measure content height when it changes
  useEffect(() => {
    if (!contentRef.current) return;

    const measureHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        setContentHeight(height);
      }
    };

    // Initial measurement
    measureHeight();

    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      measureHeight();
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [children, isOpen, title]);

  const handleHeaderClick = () => {
    if (isEnabled) {
      onToggle();
    }
  };

  return (
    <div
      className={`collapsible-tab ${className} ${!isEnabled ? 'disabled' : ''}`}
    >
      {/* Tab Header */}
      <div
        className={`collapsible-tab-header ${isOpen ? 'open' : ''} ${!isEnabled ? 'disabled' : ''}`}
        onClick={handleHeaderClick}
        role='button'
        tabIndex={isEnabled ? 0 : -1}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleHeaderClick();
          }
        }}
      >
        <div className='tab-header-content'>
          {/* Step Number */}
          {stepNumber !== undefined && (
            <div className={`step-number ${!isEnabled ? 'disabled' : ''}`}>
              {stepNumber}
            </div>
          )}

          {/* Tab Title */}
          <h3 className='tab-title'>{title}</h3>
        </div>

        {/* Expand/Collapse Arrow */}
        <div
          className={`tab-arrow ${isOpen ? 'open' : ''} ${!isEnabled ? 'disabled' : ''}`}
        >
          <svg width='16' height='16' viewBox='0 0 16 16' fill='currentColor'>
            <path d='M4.427 9.573a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0l3.5 3.5a.5.5 0 0 1-.708.708L8 6.146 4.573 9.573a.5.5 0 0 1-.708 0z' />
          </svg>
        </div>
      </div>

      {/* Tab Content */}
      <div
        className={`collapsible-tab-content ${isOpen ? 'open' : ''}`}
        style={{
          maxHeight: isOpen ? `${Math.max(contentHeight, 500)}px` : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.3s ease',
        }}
      >
        <div className='tab-content-inner' ref={contentRef}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleTab;
