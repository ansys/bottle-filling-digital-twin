/**
 * SolvedCases Container
 * Redux container component that connects SolvedCases UI to Redux state
 */

import { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';
import type { RootState, AppDispatch } from '../../../store';
import { setSelectedStoredResult } from '../../../store/slices/simulationSlice';
import SolvedCases from './SolvedCases';

// Map Redux state to component props
const mapStateToProps = (state: RootState) => ({
  solvedResults: state.simulation.storedResults || [],
  selectedSolvedResults:
    state.simulation.selectedStoredResult ||
    (state.simulation.storedResults && state.simulation.storedResults.length > 0
      ? state.simulation.storedResults[0]
      : ''),
});

// Map Redux dispatch to component props
const mapDispatchToProps = (dispatch: AppDispatch) => ({
  onCaseChange: (caseValue: string) => {
    dispatch(setSelectedStoredResult(caseValue));
  },
});

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface SolvedCasesContainerProps {
  width?: number;
  onStepCompleted?: () => void;
  onVisualize?: (caseValue: string) => void;
}

type SolvedCasesContainerAllProps = PropsFromRedux & SolvedCasesContainerProps;

/**
 * SolvedCasesContainer Class Component
 * Handles Redux integration for SolvedCases
 */
class SolvedCasesContainer extends Component<SolvedCasesContainerAllProps> {
  componentDidMount() {
    console.log('SolvedCases: Container mounted');
  }

  // Function to request stored results from backend when handleFocus is called
  handleRequestStoredResults = () => {
    try {
      const message = {
        event_type: 'getStoredResults',
        payload: { directory: 'stored' },
      };
      AppStreamer.sendMessage(JSON.stringify(message));
      console.log(
        'SolvedCasesContainer: Requested stored results from backend'
      );
    } catch (error) {
      console.warn(
        'SolvedCasesContainer: Failed to request stored results:',
        error
      );
    }
  };

  render() {
    const { solvedResults, selectedSolvedResults, onCaseChange } = this.props;

    return (
      <SolvedCases
        width={this.props.width}
        solvedResults={solvedResults}
        selectedSolvedResults={selectedSolvedResults}
        onCaseChange={onCaseChange}
        onStepCompleted={this.props.onStepCompleted}
        onVisualize={this.props.onVisualize}
        onRequestStoredResults={this.handleRequestStoredResults}
        enabled={true}
      />
    );
  }
}

const ConnectedSolvedCasesContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(SolvedCasesContainer);

export default ConnectedSolvedCasesContainer;
