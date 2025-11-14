# Redux Store Architecture

This document describes the comprehensive Redux store architecture designed for the Bottle-Filling Omniverse Digital Twin application.

## Overview

The Redux store is designed to manage complex state for a streaming application with multi-step forms, server management, WebRTC streaming, and Omniverse integration. The architecture is scalable, type-safe, and follows modern Redux patterns.

## Store Structure

```
src/store/
├── index.ts                 # Store configuration and root state
├── slices/
│   ├── applicationSlice.ts  # Main application state and workflow
│   ├── streamingSlice.ts    # WebRTC streaming and connection state
│   ├── uiSlice.ts          # UI layout, theme, and notifications
│   ├── serverSlice.ts      # Server management and configuration
│   └── formSlice.ts        # Multi-step form navigation and validation
├── hooks/
│   └── index.ts            # Custom Redux hooks
└── examples/
    └── components.tsx      # Integration examples
```

## State Slices

### 1. Application Slice (`applicationSlice.ts`)

Manages the main application workflow and selections.

**State:**

- `currentForm`: Current form being displayed (SELECTION, STREAMING, etc.)
- `streamStatus`: Current streaming status (IDLE, CONNECTING, CONNECTED, etc.)
- `selectedApplication`: Currently selected application ID
- `selectedVersion`: Selected application version
- `selectedProfile`: Selected configuration profile
- `availableApplications`: List of available applications
- `availableVersions`: List of available versions
- `availableProfiles`: List of available profiles
- `isLoading`: Global loading state
- `error`: Global error message

**Key Actions:**

- `setCurrentForm(form)`: Change the current form
- `setStreamStatus(status)`: Update streaming status
- `setSelectedApplication(app)`: Set selected application
- `setLoading(loading)`: Set loading state
- `setError(error)`: Set error message

### 2. Streaming Slice (`streamingSlice.ts`)

Manages WebRTC streaming connections and quality metrics.

**State:**

- `isConnecting`: Connection attempt in progress
- `isConnected`: Current connection status
- `connectionError`: Connection error message
- `streamConfiguration`: Current stream settings
- `qualityMetrics`: Real-time quality metrics (FPS, bitrate, latency)
- `webRTCConfig`: WebRTC configuration settings
- `eventLog`: Connection event history

**Key Actions:**

- `startConnection()`: Begin connection attempt
- `setConnected(connected)`: Update connection status
- `setConnectionError(error)`: Set connection error
- `updateQualityMetrics(metrics)`: Update streaming quality
- `updateStreamConfiguration(config)`: Update stream settings

### 3. UI Slice (`uiSlice.ts`)

Manages user interface state, layout, and user preferences.

**State:**

- `layout`: Sidebar, panel, and window management
- `theme`: Theme preferences and settings
- `notifications`: Toast notifications and alerts
- `omniverse`: Omniverse-specific UI controls
- `accessibility`: Accessibility preferences

**Key Actions:**

- `setActivePanel(panel)`: Set active UI panel
- `setTheme(theme)`: Change application theme
- `addNotification(notification)`: Add toast notification
- `setOmniverseCamera(settings)`: Update camera settings

### 4. Server Slice (`serverSlice.ts`)

Manages server connections, health monitoring, and configuration.

**State:**

- `currentServer`: Currently connected server
- `connectionStatus`: Server connection status
- `healthStatus`: Server health monitoring
- `recentServers`: Recently used servers list
- `config`: Server configuration settings

**Key Actions:**

- `setCurrentServer(server)`: Set current server
- `updateConnectionStatus(status)`: Update connection status
- `updateHealthStatus(health)`: Update health metrics
- `addRecentServer(server)`: Add to recent servers
- `updateConfig(config)`: Update server configuration

### 5. Form Slice (`formSlice.ts`)

Manages multi-step form navigation, validation, and data persistence.

**State:**

- `currentStep`: Current form step (1-5)
- `totalSteps`: Total number of steps
- `canGoBack`/`canGoForward`: Navigation state
- `formData`: Data for each form step
- `validation`: Validation state for each step
- `isSubmitting`: Form submission state
- `isDirty`: Unsaved changes indicator
- `autoSaveEnabled`: Auto-save preferences

**Key Actions:**

- `nextStep()`/`previousStep()`: Navigate between steps
- `goToStep(step)`: Jump to specific step
- `updateStepData(step, data)`: Update form data
- `setFieldError(step, field, error)`: Set validation error
- `startSubmit()`/`submitSuccess()`/`submitError()`: Handle submission

## Installation and Setup

### 1. Install Dependencies

```bash
pnpm add @reduxjs/toolkit react-redux
pnpm add -D @types/react-redux
```

### 2. Configure Store

The store is already configured in `src/store/index.ts` with:

- Redux Toolkit's `configureStore`
- Combined reducers for all slices
- TypeScript support with typed hooks
- Development tools integration

### 3. Provider Setup

Wrap your app with the Redux Provider:

```tsx
import { Provider } from 'react-redux';
import { store } from './store';

function App() {
  return (
    <Provider store={store}>
      <YourAppComponent />
    </Provider>
  );
}
```

## Usage Examples

### Using Custom Hooks

```tsx
import { useApplicationState, useStreamingState } from './store/hooks';

function MyComponent() {
  const { currentForm, streamStatus, actions } = useApplicationState();
  const { isConnected, connectionError } = useStreamingState();

  const handleStartStream = () => {
    actions.setStreamStatus('CONNECTING');
  };

  return (
    <div>
      <p>Form: {currentForm}</p>
      <p>Status: {streamStatus}</p>
      <button onClick={handleStartStream}>Start Stream</button>
    </div>
  );
}
```

### Form Management

```tsx
import { useFormNavigation } from './store/hooks';

function FormComponent() {
  const { currentStep, canGoForward, actions } = useFormNavigation();

  return (
    <div>
      <p>Step {currentStep} of 5</p>
      <button onClick={actions.nextStep} disabled={!canGoForward}>
        Next
      </button>
    </div>
  );
}
```

### Server Management

```tsx
import { useServerState } from './store/hooks';

function ServerPanel() {
  const { currentServer, healthStatus, actions } = useServerState();

  const selectServer = server => {
    actions.setCurrentServer(server);
  };

  return (
    <div>
      <h3>Current: {currentServer?.name}</h3>
      <p>Health: {healthStatus?.status}</p>
    </div>
  );
}
```

## Type Safety

The architecture includes comprehensive TypeScript types:

- `RootState`: Complete application state type
- `AppDispatch`: Typed dispatch function
- Slice-specific state interfaces
- Action payload types
- Selector return types

## State Persistence

Consider adding persistence for:

- User preferences (theme, accessibility)
- Recent servers list
- Form drafts and auto-save data
- Application selections

Recommended: `redux-persist` for selective state persistence.

## Middleware Integration

The store is configured to support:

- Redux DevTools (development)
- Custom middleware for:
  - WebRTC event logging
  - Form auto-save
  - Server health monitoring
  - Error reporting

## Testing Strategy

- **Unit Tests**: Test individual reducers and action creators
- **Integration Tests**: Test complete workflows (form submission, streaming connection)
- **Component Tests**: Test React components with Redux integration
- **E2E Tests**: Test complete user journeys

## Performance Considerations

- **Memoization**: Use `useCallback` and `useMemo` for expensive operations
- **Selective Updates**: Structure state to minimize unnecessary re-renders
- **Normalized Data**: Consider normalizing complex nested data structures
- **Lazy Loading**: Load form steps and configurations on demand

## Migration from Class Components

The current React class components can be gradually migrated:

1. **State Extraction**: Move component state to Redux slices
2. **Hook Integration**: Replace class lifecycle methods with custom hooks
3. **Event Handling**: Use Redux actions instead of direct state manipulation
4. **Testing**: Update tests to use Redux Testing Library patterns

## Future Enhancements

- **Async Thunks**: Add async action creators for API calls
- **RTK Query**: Consider for complex data fetching scenarios
- **Middleware**: Custom middleware for logging, analytics, and error handling
- **Selectors**: Add memoized selectors for complex derived state
- **DevTools**: Enhanced debugging with action replay and time travel

## Best Practices

1. **Immutable Updates**: Always use Redux Toolkit's `createSlice` for automatic immutability
2. **Normalized State**: Keep state flat and avoid deeply nested structures
3. **Single Source of Truth**: Don't duplicate state between components and Redux
4. **Predictable Actions**: Use clear, descriptive action names and consistent payload structures
5. **Error Handling**: Implement comprehensive error states and user feedback
6. **Loading States**: Provide clear loading indicators for async operations

This Redux architecture provides a solid foundation for managing complex application state while maintaining type safety, scalability, and developer experience.
