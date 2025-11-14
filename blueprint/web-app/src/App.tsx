import React, { Suspense } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ROUTES } from './constants';
import Loading from './components/Loading';

// Lazy load pages for better performance
const SimulationPage = React.lazy(() => import('./pages/SimulationPage'));
const ReviewerPage = React.lazy(() => import('./pages/ReviewerPage'));
// const DesignPage = React.lazy(() => import('./pages/DesignPage'));
// const ResultsPage = React.lazy(() => import('./pages/ResultsPage'));
// const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const WorkflowPage = React.lazy(() => import('./pages/WorkflowPage'));

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
