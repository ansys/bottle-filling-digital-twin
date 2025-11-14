import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('../../../src/services/Endpoints', () => ({
  createStreamingSession: jest.fn(),
  getStreamingSessionInfo: jest.fn(),
}));

import SessionSelectionPanel from '../../../src/components/common/SessionSelectionPanel/SessionSelectionPanel';
import { createStreamingSession } from '../../../src/services/Endpoints';

describe('SessionSelectionPanel additional branches', () => {
  beforeEach(() => jest.resetAllMocks());

  it('shows missing streamServer error when trying to connect with session id but no server', async () => {
    const onReady = jest.fn();

    render(
      <SessionSelectionPanel
        // deliberately provide empty streamServer to trigger missing-server branch
        streamServer={''}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'p'}
        onSessionReady={onReady}
      />
    );

    const input = screen.getByPlaceholderText(/Enter existing session ID/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'sess-42' } });

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/Connect to Session/i);

    fireEvent.click(button);

    expect(await screen.findByText(/Missing stream server configuration/i)).toBeInTheDocument();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('updates input and toggles button text between Create and Connect', () => {
    const onReady = jest.fn();
    render(
      <SessionSelectionPanel
        streamServer={'https://s'}
        appId={'app1'}
        appVersion={'1.0'}
        profile={'p'}
        onSessionReady={onReady}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent(/Create New Session/i);

    const input = screen.getByPlaceholderText(/Enter existing session ID/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'abc' } });

    // After entering text, the button should switch to 'Connect to Session'
    expect(button).toHaveTextContent(/Connect to Session/i);
    // The input value should reflect the change
    expect(input.value).toBe('abc');
  });

  it('shows API detail error when createStreamingSession returns an error object', async () => {
    const onReady = jest.fn();

    // createStreamingSession returns an ErrorItem shape with 'detail'
    (createStreamingSession as jest.Mock).mockResolvedValue({ status: 201, data: { detail: 'bad request' } });

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

    // Expect an error message that contains the API detail message
    expect(await screen.findByText(/OKAS API Error: bad request/i)).toBeInTheDocument();
    expect(onReady).not.toHaveBeenCalled();
  });
});
