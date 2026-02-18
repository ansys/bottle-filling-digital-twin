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

// Small environment helper to avoid direct import.meta usage in modules
// Allows tests to override via process.env when running under Jest
export const getApiBase = (): string => {
  // prefer Vite-style env if available at runtime, otherwise use process.env
  // This keeps runtime behavior the same in production while allowing Jest to import safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const maybeImportMeta: any = typeof (globalThis as any).importMeta !== 'undefined' ? (globalThis as any).importMeta : undefined;
  if (typeof (global as any).process !== 'undefined' && (process.env as any).VITE_API_BASE) {
    return (process.env as any).VITE_API_BASE as string;
  }

  if (maybeImportMeta && maybeImportMeta.env && maybeImportMeta.env.VITE_API_BASE) {
    return maybeImportMeta.env.VITE_API_BASE as string;
  }

  // Fallback to localhost
  return 'http://localhost:8000';
};

export default getApiBase;
