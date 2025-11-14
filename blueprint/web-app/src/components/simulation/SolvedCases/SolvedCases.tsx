/**
 * SolvedCases Component - Solved Cases tab content
 * Refactored from common/SolvedCasesForm to reduce unnecessary layers
 */

import { Component } from 'react';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import './SolvedCases.css';

export interface SolvedCasesProps {
  width?: number;
  enabled?: boolean;
  solvedResults?: string[];
  selectedSolvedResults?: string;
  onStepCompleted?: () => void;
  onCaseChange?: (caseValue: string) => void;
  onVisualize?: (caseValue: string) => void;
  onRequestStoredResults?: () => void;
}

interface SolvedCasesState {
  localSelectedCase: string;
  hasLoaded: boolean;
}

export default class SolvedCases extends Component<
  SolvedCasesProps,
  SolvedCasesState
> {
  constructor(props: SolvedCasesProps) {
    super(props);

    const effectiveSolvedResults = this.getEffectiveSolvedResults();
    const effectiveSelectedResult =
      props.selectedSolvedResults || effectiveSolvedResults[0] || '';

    this.state = {
      localSelectedCase: effectiveSelectedResult,
      hasLoaded: false,
    };
  }

  componentDidUpdate(prevProps: SolvedCasesProps) {
    // Update local state if props change
    if (
      prevProps.selectedSolvedResults !== this.props.selectedSolvedResults ||
      prevProps.solvedResults !== this.props.solvedResults
    ) {
      const effectiveSolvedResults = this.getEffectiveSolvedResults();
      const effectiveSelectedResult =
        this.props.selectedSolvedResults || effectiveSolvedResults[0] || '';
      this.setState({ localSelectedCase: effectiveSelectedResult });
    }
  }

  getEffectiveSolvedResults = (): string[] => {
    const { solvedResults = [] } = this.props;
    return solvedResults.length > 0 ? solvedResults : ['Select a USD File'];
  };

  sendGetStoredResults = () => {
    try {
      const message = {
        event_type: 'getStoredResults',
        payload: { directory: 'stored' },
      };
      AppStreamer.sendMessage(JSON.stringify(message));
    } catch (error) {
      console.warn('Failed to send message to AppStreamer:', error);
    }
  };

  retrieveStoredCases = () => {
    const { onRequestStoredResults } = this.props;
    if (onRequestStoredResults) {
      console.log(
        'SolvedCases: Using container callback to request stored results'
      );
      onRequestStoredResults();
    } else {
      console.log(
        'SolvedCases: Using local function to request stored results'
      );
      this.sendGetStoredResults();
    }
  };

  handleCaseChange = (caseValue: string) => {
    this.setState({ localSelectedCase: caseValue });
    this.props.onCaseChange?.(caseValue);
  };

  handleFocus = () => {
    // Only fetch if we haven't loaded yet
    if (!this.state.hasLoaded) {
      this.retrieveStoredCases();
      this.setState({ hasLoaded: true });
    }
  };

  handleVisualize = () => {
    const { localSelectedCase } = this.state;
    if (!localSelectedCase) return;

    this.props.onVisualize?.(localSelectedCase);

    try {
      const message = {
        event_type: 'openSolvedCase',
        payload: { usdFile: localSelectedCase },
      };
      AppStreamer.sendMessage(JSON.stringify(message));
    } catch (error) {
      console.warn('Failed to send message to AppStreamer:', error);
    }
  };

  render() {
    const { enabled = true, width } = this.props;
    const { localSelectedCase } = this.state;
    const effectiveSolvedResults = this.getEffectiveSolvedResults();

    return (
      <div
        className={`solved-cases ${!enabled ? 'solved-cases--disabled' : ''}`}
        style={{ width: width ? `${width}px` : '100%' }}
      >
        <div className='solved-cases__header'>
          <h3 className='solved-cases__title'>Solved Cases</h3>
          <p className='solved-cases__description'>
            Select and visualize previously solved simulation cases
          </p>
        </div>

        <div className='solved-cases__content'>
          {/* Case Selection */}
          <div className='solved-cases__field'>
            <label className='solved-cases__label' htmlFor='solved-case-select'>
              Select Solved Case:
            </label>
            <select
              id='solved-case-select'
              className='solved-cases__select'
              value={localSelectedCase}
              onChange={e => this.handleCaseChange(e.target.value)}
              onFocus={this.handleFocus}
              disabled={!enabled}
            >
              {effectiveSolvedResults.map((caseOption, index) => (
                <option key={index} value={caseOption}>
                  {caseOption}
                </option>
              ))}
            </select>
          </div>

          {/* Open Button */}
          <div className='solved-cases__actions'>
            <button
              className='solved-cases__button solved-cases__button--primary'
              onClick={this.handleVisualize}
              disabled={!enabled || !localSelectedCase}
            >
              Open
            </button>
          </div>
        </div>
      </div>
    );
  }
}
