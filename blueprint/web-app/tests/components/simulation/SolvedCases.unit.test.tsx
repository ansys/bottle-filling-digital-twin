import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@nvidia/omniverse-webrtc-streaming-library', () => ({
  AppStreamer: { sendMessage: jest.fn() },
}));

import SolvedCases from '../../../src/components/simulation/SolvedCases/SolvedCases';

describe('SolvedCases component', () => {
  it('renders default option when no solvedResults provided and opens visualization', () => {
    const onVisualize = jest.fn();
    render(<SolvedCases onVisualize={onVisualize} />);

    // Default option should be present
    const select = screen.getByLabelText(/Select Solved Case/i) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('Select a USD File');

    // Focus to trigger retrieveStoredCases -> sendGetStoredResults (AppStreamer)
    fireEvent.focus(select);

    // Choose option and click Open
    fireEvent.change(select, { target: { value: 'Select a USD File' } });
    const openBtn = screen.getByText(/Open/i);
    fireEvent.click(openBtn);

    expect(onVisualize).toHaveBeenCalledTimes(1);
  });
});
