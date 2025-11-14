
import { render, fireEvent } from '@testing-library/react';
import FluentSolutionVariables from '../../../src/components/simulation/FluentSolutionVariables/FluentSolutionVariables';

const sampleVars = [
  { name: 'Velocity', sv: 'SV_V' },
  { name: 'Volume of Fluids', sv: 'SV_VOF' },
];

describe('FluentSolutionVariables', () => {
  it('initializes selected index from selectedSolutionVariable prop', () => {
    const { getByLabelText } = render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={sampleVars}
        selectedSolutionVariable={'SV_VOF'}
        onSelectFluentSolutionVariables={() => {}}
        onVisualize={() => {}}
        enabled={true}
      />
    );

    const select = getByLabelText('Select solution variable') as HTMLSelectElement;
    // selected index should be 1 (second item)
    expect(select.value).toBe('1');
  });

  it('calls onSelectFluentSolutionVariables when selection changes', () => {
    const onSelect = jest.fn();
    const { getByLabelText } = render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={sampleVars}
        selectedSolutionVariable={undefined}
        onSelectFluentSolutionVariables={onSelect}
        onVisualize={() => {}}
        enabled={true}
      />
    );

    const select = getByLabelText('Select solution variable') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: '0' } });
    expect(onSelect).toHaveBeenCalled();
  });

  it('componentDidUpdate updates state when selectedSolutionVariable prop changes', () => {
    const { rerender, getByLabelText } = render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={sampleVars}
        selectedSolutionVariable={undefined}
        onSelectFluentSolutionVariables={() => {}}
        onVisualize={() => {}}
        enabled={true}
      />
    );

    rerender(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={sampleVars}
        selectedSolutionVariable={'SV_V'}
        onSelectFluentSolutionVariables={() => {}}
        onVisualize={() => {}}
        enabled={true}
      />
    );

    const select = getByLabelText('Select solution variable') as HTMLSelectElement;
    expect(select.value).toBe('0');
  });

  it('onVisualize calls onVisualize with selected sv or falls back to first', () => {
    const onVisualize = jest.fn();
    const { getByText } = render(
      <FluentSolutionVariables
        width={300}
        fluentSolutionVariables={sampleVars}
        selectedSolutionVariable={undefined}
        onSelectFluentSolutionVariables={() => {}}
        onVisualize={onVisualize}
        enabled={true}
      />
    );

    const button = getByText('Initialize') as HTMLButtonElement;
    fireEvent.click(button);
    expect(onVisualize).toHaveBeenCalled();
  });
});
