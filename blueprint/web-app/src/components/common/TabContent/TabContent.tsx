/**
 * Standardized Tab Content Wrapper Component
 *
 * Provides consistent styling for all tab content components
 */

import React from 'react';

export interface TabContentProps {
  children: React.ReactNode;
  className?: string;
}

const TabContent: React.FC<TabContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={`tab-content-wrapper ${className}`}>{children}</div>;
};

export default TabContent;
