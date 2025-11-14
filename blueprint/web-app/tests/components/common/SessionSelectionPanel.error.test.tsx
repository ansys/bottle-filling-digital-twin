import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../src/services/Endpoints', () => ({
  createStreamingSession: jest.fn(),
  getStreamingSessionInfo: jest.fn(),
}));

import SessionSelectionPanel from '../../../src/components/common/SessionSelectionPanel/SessionSelectionPanel';
import { getStreamingSessionInfo } from '../../../src/services/Endpoints';

describe('SessionSelectionPanel error handling', () => {
  beforeEach(() => jest.resetAllMocks());

  it('shows error when polling throws repeatedly', async () => {
    const onReady = jest.fn();

    // mock getStreamingSessionInfo to throw an error immediately
    (getStreamingSessionInfo as jest.Mock).mockRejectedValue(new Error('network'));

    render(
      <SessionSelectionPanel
        streamServer={'https://example.com'}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'p'}
        onSessionReady={onReady}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Wait for error message to appear (component sets error when create fails or polling fails)
    expect(await screen.findByText(/Failed to create session|Session polling failed/i)).toBeInTheDocument();
  });
});
