import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn() },
}));

import SolvedCases from '../../../src/components/simulation/SolvedCases/SolvedCases';
import { AppStreamer } from '@nvidia/omniverse-webrtc-streaming-library';

describe('SolvedCases component', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows fallback when no solved results and calls sendGetStoredResults on focus', () => {
    const onRequestStoredResults = jest.fn();
    render(
      <SolvedCases
        solvedResults={[]}
        selectedSolvedResults={undefined}
        onRequestStoredResults={onRequestStoredResults}
      />
    );

    // fallback option
    expect(screen.getByText('Select a USD File')).toBeInTheDocument();

    // focus should trigger container callback
    const select = screen.getByRole('combobox');
    fireEvent.focus(select);
    expect(onRequestStoredResults).toHaveBeenCalled();
  });

  it('visualize sends AppStreamer message and calls onVisualize', () => {
    const onVisualize = jest.fn();
    render(
      <SolvedCases
        solvedResults={["case1.usd"]}
        selectedSolvedResults={undefined}
        onVisualize={onVisualize}
      />
    );

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'case1.usd' } });

    const openButton = screen.getByRole('button', { name: /Open/i });
    fireEvent.click(openButton);

    expect(onVisualize).toHaveBeenCalledWith('case1.usd');
    expect(AppStreamer.sendMessage).toHaveBeenCalled();
  });
});
