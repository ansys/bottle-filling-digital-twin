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
 * WorkflowPage Component
 *
 * Manages the multi-step workflow for the application based on Redux state
 */

import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Navigate } from 'react-router-dom';
import type { RootState } from '@/store';
import { Forms } from '@/store/slices/applicationSlice.ts';
import { AppOnlyForm } from '@/components';
import Loading from '@/components/Loading';
import { Header } from '@/components';
import SimpleNavigation from '@/components/SimpleNavigation';
import styles from './WorkflowPage.module.css';

// Map state from Redux store to component props
const mapStateToProps = (state: RootState) => ({
  currentForm: state.application.currentForm,
  isLoading:
    state.application.isCreatingSession ||
    state.application.isLoadingApplications ||
    state.application.isLoadingVersions ||
    state.application.isLoadingProfiles,
  error: state.application.error,
  useSimulationUI: state.application.useSimulationUI,
});

// Create connector
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

/**
 * WorkflowPage Component
 *
 * Routes between different forms based on the current form state
 */
class WorkflowPageBase extends Component<PropsFromRedux> {
  /**
   * Header Settings and functions
   */
  appName: string = 'Bottle Filling Digital Twin';
  handleSettingsClick = (): void => {
    console.log('Settings clicked');
    // TODO: Implement settings dialog or navigation
  };

  handleHelpClick = (): void => {
    console.log('Help clicked');
    // TODO: Implement help dialog or documentation
  };

  handleProfileClick = (): void => {
    console.log('Profile clicked');
    // TODO: Implement user profile or dropdown menu
  };

  handleThemeClick = (): void => {
    console.log('Theme toggled');
    // Theme switching is handled automatically by the Header component
  };

  /**
   * Renders the appropriate form component based on current state
   */
  private renderCurrentForm(): React.ReactNode {
    const { currentForm, isLoading } = this.props;

    if (isLoading) {
      return <Loading message='Processing...' />;
    }

    switch (currentForm) {
      case Forms.APP_ONLY:
        return <AppOnlyForm />;

      case Forms.STREAM_URLS:
        return (
          <div className={styles.placeholder}>
            <h2>Server URLs Form</h2>
            <p>This form will collect server configuration.</p>
            <p>Current form: {currentForm}</p>
            <p>
              Simulation UI enabled: {this.props.useSimulationUI ? 'Yes' : 'No'}
            </p>
          </div>
        );

      case Forms.APPLICATIONS:
        return (
          <div className={styles.placeholder}>
            <h2>Applications Form</h2>
            <p>This form will show available applications.</p>
            <p>Current form: {currentForm}</p>
          </div>
        );

      case Forms.VERSIONS:
        return (
          <div className={styles.placeholder}>
            <h2>Versions Form</h2>
            <p>This form will show available versions.</p>
            <p>Current form: {currentForm}</p>
          </div>
        );

      case Forms.PROFILES:
        return (
          <div className={styles.placeholder}>
            <h2>Profiles Form</h2>
            <p>This form will show available profiles.</p>
            <p>Current form: {currentForm}</p>
          </div>
        );

      case Forms.STREAM:
        return (
          <div className={styles.placeholder}>
            <h2>Streaming View</h2>
            <p>This will show the streaming interface.</p>
            <p>Current form: {currentForm}</p>
          </div>
        );

      case Forms.SIMULATION:
        // Redirect to dedicated simulation page using React Router
        return <Navigate to='/simulation' replace />;

      case Forms.IDLE:
      default:
        return (
          <div className={styles.placeholder}>
            <SimpleNavigation />
          </div>
        );
    }
  }

  render(): React.ReactNode {
    const { error } = this.props;

    return (
      <div className={styles.workflowPage}>
        <Header
          appName={this.appName}
          onSettingsClick={this.handleSettingsClick}
          onHelpClick={this.handleHelpClick}
          onProfileClick={this.handleProfileClick}
          onThemeClick={this.handleThemeClick}
        />
        {/* Error Banner */}
        {error && (
          <div className={styles.errorBanner}>
            <p>Error: {error}</p>
          </div>
        )}

        <main className={styles.content}>{this.renderCurrentForm()}</main>
      </div>
    );
  }
}

// Export the connected component
export const WorkflowPage = connector(WorkflowPageBase);
export default WorkflowPage;
