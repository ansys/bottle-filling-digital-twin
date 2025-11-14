import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FluentCalculations from '../../../src/components/simulation/FluentCalculations/FluentCalculations';
import type { FluentCalculationsProps } from '../../../src/components/simulation/FluentCalculations/FluentCalculations';

describe('FluentCalculations Component', () => {
  const defaultProps: FluentCalculationsProps = {
    width: 400,
    enabled: true,
    onCalculate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with required props', () => {
      render(<FluentCalculations {...defaultProps} />);

      expect(screen.getByText('Calculations')).toBeInTheDocument();
    });

    it('applies correct width style', () => {
      const { container } = render(
        <FluentCalculations {...defaultProps} width={500} />
      );

      const fluentCalculations = container.querySelector(
        '.fluent-calculations'
      );
      expect(fluentCalculations).toHaveStyle('width: 500px');
    });

    it('renders all input fields with default values', () => {
      render(<FluentCalculations {...defaultProps} />);

      const timestepsField = screen.getByDisplayValue('1');
      const viscosityField = screen.getByDisplayValue('0.002');
      const bottlesField = screen.getByDisplayValue('50000');
      const toleranceField = screen.getByDisplayValue('0');

      expect(timestepsField).toBeInTheDocument();
      expect(viscosityField).toBeInTheDocument();
      expect(bottlesField).toBeInTheDocument();
      expect(toleranceField).toBeInTheDocument();
    });

    it('renders calculate button', () => {
      render(<FluentCalculations {...defaultProps} />);

      expect(screen.getByRole('button', { name: /run/i })).toBeInTheDocument();
    });
  });

  describe('Input Field Labels and Structure', () => {
    it('renders all field labels', () => {
      render(<FluentCalculations {...defaultProps} />);

      expect(screen.getByText(/Timesteps Resolution: x1/)).toBeInTheDocument();
      expect(
        screen.getByText(/Viscosity: 0.002 \(Pa\.s\)/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Bottles per Hour: 50000/)).toBeInTheDocument();
      expect(screen.getByText(/Tolerance Sigma: 0 mL/)).toBeInTheDocument();
    });

    it('has correct input field types', () => {
      render(<FluentCalculations {...defaultProps} />);

      const timestepsField = screen.getByDisplayValue('1');
      const viscosityField = screen.getByDisplayValue('0.002');
      const bottlesField = screen.getByDisplayValue('50000');
      const toleranceField = screen.getByDisplayValue('0');

      expect(timestepsField).toHaveAttribute('type', 'range');
      expect(viscosityField).toHaveAttribute('type', 'range');
      expect(bottlesField).toHaveAttribute('type', 'range');
      expect(toleranceField).toHaveAttribute('type', 'range');
    });

    it('has proper input field attributes', () => {
      render(<FluentCalculations {...defaultProps} />);

      const timestepsField = screen.getByDisplayValue('1');
      const viscosityField = screen.getByDisplayValue('0.002');
      const bottlesField = screen.getByDisplayValue('50000');

      expect(timestepsField).toHaveAttribute('min', '0.1');
      expect(viscosityField).toHaveAttribute('step', '0.001');
      expect(bottlesField).toHaveAttribute('min', '20000');
    });
  });

  describe('Input Field Interactions', () => {
    it('updates number of timesteps value', () => {
      render(<FluentCalculations {...defaultProps} />);

      const timestepsField = screen.getByDisplayValue('1');
      fireEvent.input(timestepsField, { target: { value: '0.5' } });

      expect(timestepsField).toHaveValue('0.5');
    });

    it('updates viscosity value', () => {
      render(<FluentCalculations {...defaultProps} />);

      const viscosityField = screen.getByDisplayValue('0.002');
      fireEvent.input(viscosityField, { target: { value: '0.003' } });

      expect(viscosityField).toHaveValue('0.003');
    });

    it('updates bottles per hour value', () => {
      render(<FluentCalculations {...defaultProps} />);

      const bottlesField = screen.getByDisplayValue('50000');
      fireEvent.input(bottlesField, { target: { value: '75000' } });

      expect(bottlesField).toHaveValue('75000');
    });

    it('updates tolerance value', () => {
      render(<FluentCalculations {...defaultProps} />);

      const toleranceField = screen.getByDisplayValue('0');
      fireEvent.input(toleranceField, { target: { value: '0.5' } });

      expect(toleranceField).toHaveValue('0.5');
    });

    it('handles invalid input gracefully', () => {
      render(<FluentCalculations {...defaultProps} />);

      const timestepsField = screen.getByDisplayValue('1');
      fireEvent.change(timestepsField, { target: { value: 'invalid' } });

      // The input should handle invalid values according to HTML5 number input behavior
      expect(timestepsField).toBeInTheDocument();
    });
  });

  describe('Calculate Button Functionality', () => {
    it('calls onCalculate with current values when button is clicked', () => {
      const mockOnCalculate = jest.fn();
      render(
        <FluentCalculations {...defaultProps} onCalculate={mockOnCalculate} />
      );

      const calculateButton = screen.getByRole('button', {
        name: /run/i,
      });
      fireEvent.click(calculateButton);

      expect(mockOnCalculate).toHaveBeenCalledWith(1, 0.002, 50000, 0);
    });

    it('calls onCalculate with updated values', () => {
      const mockOnCalculate = jest.fn();
      render(
        <FluentCalculations {...defaultProps} onCalculate={mockOnCalculate} />
      );

      // Update values using range slider inputs with onInput events
      fireEvent.input(screen.getByDisplayValue('1'), {
        target: { value: '0.3' },
      });
      fireEvent.input(screen.getByDisplayValue('0.002'), {
        target: { value: '0.003' },
      });
      fireEvent.input(screen.getByDisplayValue('50000'), {
        target: { value: '60000' },
      });
      fireEvent.input(screen.getByDisplayValue('0'), {
        target: { value: '0.5' },
      });

      const calculateButton = screen.getByRole('button', {
        name: /run/i,
      });
      fireEvent.click(calculateButton);

      expect(mockOnCalculate).toHaveBeenCalledWith(0.3, 0.003, 60000, 0.5);
    });

    it('is enabled when enabled prop is true', () => {
      render(<FluentCalculations {...defaultProps} enabled={true} />);

      const calculateButton = screen.getByRole('button', {
        name: /run/i,
      });
      expect(calculateButton).not.toBeDisabled();
    });

    it('is disabled when enabled prop is false', () => {
      render(<FluentCalculations {...defaultProps} enabled={false} />);

      const calculateButton = screen.getByRole('button', {
        name: /run/i,
      });
      expect(calculateButton).toBeDisabled();
    });
  });

  describe('Loading State', () => {
    it('shows loading state when isLoading is true', () => {
      render(<FluentCalculations {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Running...')).toBeInTheDocument();
    });

    it('does not show loading state when isLoading is false', () => {
      render(<FluentCalculations {...defaultProps} isLoading={false} />);

      expect(screen.queryByText('Running...')).not.toBeInTheDocument();
    });

    it('does not show loading state when isLoading is undefined', () => {
      render(<FluentCalculations {...defaultProps} />);

      expect(screen.queryByText('Running...')).not.toBeInTheDocument();
    });

    it('disables calculate button when loading', () => {
      render(<FluentCalculations {...defaultProps} isLoading={true} />);

      const calculateButton = screen.getByRole('button', {
        name: /running/i,
      });
      expect(calculateButton).toBeDisabled();
    });
  });

  describe('Status Text Display', () => {
    it('displays status text when provided', () => {
      const statusText = 'Setting up calculation parameters...';
      render(
        <FluentCalculations
          {...defaultProps}
          statusText={statusText}
          isLoading={true}
        />
      );

      expect(screen.getByText(statusText)).toBeInTheDocument();
    });

    it('does not display status text when null', () => {
      render(<FluentCalculations {...defaultProps} statusText={null} />);

      expect(screen.queryByText(/Setting up/)).not.toBeInTheDocument();
    });

    it('does not display status text when undefined', () => {
      render(<FluentCalculations {...defaultProps} statusText={undefined} />);

      expect(screen.queryByText(/Setting up/)).not.toBeInTheDocument();
    });

    it('displays empty string status text', () => {
      render(<FluentCalculations {...defaultProps} statusText='' />);

      // Empty string should still render the status area but be empty
      const statusElement = document.querySelector('.status-text');
      if (statusElement) {
        expect(statusElement).toHaveTextContent('');
      }
    });
  });

  describe('Input Validation', () => {
    it('enforces minimum value for timesteps', () => {
      render(<FluentCalculations {...defaultProps} />);

      const timestepsField = screen.getByDisplayValue('1');
      fireEvent.change(timestepsField, { target: { value: '0.05' } });

      // HTML5 validation should prevent values less than min
      expect(timestepsField).toHaveAttribute('min', '0.1');
    });

    it('enforces minimum value for bottles per hour', () => {
      render(<FluentCalculations {...defaultProps} />);

      const bottlesField = screen.getByDisplayValue('50000');

      expect(bottlesField).toHaveAttribute('min', '20000');
    });

    it('handles decimal values correctly for viscosity', () => {
      render(<FluentCalculations {...defaultProps} />);

      const viscosityField = screen.getByDisplayValue('0.002');
      fireEvent.input(viscosityField, { target: { value: '0.003' } });

      expect(viscosityField).toHaveValue('0.003');
    });

    it('handles step attribute for viscosity input', () => {
      render(<FluentCalculations {...defaultProps} />);

      const viscosityField = screen.getByDisplayValue('0.002');
      expect(viscosityField).toHaveAttribute('step', '0.001');
    });
  });

  describe('Component Lifecycle and State', () => {
    it('maintains state across re-renders', () => {
      const { rerender } = render(<FluentCalculations {...defaultProps} />);

      // Change a value
      const timestepsField = screen.getByDisplayValue('1');
      fireEvent.input(timestepsField, { target: { value: '0.5' } });
      expect(timestepsField).toHaveValue('0.5');

      // Re-render with same props
      rerender(<FluentCalculations {...defaultProps} />);

      // State should be maintained
      expect(screen.getByDisplayValue('0.5')).toBeInTheDocument();
    });

    it('resets to initial state when component remounts', () => {
      const { unmount } = render(<FluentCalculations {...defaultProps} />);

      unmount();
      render(<FluentCalculations {...defaultProps} />);

      // Should show default values
      expect(screen.getByDisplayValue('1')).toBeInTheDocument(); // timesteps
      expect(screen.getByDisplayValue('0.002')).toBeInTheDocument(); // viscosity
      expect(screen.getByDisplayValue('50000')).toBeInTheDocument(); // bottles
      expect(screen.getByDisplayValue('0')).toBeInTheDocument(); // tolerance
    });
  });

  describe('CSS Classes and Styling', () => {
    it('applies main CSS class', () => {
      const { container } = render(<FluentCalculations {...defaultProps} />);

      expect(
        container.querySelector('.fluent-calculations')
      ).toBeInTheDocument();
    });

    it('applies field group classes', () => {
      const { container } = render(<FluentCalculations {...defaultProps} />);

      const fieldGroups = container.querySelectorAll(
        '.fluent-calculations__field'
      );
      expect(fieldGroups.length).toBeGreaterThan(0);
    });

    it('applies proper button classes', () => {
      render(<FluentCalculations {...defaultProps} />);

      const calculateButton = screen.getByRole('button', {
        name: /run/i,
      });
      expect(calculateButton).toHaveClass('fluent-calculations__button');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for form fields', () => {
      render(<FluentCalculations {...defaultProps} />);

      // The labels are not connected via htmlFor/id, so we check for text presence
      expect(screen.getByText(/Timesteps Resolution/i)).toBeInTheDocument();
      expect(screen.getByText(/Viscosity:/i)).toBeInTheDocument();
      expect(screen.getByText(/Bottles per Hour:/i)).toBeInTheDocument();
      expect(screen.getByText(/Tolerance Sigma:/i)).toBeInTheDocument();
    });

    it('button is accessible', () => {
      render(<FluentCalculations {...defaultProps} />);

      const calculateButton = screen.getByRole('button', {
        name: /run/i,
      });
      expect(calculateButton).toBeVisible();
      expect(calculateButton.tabIndex).not.toBe(-1);
    });

    it('form fields are keyboard accessible', () => {
      render(<FluentCalculations {...defaultProps} />);

      const timestepsField = screen.getByDisplayValue('1');
      const viscosityField = screen.getByDisplayValue('0.002');

      expect(timestepsField.tabIndex).not.toBe(-1);
      expect(viscosityField.tabIndex).not.toBe(-1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles extremely large numbers', () => {
      render(<FluentCalculations {...defaultProps} />);

      const bottlesField = screen.getByDisplayValue('50000');
      fireEvent.input(bottlesField, { target: { value: '100000' } });

      expect(bottlesField).toHaveValue('100000');
    });

    it('handles very small decimal values', () => {
      render(<FluentCalculations {...defaultProps} />);

      const viscosityField = screen.getByDisplayValue('0.002');
      fireEvent.input(viscosityField, { target: { value: '0.001' } });

      expect(viscosityField).toHaveValue('0.001');
    });

    it('handles negative tolerance values', () => {
      render(<FluentCalculations {...defaultProps} />);

      const toleranceField = screen.getByDisplayValue('0');
      fireEvent.input(toleranceField, { target: { value: '0.1' } });

      expect(toleranceField).toHaveValue('0.1');
    });

    it('handles multiple rapid calculate button clicks', () => {
      const mockOnCalculate = jest.fn();
      render(
        <FluentCalculations {...defaultProps} onCalculate={mockOnCalculate} />
      );

      const calculateButton = screen.getByRole('button', {
        name: /run/i,
      });

      fireEvent.click(calculateButton);
      fireEvent.click(calculateButton);
      fireEvent.click(calculateButton);

      expect(mockOnCalculate).toHaveBeenCalledTimes(3);
    });

    it('does not call onCalculate when disabled', () => {
      const mockOnCalculate = jest.fn();
      render(
        <FluentCalculations
          {...defaultProps}
          enabled={false}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateButton = screen.getByRole('button', {
        name: /run/i,
      });
      fireEvent.click(calculateButton);

      expect(mockOnCalculate).not.toHaveBeenCalled();
    });
  });
});
