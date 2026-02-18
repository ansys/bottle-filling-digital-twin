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
 * FluentSolutionVariables Component - Initial Conditions
 *
 * Exact replica of the old frontend FluentSolutionVariables component
 */

import React, { Component } from 'react';
import './FluentSolutionVariables.css';

// Types (matching old frontend exactly)
export interface SolutionVariable {
  name: string;
  sv: string;
}

export interface FluentSolutionVariablesProps {
  width: number;
  fluentSolutionVariables: SolutionVariable[];
  selectedSolutionVariable?: string;
  onSelectFluentSolutionVariables: (sv: SolutionVariable) => void;
  onVisualize: (
    fillingHeight: number,
    freeSurfaceOnly: boolean,
    sv?: string
  ) => void;
  enabled: boolean; // This will be canInitialize from Redux
  isLoading?: boolean; // Add loading state like SolverSetup
  statusText?: string | null; // Progress text from Omniverse Kit
}

interface FluentSolutionVariablesState {
  selectedFluentSolutionVariablesIndex: number | null;
  fillingHeight: number;
  freeSurfaceOnly: boolean;
}

export default class FluentSolutionVariables extends Component<
  FluentSolutionVariablesProps,
  FluentSolutionVariablesState
> {
  constructor(props: FluentSolutionVariablesProps) {
    super(props);
    // Initialize state with the index of the asset matching the initial URL if provided
    this.state = {
      fillingHeight: 28, // Default value from old frontend
      freeSurfaceOnly: true,
      selectedFluentSolutionVariablesIndex: this._findAssetIndexByUrl(
        props.selectedSolutionVariable
      ),
    };
  }

  /**
   * Handle selection in list.
   */
  _handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIndex = parseInt(event.target.value, 10);
    this.setState({ selectedFluentSolutionVariablesIndex: selectedIndex });
    if (this.props.onSelectFluentSolutionVariables) {
      this.props.onSelectFluentSolutionVariables(
        this.props.fluentSolutionVariables[selectedIndex]
      );
    }
  };

  _onFillingHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ fillingHeight: parseFloat(event.target.value) });
  };

  _onFreeSurfaceOnlyChange = (isChecked: boolean) => {
    this.setState({ freeSurfaceOnly: isChecked });
  };

  _onVisualize = () => {
    // Get the selected solution variable's sv value like old frontend
    const selectedIndex = this.state.selectedFluentSolutionVariablesIndex;
    if (selectedIndex !== null && selectedIndex >= 0) {
      const selectedVariable =
        this.props.fluentSolutionVariables[selectedIndex];
      this.props.onVisualize(
        this.state.fillingHeight,
        this.state.freeSurfaceOnly,
        selectedVariable.sv
      );
    } else {
      // Fallback to first solution variable if none selected
      const firstSv = this.props.fluentSolutionVariables[0];
      if (firstSv) {
        this.props.onVisualize(
          this.state.fillingHeight,
          this.state.freeSurfaceOnly,
          firstSv.sv
        );
      }
    }
  };

  /**
   * Update state if the selectedAssetUrl prop changes.
   */
  componentDidUpdate(prevProps: FluentSolutionVariablesProps) {
    if (
      prevProps.selectedSolutionVariable !== this.props.selectedSolutionVariable
    ) {
      const newIndex = this._findAssetIndexByUrl(
        this.props.selectedSolutionVariable
      );
      if (newIndex !== this.state.selectedFluentSolutionVariablesIndex) {
        this.setState({ selectedFluentSolutionVariablesIndex: newIndex });
      }
    }
  }

  /**
   * Find index of asset by url.
   */
  private _findAssetIndexByUrl(sv?: string): number {
    return this.props.fluentSolutionVariables.findIndex(
      asset => asset.sv === sv
    );
  }

  /**
   * Render the selector.
   */
  private _renderSelector(): JSX.Element {
    const options = this.props.fluentSolutionVariables.map((asset, index) => (
      <option key={index} value={index}>
        {asset.name}
      </option>
    ));

    return (
      <select
        className='fluent-solution-variables__select'
        onChange={this._handleSelectChange}
        value={this.state.selectedFluentSolutionVariablesIndex || ''}
        disabled={!this.props.enabled}
        aria-label='Select solution variable'
      >
        {options}
      </select>
    );
  }

  render() {
    const { enabled, isLoading, width } = this.props;
    const { fillingHeight } = this.state;
    const { freeSurfaceOnly } = this.state;

    return (
      <div
        className={`fluent-solution-variables ${
          !enabled ? 'fluent-solution-variables--disabled' : ''
        }`}
        style={{ width: width ? `${width}px` : '100%' }}
      >
        <div className='fluent-solution-variables__header'>
          <h3 className='fluent-solution-variables__title'>
            Initial Conditions
          </h3>
          <p className='fluent-solution-variables__description'>
            Configure filling height and solution variables for initialization
          </p>
        </div>

        <div className='fluent-solution-variables__content'>
          <div className='fluent-solution-variables__field'>
            <label
              className='fluent-solution-variables__label'
              htmlFor='filling-height'
            >
              Filling Height: {fillingHeight} mm
            </label>
            <input
              type='range'
              className='fluent-solution-variables__slider'
              id='filling-height'
              name='filling-height'
              onInput={this._onFillingHeightChange}
              value={fillingHeight}
              min='5'
              max='30'
              step='0.1'
              disabled={!enabled}
            />
          </div>

          <div className='fluent-solution-variables__field'>
            <label
              className='fluent-solution-variables__label'
              htmlFor='solution-variable-select'
            >
              Solution Variable for Colors
            </label>
            {this._renderSelector()}
          </div>

          <div className='fluent-solution-variables__field'>
            <label className='fluent-solution-variables__checkbox-label'>
              <input
                type='checkbox'
                className='fluent-solution-variables__checkbox'
                checked={freeSurfaceOnly}
                onChange={e => this._onFreeSurfaceOnlyChange(e.target.checked)}
              />
              <span>Free surface only</span>
            </label>
          </div>
        </div>

        <div className='fluent-solution-variables__actions'>
          <button
            type='button'
            className={`fluent-solution-variables__button fluent-solution-variables__button--primary ${
              !enabled || isLoading
                ? 'fluent-solution-variables__button--disabled'
                : ''
            }`}
            onClick={this._onVisualize}
            disabled={!enabled || isLoading}
          >
            {isLoading ? (
              <>
                <span className='fluent-solution-variables__spinner' />
                Initializing...
              </>
            ) : (
              'Initialize'
            )}
          </button>
        </div>

        {isLoading && (
          <div className='fluent-solution-variables__loading-overlay'>
            <div className='fluent-solution-variables__loading-spinner' />
            <p>{this.props.statusText || 'Processing solution variables...'}</p>
          </div>
        )}
      </div>
    );
  }
}
