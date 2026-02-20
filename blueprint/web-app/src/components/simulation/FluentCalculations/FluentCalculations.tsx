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
 * Fluent Calculations Component - Calculations
 *
 * Exact replica of the old frontend FluentCalculations component
 */

import React from 'react';
import './FluentCalculations.css';

export interface FluentCalculationsProps {
  width: number;
  enabled: boolean; // This will be canRun from Redux (like old frontend)
  onCalculate: (
    numTimesteps: number,
    viscosity: number,
    bottlesPerHour: number,
    tolerance: number
  ) => void;
  isLoading?: boolean; // Add loading state like SolverSetup
  statusText?: string | null; // Progress text from Omniverse Kit
}

interface FluentCalculationsState {
  numTimesteps: number;
  bottlesPerHour: number;
  tolerance: number;
  viscosity: number;
}

export default class FluentCalculations extends React.Component<
  FluentCalculationsProps,
  FluentCalculationsState
> {
  constructor(props: FluentCalculationsProps) {
    super(props);
    this.state = {
      numTimesteps: 1,
      viscosity: 0.002,
      bottlesPerHour: 50000,
      tolerance: 0,
    };
  }

  _onCalculate = () => {
    this.props.onCalculate(
      this.state.numTimesteps,
      this.state.viscosity,
      this.state.bottlesPerHour,
      this.state.tolerance
    );
  };

  _onViscosityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ viscosity: parseFloat(event.target.value) });
  };

  _onBottlesPerHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ bottlesPerHour: parseInt(event.target.value) });
  };

  _onToleranceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ tolerance: parseFloat(event.target.value) });
  };

  _onTimestepsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ numTimesteps: parseFloat(event.target.value) });
  };

  render() {
    const { enabled, isLoading, width } = this.props;
    const { numTimesteps, viscosity, bottlesPerHour, tolerance } = this.state;

    return (
      <div
        className={`fluent-calculations ${
          !enabled ? 'fluent-calculations--disabled' : ''
        }`}
        style={{ width: width ? `${width}px` : '100%' }}
      >
        <div className='fluent-calculations__header'>
          <h3 className='fluent-calculations__title'>Calculations</h3>
          <p className='fluent-calculations__description'>
            Configure simulation parameters for calculation execution
          </p>
        </div>

        <div className='fluent-calculations__content'>
          <div className='fluent-calculations__field'>
            <label className='fluent-calculations__label'>
              Timesteps Resolution: x{numTimesteps}
            </label>
            <input
              type='range'
              className='fluent-calculations__slider'
              id='timesteps'
              onInput={this._onTimestepsChange}
              name='timesteps'
              value={numTimesteps}
              min='0.1'
              max='1'
              step='0.1'
              disabled={!enabled}
            />
          </div>

          <div className='fluent-calculations__field'>
            <label className='fluent-calculations__label'>
              Viscosity: {viscosity} (Pa.s)
            </label>
            <input
              type='range'
              className='fluent-calculations__slider'
              id='viscosity'
              name='viscosity'
              onInput={this._onViscosityChange}
              value={viscosity}
              min='0.001'
              max='0.004'
              step='0.001'
              disabled={!enabled}
            />
          </div>

          <div className='fluent-calculations__field'>
            <label className='fluent-calculations__label'>
              Bottles per Hour: {bottlesPerHour}
            </label>
            <input
              type='range'
              className='fluent-calculations__slider'
              id='bottles-per-hour'
              name='bottles-per-hour'
              onInput={this._onBottlesPerHourChange}
              value={bottlesPerHour}
              min='20000'
              max='100000'
              step='100'
              disabled={!enabled}
            />
          </div>

          <div className='fluent-calculations__field'>
            <label className='fluent-calculations__label'>
              Tolerance Sigma: {tolerance} mL
            </label>
            <input
              type='range'
              className='fluent-calculations__slider'
              id='tolerance'
              name='tolerance'
              onInput={this._onToleranceChange}
              value={tolerance}
              min='0'
              max='1'
              step='0.1'
              disabled={!enabled}
            />
          </div>
        </div>

        <div className='fluent-calculations__actions'>
          <button
            type='button'
            className={`fluent-calculations__button fluent-calculations__button--primary ${
              !enabled || isLoading
                ? 'fluent-calculations__button--disabled'
                : ''
            }`}
            onClick={this._onCalculate}
            disabled={!enabled || isLoading}
          >
            {isLoading ? (
              <>
                <span className='fluent-calculations__spinner' />
                Running...
              </>
            ) : (
              'Run'
            )}
          </button>
        </div>

        {isLoading && (
          <div className='fluent-calculations__loading-overlay'>
            <div className='fluent-calculations__loading-spinner' />
            <p>{this.props.statusText || 'Running calculations...'}</p>
          </div>
        )}
      </div>
    );
  }
}
