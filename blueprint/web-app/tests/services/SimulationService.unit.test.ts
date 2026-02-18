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

/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Unit tests for SimulationService
 * - set VITE_API_BASE before importing the module so module-level API_BASE picks it up
 * - mock global.fetch directly (no spyOn) to avoid cross-environment missing property issues
 */

describe('SimulationService', () => {
  beforeAll(() => {
    // Make sure the module initialization reads our test API base
    process.env.VITE_API_BASE = 'http://test-api';
  });

  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    // @ts-expect-error cleanup
    delete global.fetch;
  });

  afterAll(() => {
    delete process.env.VITE_API_BASE;
  });

  test('getAvailableDesigns: success and failure', async () => {
    const SimulationService = require('@/services/SimulationService.ts').default;

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'a', name: 'Design A', url: '/a' }] });
    const designs = await SimulationService.getAvailableDesigns();
    expect(designs[0].name).toBe('Design A');

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Err' });
    await expect(SimulationService.getAvailableDesigns()).rejects.toThrow('Unable to load design files');
  });

  test('loadDesignFile: success and failure', async () => {
    const SimulationService = require('@/services/SimulationService.ts').default;

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1', name: 'X' }) });
    const d = await SimulationService.loadDesignFile('1');
    expect(d.id).toBe('1');

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found' });
    await expect(SimulationService.loadDesignFile('missing')).rejects.toThrow('Unable to load design file: missing');
  });

  test('startSimulation / stopSimulation / exportResults flows', async () => {
    const SimulationService = require('@/services/SimulationService.ts').default;

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ simulationId: 'sim1', status: 'running' }) });
    const start = await SimulationService.startSimulation({ designFileId: '1', solverConfig: {} });
    expect(start.simulationId).toBe('sim1');

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    await expect(SimulationService.stopSimulation('sim1')).resolves.toBeUndefined();

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ downloadUrl: '/dl', filename: 'r.csv' }) });
    const out = await SimulationService.exportResults('sim1', 'csv');
    expect(out.filename).toBe('r.csv');

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(SimulationService.exportResults('bad', 'json')).rejects.toThrow('Unable to export simulation results');
  });

  test('getSimulationStatus and getSolutionVariables error fallbacks', async () => {
    const SimulationService = require('@/services/SimulationService.ts').default;

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'running', progress: 42, currentStep: 'Processing' }) });
    const s = await SimulationService.getSimulationStatus('sim1');
    expect(s.status).toBe('running');

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    const fallback = await SimulationService.getSimulationStatus('bad');
    expect(fallback.status).toBe('error');

    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    const vars = await SimulationService.getSolutionVariables();
    expect(Array.isArray(vars)).toBe(true);
    expect(vars.length).toBe(0);
  });
});
