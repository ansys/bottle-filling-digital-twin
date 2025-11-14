/**
 * Results Container
 * Redux container component that connects Results UI to Redux state
 */

import { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import type { RootState } from '../../../store';
import Results from './Results';

// Map Redux state to component props
const mapStateToProps = (_state: RootState) => ({
  // Add any state mappings from Redux here if needed
  // For now, we don't need any state from Redux for Results
});

const mapDispatchToProps = {
  // Add any action dispatchers here if needed
};

const connector = connect(mapStateToProps, mapDispatchToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface ResultsContainerProps {
  width?: number;
  showStoreButton?: boolean;
  onStepCompleted?: () => void;
}

type ResultsContainerAllProps = PropsFromRedux & ResultsContainerProps;

/**
 * ResultsContainer Class Component
 * Handles Redux integration for Results
 */
class ResultsContainer extends Component<ResultsContainerAllProps> {
  componentDidMount() {
    console.log('Results: Container mounted');
  }

  render() {
    return (
      <Results
        width={this.props.width}
        showStoreButton={this.props.showStoreButton}
        onStepCompleted={this.props.onStepCompleted}
        enabled={true}
      />
    );
  }
}

const ConnectedResultsContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(ResultsContainer);

export default ConnectedResultsContainer;
