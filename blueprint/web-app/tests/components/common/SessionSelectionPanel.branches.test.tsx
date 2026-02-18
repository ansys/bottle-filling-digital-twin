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

import '@testing-library/jest-dom';

jest.mock('@/services/Endpoints.tsx', () => ({
  createStreamingSession: jest.fn(),
  getStreamingSessionInfo: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SessionSelectionPanel from '@/components/common/SessionSelectionPanel/SessionSelectionPanel.tsx';
import { createStreamingSession } from '@/services/Endpoints.tsx';

describe('SessionSelectionPanel branch-heavy paths', () => {
  beforeEach(() => jest.resetAllMocks());

  // NOTE: polling timeout/loop tests are flaky in the current Jest environment
  // because they rely on long intervals. Focus this file on create/connect
  // validation branches instead.

  it('handles createStreamingSession returning non-2xx status', async () => {
    (createStreamingSession as jest.Mock).mockResolvedValue({ status: 500, data: {} });

    const onReady = jest.fn();
    const props = {
      streamServer: 'https://s',
      appId: 'app',
      appVersion: '1',
      profile: 'p',
      onSessionReady: onReady,
    } as unknown as React.ComponentProps<typeof SessionSelectionPanel>;

  const { getByRole, findByText } = render(<SessionSelectionPanel {...(props as unknown as React.ComponentProps<typeof SessionSelectionPanel>)} />);

    // click the create button and expect the create failure error to appear
    const button = getByRole('button');
    button.click();

    expect(await findByText(/Failed to create session: Failed to create streaming session: 500/)).toBeTruthy();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('reports missing session id when connecting with empty input', async () => {
    const onReady = jest.fn();
    const props = {
      streamServer: 'https://s',
      appId: 'app',
      appVersion: '1',
      profile: 'p',
      onSessionReady: onReady,
    } as unknown as React.ComponentProps<typeof SessionSelectionPanel>;
    // Render with a ref so we can call the instance method directly
    // use any for test ref to access internal instance methods
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ref = React.createRef<any>();
    render(<SessionSelectionPanel ref={ref} {...(props as unknown as React.ComponentProps<typeof SessionSelectionPanel>)} />);

    // Wait for the component instance to be mounted and available on the ref
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((ref.current as any)).toBeTruthy();
    });

    // call the instance method which checks for empty sessionIdInput and sets an error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (ref.current as any)['handleConnectToSession']();

    // The component should show the validation error using testing-library query
    expect(await screen.findByText(/Please enter a session ID/i)).toBeTruthy();
    expect(onReady).not.toHaveBeenCalled();
  });

  it('validates required parameters for creating a session', async () => {
    const onReady = jest.fn();
    const props = {
      streamServer: 'https://s',
      appId: 'app',
      appVersion: '1',
      profile: '',
      onSessionReady: onReady,
    } as unknown as React.ComponentProps<typeof SessionSelectionPanel>;

  const { getByRole, findByText } = render(<SessionSelectionPanel {...(props as unknown as React.ComponentProps<typeof SessionSelectionPanel>)} />);

    const button = getByRole('button');
    button.click();

    expect(await findByText(/Missing required parameters/i)).toBeTruthy();
    expect(onReady).not.toHaveBeenCalled();
  });
});
