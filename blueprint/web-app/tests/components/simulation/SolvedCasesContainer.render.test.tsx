import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import SolvedCasesContainer from '../../../src/components/simulation/SolvedCases/SolvedCasesContainer';
import simulationReducer, { setStoredResults } from '../../../src/store/slices/simulationSlice';

describe('SolvedCasesContainer connected', () => {
  it('renders options from store and calls visualize callback', () => {
    const store = configureStore({ reducer: { simulation: simulationReducer } });
    store.dispatch(setStoredResults(['case1', 'case2', 'case3']));

    const onVisualize = jest.fn();

    render(
      <Provider store={store}>
        <SolvedCasesContainer onVisualize={onVisualize} />
      </Provider>
    );

    const select = screen.getByLabelText(/Select Solved Case/i) as HTMLSelectElement;
    expect(select.value).toBe('case1');
  });
});
