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

import React, { Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ROUTES } from '@/constants';
import Loading from '@/components/Loading';

// Lazy load pages for better performance
const SimulationPage = React.lazy(() => import('@/pages/SimulationPage'));
const ReviewerPage = React.lazy(() => import('@/pages/ReviewerPage'));
// const DesignPage = React.lazy(() => import('./pages/DesignPage'));
// const ResultsPage = React.lazy(() => import('./pages/ResultsPage'));
// const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const WorkflowPage = React.lazy(() => import('@/pages/WorkflowPage'));

class App extends React.Component {
  render() {
    return (
      <Provider store={store}>
        <Router>
          {/* <ErrorBoundary> */}
          <div className='app'>
            <Suspense fallback={<Loading message='Loading page...' />}>
              <Routes>
                <Route path={ROUTES.WORKFLOW} element={<WorkflowPage />} />
                <Route path={ROUTES.SIMULATION} element={<SimulationPage />} />
                <Route path={ROUTES.REVIEWER} element={<ReviewerPage />} />
                {/* <Route path={ROUTES.DESIGN} element={<DesignPage />} />
                <Route path={ROUTES.RESULTS} element={<ResultsPage />} />
                <Route path={ROUTES.SETTINGS} element={<SettingsPage />} /> */}
                <Route
                  path='*'
                  element={<Navigate to={ROUTES.WORKFLOW} replace />}
                />
              </Routes>
            </Suspense>
          </div>
          {/* </ErrorBoundary> */}
        </Router>
      </Provider>
    );
  }
}

export default App;
