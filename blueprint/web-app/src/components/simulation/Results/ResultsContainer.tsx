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
 * Results Container
 * Redux container component that connects Results UI to Redux state
 */

import { Component } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import type { RootState } from '@/store';
import Results from './Results.tsx';

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
