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
 * AppOnlyForm Component
 *
 * Handles the initial persona/journey selection for the application.
 * This component is displayed when currentForm === Forms.APP_ONLY
 */

import React, { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '@/store';
import {
  Forms,
  setCurrentForm,
  setUseSimulationUI,
  StreamStatus,
  setStreamStatus,
} from '@/store/slices/applicationSlice.ts';
import { ROUTES } from '@/constants';
import styles from './AppOnlyForm.module.css';

// Map state from Redux store to component props
const mapStateToProps = (state: RootState) => ({
  useSimulationUI: state.application.useSimulationUI,
  currentForm: state.application.currentForm,
  isLoading: state.application.isCreatingSession,
});

// Map dispatch actions to component props
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  setUseSimulationUI: (useSimulationUI: boolean) =>
    dispatch(setUseSimulationUI(useSimulationUI)),
  setCurrentForm: (form: Forms) => dispatch(setCurrentForm(form)),
  setStreamStatus: (status: StreamStatus) => dispatch(setStreamStatus(status)),
});

// Create connector
const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

// Additional props for navigation
interface AppOnlyFormOwnProps {
  navigate?: (path: string) => void;
}

// Combined props type
type AppOnlyFormProps = PropsFromRedux & AppOnlyFormOwnProps;

// Component state interface
interface AppOnlyFormState {
  selectedPersona: 'simulation' | 'reviewer' | null;
}

/**
 * AppOnlyForm Component
 *
 * Presents the user with two journey options:
 * - Simulation Engineer: Advanced UI with full simulation controls
 * - Reviewer: Visualization-only mode for reviewing results
 */
class AppOnlyFormBase extends Component<AppOnlyFormProps, AppOnlyFormState> {
  constructor(props: PropsFromRedux) {
    super(props);

    this.state = {
      selectedPersona: props.useSimulationUI ? 'simulation' : 'reviewer',
    };

    // Bind methods
    this.handlePersonaSelection = this.handlePersonaSelection.bind(this);
    this.handleStartSimulation = this.handleStartSimulation.bind(this);
    this.handleViewResults = this.handleViewResults.bind(this);
    this.handleNext = this.handleNext.bind(this);
  }

  /**
   * Handles persona selection (Simulation Engineer vs Reviewer)
   */
  private handlePersonaSelection(persona: 'simulation' | 'reviewer'): void {
    this.setState({ selectedPersona: persona });
    this.props.setUseSimulationUI(persona === 'simulation');
  }

  /**
   * Handles "Start Simulation" button click
   */
  private handleStartSimulation(): void {
    this.handlePersonaSelection('simulation');
    this.handleNext();
  }

  /**
   * Handles "View Results" button click
   */
  private handleViewResults(): void {
    this.handlePersonaSelection('reviewer');
    this.handleNext();
  }

  /**
   * Proceeds to the next form based on configuration
   */
  private handleNext(): void {
    const { selectedPersona } = this.state;

    // Set stream status to initializing
    this.props.setStreamStatus(StreamStatus.IDLE);

    // Navigate to appropriate form based on persona selection
    if (selectedPersona === 'simulation') {
      // For simulation engineers, go directly to simulation interface
      this.props.setCurrentForm(Forms.SIMULATION);
    } else if (selectedPersona === 'reviewer') {
      // For reviewers, navigate to the reviewer page
      if (this.props.navigate) {
        this.props.navigate(ROUTES.REVIEWER);
      } else {
        // Fallback to form-based navigation if navigate is not available
        this.props.setCurrentForm(Forms.STREAM_URLS);
      }
    } else {
      // Default case
      this.props.setCurrentForm(Forms.STREAM_URLS);
    }
  }

  render(): React.ReactNode {
    const { selectedPersona } = this.state;
    const { isLoading } = this.props;

    return (
      <div className={styles.appOnlyForm}>
        <div className={styles.container}>
          <div className={styles.welcomeText}>
            <h2>Choose Your Journey</h2>
            <p>
              Welcome to Advanced simulation and visualization for bottle
              filling processes using Ansys Fluent and Nvidia Omniverse.
              <br />
              Select your role to access tailored tools and experiences designed
              for your workflow.
            </p>
          </div>

          <div className={styles.personaSelection}>
            {/* Simulation Engineer Card */}
            <div
              className={`${styles.personaCard} ${
                selectedPersona === 'simulation' ? styles.selected : ''
              }`}
              role='button'
              tabIndex={0}
              onClick={() => this.handlePersonaSelection('simulation')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this.handlePersonaSelection('simulation');
                }
              }}
              aria-label='Select Simulation Engineer persona'
            >
              <div className={styles.cardContent}>
                <h3>I am a Product Designer</h3>
                <p id='simulation-description'>
                  This path will give access to an advanced UI that provides
                  additional options for interacting with the simulation
                </p>
              </div>
            </div>

            {/* Reviewer Card */}
            <div
              className={`${styles.personaCard} ${
                selectedPersona === 'reviewer' ? styles.selected : ''
              }`}
              role='button'
              tabIndex={0}
              onClick={() => this.handlePersonaSelection('reviewer')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  this.handlePersonaSelection('reviewer');
                }
              }}
              aria-label='Select Reviewer persona'
            >
              <div className={styles.cardContent}>
                <h3>I am a Reviewer</h3>
                <p id='reviewer-description'>
                  This path will show you Real-time rendering and visualization
                  with Nvidia Omniverse. It includes visualizing simulation
                  results only.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <div className={styles.buttonGroup}>
              {selectedPersona === 'simulation' && (
                <button
                  type='button'
                  onClick={this.handleStartSimulation}
                  disabled={isLoading}
                  className={styles.actionButton}
                >
                  {isLoading ? 'Starting...' : 'Start Simulation'}
                </button>
              )}

              {selectedPersona === 'reviewer' && (
                <button
                  type='button'
                  onClick={this.handleViewResults}
                  disabled={isLoading}
                  className={styles.actionButton}
                >
                  {isLoading ? 'Loading...' : 'View Results'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// Create the connected component
const ConnectedAppOnlyForm = connector(AppOnlyFormBase);

// Wrapper component that provides navigation functionality

const AppOnlyFormWithNavigation: React.FC = () => {
  const navigate = useNavigate();

  return <ConnectedAppOnlyForm navigate={navigate} />;
};

// Export the wrapped component
export const AppOnlyForm = AppOnlyFormWithNavigation;
export default AppOnlyFormWithNavigation;
