import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import ResultsContainer from '../../../src/components/simulation/Results/ResultsContainer';
import simulationReducer from '../../../src/store/slices/simulationSlice';

describe('ResultsContainer render', () => {
  it('renders the Results component via the connected container', () => {
    const store = configureStore({
      reducer: { simulation: simulationReducer },
    });

    render(
      <Provider store={store}>
        <ResultsContainer width={800} showStoreButton={false} />
      </Provider>
    );

    expect(screen.getByRole('heading', { name: /Results & Visualization/i })).toBeInTheDocument();
  });
});
