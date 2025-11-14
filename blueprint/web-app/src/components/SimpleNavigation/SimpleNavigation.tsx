/**
 * Simple Navigation Component
 *
 * Provides basic navigation between different application pages.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants';
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
