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
 * Simple Navigation Component
 *
 * Provides basic navigation between different application pages.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants';
import './SimpleNavigation.css';

interface NavigationItem {
  path: string;
  label: string;
  description: string;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    path: ROUTES.SIMULATION,
    label: 'Simulation',
    description: 'Run bottle filling simulations',
  },
  {
    path: ROUTES.REVIEWER,
    label: 'Reviewer',
    description: 'Review and analyze solved cases',
  },
  {
    path: ROUTES.STREAMING,
    label: 'Streaming',
    description: 'Live streaming interface',
  },
];

interface SimpleNavigationProps {
  className?: string;
}

const SimpleNavigation: React.FC<SimpleNavigationProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <nav className={`simple-navigation ${className || ''}`}>
      <div className='navigation-header'>
        <h3>Application Pages</h3>
        <p>Choose your workflow:</p>
      </div>

      <div className='navigation-items'>
        {NAVIGATION_ITEMS.map(item => (
          <button
            key={item.path}
            className={`navigation-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleNavigate(item.path)}
          >
            <div className='item-label'>{item.label}</div>
            <div className='item-description'>{item.description}</div>
          </button>
        ))}
      </div>

      <div className='current-path'>
        <small>Current page: {location.pathname}</small>
      </div>
    </nav>
  );
};

export default SimpleNavigation;
