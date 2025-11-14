import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../src/services/Endpoints', () => ({
  createStreamingSession: jest.fn(),
  getStreamingSessionInfo: jest.fn(),
}));

import SessionSelectionPanel from '../../../src/components/common/SessionSelectionPanel/SessionSelectionPanel';
import { createStreamingSession, getStreamingSessionInfo } from '../../../src/services/Endpoints';

describe('SessionSelectionPanel', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows error when required props are missing', async () => {
    const onReady = jest.fn();
    render(
      // @ts-expect-error - intentionally missing props to test validation
      <SessionSelectionPanel onSessionReady={onReady} />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(await screen.findByText(/Missing required parameters/i)).toBeInTheDocument();
  });

  it('creates a session and calls onSessionReady when session becomes ready', async () => {
    const onReady = jest.fn();
    // mock createStreamingSession to return a session id
    (createStreamingSession as jest.Mock).mockResolvedValue({ status: 201, data: { id: 'sess-1' } });

    // mock getStreamingSessionInfo to return ready routes immediately
    (getStreamingSessionInfo as jest.Mock).mockResolvedValue({ status: 200, data: { id: 'sess-1', routes: { r: { routes: [{ description: 'signaling', destination_port: 1, protocol: 'TCP', source_port: 2 }] } } } });

    render(
      <SessionSelectionPanel
        streamServer={'https://example.com'}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'default'}
        onSessionReady={onReady}
      />
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => expect(createStreamingSession).toHaveBeenCalled());
    await waitFor(() => expect(getStreamingSessionInfo).toHaveBeenCalled());
    await waitFor(() => expect(onReady).toHaveBeenCalledWith('sess-1'));
  });
});
