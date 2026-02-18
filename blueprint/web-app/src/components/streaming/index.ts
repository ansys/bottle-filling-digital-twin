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

/**
 * Streaming Components Index
 *
 * Exports for streaming-related components
 */

// Primary streaming router - Use this for all streaming needs
export { default as StreamRouter } from './StreamRouter/StreamRouter.tsx';

// Stream-specific implementations (used internally by StreamRouter)
export { default as LocalStreamContainer } from './LocalStream/LocalStreamContainer.tsx';
export { default as OKASStreamContainer } from './OKASStream/OKASStreamContainer.tsx';
export { default as GFNNotImplemented } from './GFNNotImplemented/GFNNotImplemented.tsx';

// UI components
export { default as StreamSourceError } from './StreamSourceError/StreamSourceError.tsx';
export { default as StreamVideoDisplay } from './StreamVideoDisplay/StreamVideoDisplay.tsx';
export { default as StreamStatusOverlay } from './StreamStatusOverlay/StreamStatusOverlay.tsx';

// Base components and utilities
export { default as BaseStreamComponent } from './BaseStreamComponent/BaseStreamComponent.tsx';
export * from './utils/streamEventHandlers.ts';

// Unified message sending interface
export { default as StreamMessenger } from './StreamMessenger.ts';
