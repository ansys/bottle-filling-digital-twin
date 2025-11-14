# AppOnlyForm Component

## Overview

The `AppOnlyForm` component is a React class component that handles the initial persona/journey selection for the Bottle Filling Digital Twin application. It integrates with Redux state management and displays when `currentForm === Forms.APP_ONLY`.

## Features

- **Persona Selection**: Users can choose between "Simulation Engineer" and "Reviewer" roles
- **Redux Integration**: Connected to Redux store for state management
- **Accessibility**: Full keyboard navigation and screen reader support
- **Responsive Design**: Works on desktop and mobile devices
- **Form Validation**: Ensures a persona is selected before proceeding

## Usage

### Basic Usage

```tsx
import { AppOnlyForm } from '../../components';

// The component is automatically connected to Redux store
<AppOnlyForm />;
```

### Redux State Integration

The component automatically connects to the Redux store and manages:

- `useSimulationUI`: Boolean indicating if simulation UI should be enabled
- `currentForm`: Current form state in the workflow
- `isLoading`: Loading state for various operations

### Navigation Flow

1. User sees two persona options: "Simulation Engineer" and "Reviewer"
2. User selects a persona (either by clicking the card or using keyboard navigation)
3. User clicks "Start Simulation", "View Results", or "Next" button
4. Component updates Redux state and navigates to next form (`Forms.STREAM_URLS`)

## Component Structure

```
src/components/AppOnlyForm/
├── AppOnlyForm.tsx           # Main component file
├── AppOnlyForm.module.css    # Component styles
└── index.ts                  # Export configuration
```

## Props

The component receives props through Redux `connect()`:

```typescript
interface PropsFromRedux {
  useSimulationUI: boolean; // Current simulation UI preference
  currentForm: Forms; // Current form in workflow
  isLoading: boolean; // Loading state
  setUseSimulationUI: (useSimulationUI: boolean) => void;
  setCurrentForm: (form: Forms) => void;
  setStreamStatus: (status: StreamStatus) => void;
}
```

## State

```typescript
interface AppOnlyFormState {
  selectedPersona: 'simulation' | 'reviewer' | null;
}
```

## Methods

### Private Methods

- `handlePersonaSelection(persona)`: Updates selected persona and Redux state
- `handleStartSimulation()`: Handles "Start Simulation" button click
- `handleViewResults()`: Handles "View Results" button click
- `handleNext()`: Proceeds to next form in workflow

## Styling

The component uses CSS modules for styling with:

- Responsive grid layout for persona cards
- Hover and focus states for accessibility
- Custom radio button styling
- Smooth animations and transitions
- Ansys brand colors

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support with Tab, Enter, and Space
- **Screen Reader Support**: Proper ARIA labels and descriptions
- **Focus Management**: Visible focus indicators
- **Role Attributes**: Proper semantic roles for interactive elements

## Integration with Workflow

The component is part of a larger workflow system:

1. **HomePage**: Entry point with journey selection
2. **AppOnlyForm**: Persona selection (current component)
3. **ServerURLsForm**: Server configuration
4. **ApplicationsForm**: Application selection
5. **VersionsForm**: Version selection
6. **ProfilesForm**: Profile selection
7. **StreamView**: Final streaming interface

## Example Workflow Integration

```tsx
// In WorkflowPage component
private renderCurrentForm(): React.ReactNode {
  const { currentForm } = this.props;

  switch (currentForm) {
    case Forms.APP_ONLY:
      return <AppOnlyForm />;
    // ... other forms
  }
}
```

## Testing

To test the component:

1. Navigate to `/workflow` route
2. Verify persona selection works
3. Test keyboard navigation
4. Verify Redux state updates
5. Test responsive design

## Dependencies

- React 18+
- Redux Toolkit
- React-Redux
- CSS Modules

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Internet Explorer 11+ (with polyfills)
- Mobile browsers (iOS Safari, Chrome Mobile)
