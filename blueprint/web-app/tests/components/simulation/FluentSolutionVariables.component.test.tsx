import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import FluentSolutionVariables from '../../../src/components/simulation/FluentSolutionVariables/FluentSolutionVariables';

const fluentSolutionVariables = [
  { name: 'Var A', sv: 'svA' },
  { name: 'Var B', sv: 'svB' },
];

describe('FluentSolutionVariables UI', () => {
  it('renders and updates filling height when slider changes', () => {
    const mockSelect = jest.fn();
    const mockVisualize = jest.fn();

    render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={fluentSolutionVariables}
        selectedSolutionVariable={undefined}
        onSelectFluentSolutionVariables={mockSelect}
        onVisualize={mockVisualize}
        enabled={true}
        isLoading={false}
        statusText={null}
      />
    );

    // initial label shows default filling height (28 mm)
    expect(screen.getByText(/Filling Height:/i)).toHaveTextContent('28');

    // change the slider value
    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.input(slider, { target: { value: '10' } });

    // label should update to reflect new value
    expect(screen.getByText(/Filling Height:/i)).toHaveTextContent('10');
  });

  it('calls onSelectFluentSolutionVariables when selection changes', () => {
    const mockSelect = jest.fn();
    const mockVisualize = jest.fn();

    render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={fluentSolutionVariables}
        selectedSolutionVariable={undefined}
        onSelectFluentSolutionVariables={mockSelect}
        onVisualize={mockVisualize}
        enabled={true}
        isLoading={false}
        statusText={null}
      />
    );

    const select = screen.getByLabelText('Select solution variable');
    fireEvent.change(select, { target: { value: '1' } });

    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith(fluentSolutionVariables[1]);
  });

  it('toggles free-surface checkbox and calls onVisualize with expected args', () => {
    const mockSelect = jest.fn();
    const mockVisualize = jest.fn();

    render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={fluentSolutionVariables}
        selectedSolutionVariable={undefined}
        onSelectFluentSolutionVariables={mockSelect}
        onVisualize={mockVisualize}
        enabled={true}
        isLoading={false}
        statusText={null}
      />
    );

  const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
  // default is checked (freeSurfaceOnly true)
  expect(checkbox.checked).toBe(true);

  // toggle it via click
  fireEvent.click(checkbox);
  expect(checkbox.checked).toBe(false);

    // click initialize - should call onVisualize with first sv by default
    const button = screen.getByRole('button', { name: /Initialize/i });
    fireEvent.click(button);

    expect(mockVisualize).toHaveBeenCalledTimes(1);
    const [fillingHeight, freeSurfaceOnly, sv] = mockVisualize.mock.calls[0];
    expect(typeof fillingHeight).toBe('number');
    expect(freeSurfaceOnly).toBe(false);
    expect(sv).toBe('svA');
  });

  it('shows loading overlay and disables button when isLoading is true', () => {
    const mockSelect = jest.fn();
    const mockVisualize = jest.fn();

    render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={fluentSolutionVariables}
        selectedSolutionVariable={undefined}
        onSelectFluentSolutionVariables={mockSelect}
        onVisualize={mockVisualize}
        enabled={true}
        isLoading={true}
        statusText={'Working...'}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    // spinner text present
    expect(screen.getByText(/Initializing.../i)).toBeInTheDocument();
    // overlay status text present
    expect(screen.getByText(/Working.../i)).toBeInTheDocument();
  });
});
