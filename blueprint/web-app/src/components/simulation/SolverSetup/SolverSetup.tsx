/**
 * SolverSetup Component
 *
 * Pure UI component for solver configuration and design file selection
 */

import React, { Component } from 'react';
import './SolverSetup.css';

export interface DesignFile {
  id: string;
  name: string;
  url: string;
  description?: string;
}

export interface SolverSetupProps {
  // Design files and selection
  designFiles: DesignFile[];
  selectedDesignFileId: string | null;

  // Solver configuration
  selectedResolution: string;

  // Loading states
  isLoading: boolean;
  isOpening: boolean;

  // UI configuration
  width?: number;

  // Event handlers
  onSelectDesignFile: (designFileId: string) => void;
  onSelectResolution: (resolution: string) => void;
  onOpenDesignFile: () => void;
}

export interface SolverSetupState {
  // Local UI state for optimization
  isHovered: boolean;
  focusedElement: string | null;
}

export class SolverSetup extends Component<SolverSetupProps, SolverSetupState> {
  constructor(props: SolverSetupProps) {
    super(props);

    this.state = {
      isHovered: false,
      focusedElement: null,
    };
  }

  /**
   * Handle design file selection change
   */
  private handleDesignFileChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const selectedId = event.target.value;
    if (selectedId && selectedId !== 'none') {
      this.props.onSelectDesignFile(selectedId);
    }
  };

  /**
   * Handle resolution selection change
   */
  private handleResolutionChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    this.props.onSelectResolution(event.target.value);
  };

  /**
   * Handle open button click
   */
  private handleOpenClick = (): void => {
    if (this.props.selectedDesignFileId && !this.props.isOpening) {
      this.props.onOpenDesignFile();
    }
  };

  /**
   * Handle focus events for accessibility
   */
  private handleFocus = (elementId: string): void => {
    this.setState({ focusedElement: elementId });
  };

  private handleBlur = (): void => {
    this.setState({ focusedElement: null });
  };

  /**
   * Handle hover events for enhanced UX
   */
  private handleMouseEnter = (): void => {
    this.setState({ isHovered: true });
  };

  private handleMouseLeave = (): void => {
    this.setState({ isHovered: false });
  };

  /**
   * Render design file selector
   */
  private renderDesignFileSelector(): JSX.Element {
    const { designFiles, selectedDesignFileId, isLoading } = this.props;
    const { focusedElement } = this.state;

    return (
      <div className='solver-setup__selector'>
        <label htmlFor='design-file-select' className='solver-setup__label'>
          Design File
        </label>

        <select
          id='design-file-select'
          className={`solver-setup__select ${
            focusedElement === 'design-file'
              ? 'solver-setup__select--focused'
              : ''
          }`}
          value={selectedDesignFileId || 'none'}
          onChange={this.handleDesignFileChange}
          onFocus={() => this.handleFocus('design-file')}
          onBlur={this.handleBlur}
          disabled={isLoading || designFiles.length === 0}
          aria-label='Select design file'
        >
          <option value='none' disabled>
            {isLoading ? 'Loading...' : 'Select a design file'}
          </option>

          {designFiles.map(file => (
            <option key={file.id} value={file.id} title={file.description}>
              {file.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  /**
   * Render resolution selector
   */
  private renderResolutionSelector(): JSX.Element {
    const { selectedResolution } = this.props;
    const { focusedElement } = this.state;

    return (
      <div className='solver-setup__selector'>
        <label htmlFor='resolution-select' className='solver-setup__label'>
          Resolution
        </label>

        <select
          id='resolution-select'
          className={`solver-setup__select ${
            focusedElement === 'resolution'
              ? 'solver-setup__select--focused'
              : ''
          }`}
          value={selectedResolution}
          onChange={this.handleResolutionChange}
          onFocus={() => this.handleFocus('resolution')}
          onBlur={this.handleBlur}
          aria-label='Select mesh resolution'
        >
          <option value='400k'>400k cells</option>
        </select>
      </div>
    );
  }

  /**
   * Render action buttons
   */
  private renderActionButtons(): JSX.Element {
    const { selectedDesignFileId, isOpening } = this.props;

    const canOpen = selectedDesignFileId && !isOpening;

    return (
      <div className='solver-setup__actions'>
        <button
          type='button'
          className={`solver-setup__button solver-setup__button--primary ${
            !canOpen ? 'solver-setup__button--disabled' : ''
          }`}
          onClick={this.handleOpenClick}
          disabled={!canOpen}
          aria-label={
            isOpening ? 'Opening design file...' : 'Open selected design file'
          }
        >
          {isOpening ? (
            <>
              <span className='solver-setup__spinner' />
              Opening...
            </>
          ) : (
            'Open Design File'
          )}
        </button>
      </div>
    );
  }

  render(): JSX.Element {
    const { width, isLoading } = this.props;
    const { isHovered } = this.state;

    return (
      <div
        className={`solver-setup ${
          isHovered ? 'solver-setup--hovered' : ''
        } ${isLoading ? 'solver-setup--loading' : ''}`}
        style={{ width: width ? `${width}px` : '100%' }}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
      >
        <div className='solver-setup__header'>
          <h3 className='solver-setup__title'>Solver Configuration</h3>
          <p className='solver-setup__description'>
            Select design file and mesh resolution for your simulation
          </p>
        </div>

        <div className='solver-setup__content'>
          {this.renderDesignFileSelector()}
          {this.renderResolutionSelector()}
        </div>

        {this.renderActionButtons()}

        {isLoading && (
          <div className='solver-setup__loading-overlay'>
            <div className='solver-setup__loading-spinner' />
            <p>Loading solver configuration...</p>
          </div>
        )}
      </div>
    );
  }
}

export default SolverSetup;
