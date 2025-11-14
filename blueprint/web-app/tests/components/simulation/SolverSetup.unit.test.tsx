import { render, fireEvent, screen } from '@testing-library/react';
import SolverSetup, { DesignFile } from '../../../src/components/simulation/SolverSetup/SolverSetup';

describe('SolverSetup (pure component)', () => {
  const designFiles: DesignFile[] = [
    { id: 'd1', name: 'Design One', url: '/one' },
    { id: 'd2', name: 'Design Two', url: '/two' },
  ];

  it('renders selectors and shows loading overlay when isLoading', () => {
    const onSelectDesignFile = jest.fn();
    const onSelectResolution = jest.fn();
    const onOpenDesignFile = jest.fn();

    const { container } = render(
      <SolverSetup
        designFiles={[]}
        selectedDesignFileId={null}
        selectedResolution={'400k'}
        isLoading={true}
        isOpening={false}
        onSelectDesignFile={onSelectDesignFile}
        onSelectResolution={onSelectResolution}
        onOpenDesignFile={onOpenDesignFile}
      />
    );

    // Loading overlay present
    expect(container.querySelector('.solver-setup__loading-overlay')).toBeTruthy();

    // design select disabled when no files
    const select = screen.getByLabelText('Select design file') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
    expect(select.value).toBe('none');
  });

  it('calls handlers for design and resolution selection', () => {
    const onSelectDesignFile = jest.fn();
    const onSelectResolution = jest.fn();
    const onOpenDesignFile = jest.fn();

    render(
      <SolverSetup
        designFiles={designFiles}
        selectedDesignFileId={null}
        selectedResolution={'400k'}
        isLoading={false}
        isOpening={false}
        onSelectDesignFile={onSelectDesignFile}
        onSelectResolution={onSelectResolution}
        onOpenDesignFile={onOpenDesignFile}
      />
    );

    const designSelect = screen.getByLabelText('Select design file') as HTMLSelectElement;
    fireEvent.change(designSelect, { target: { value: 'd2' } });
    expect(onSelectDesignFile).toHaveBeenCalledWith('d2');

    const resolutionSelect = screen.getByLabelText('Select mesh resolution') as HTMLSelectElement;
    fireEvent.change(resolutionSelect, { target: { value: '400k' } });
    expect(onSelectResolution).toHaveBeenCalledWith('400k');
  });

  it('open button is enabled only when selection exists and not opening', () => {
    const onSelectDesignFile = jest.fn();
    const onSelectResolution = jest.fn();
    const onOpenDesignFile = jest.fn();

    const { rerender } = render(
      <SolverSetup
        designFiles={designFiles}
        selectedDesignFileId={null}
        selectedResolution={'400k'}
        isLoading={false}
        isOpening={false}
        onSelectDesignFile={onSelectDesignFile}
        onSelectResolution={onSelectResolution}
        onOpenDesignFile={onOpenDesignFile}
      />
    );

    let button = screen.getByRole('button', { name: /open selected design file/i });
    expect(button).toBeDisabled();

    // When a design is selected
    rerender(
      <SolverSetup
        designFiles={designFiles}
        selectedDesignFileId={'d1'}
        selectedResolution={'400k'}
        isLoading={false}
        isOpening={false}
        onSelectDesignFile={onSelectDesignFile}
        onSelectResolution={onSelectResolution}
        onOpenDesignFile={onOpenDesignFile}
      />
    );

    button = screen.getByRole('button', { name: /open selected design file/i });
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onOpenDesignFile).toHaveBeenCalled();

    // When opening flag is true, button shows opening state and is disabled
    rerender(
      <SolverSetup
        designFiles={designFiles}
        selectedDesignFileId={'d1'}
        selectedResolution={'400k'}
        isLoading={false}
        isOpening={true}
        onSelectDesignFile={onSelectDesignFile}
        onSelectResolution={onSelectResolution}
        onOpenDesignFile={onOpenDesignFile}
      />
    );

    button = screen.getByRole('button', { name: /opening design file.../i });
    expect(button).toBeDisabled();
  });

  it('toggles hovered class on mouse enter/leave', () => {
    const onSelectDesignFile = jest.fn();
    const onSelectResolution = jest.fn();
    const onOpenDesignFile = jest.fn();

    const { container } = render(
      <SolverSetup
        designFiles={designFiles}
        selectedDesignFileId={null}
        selectedResolution={'400k'}
        isLoading={false}
        isOpening={false}
        onSelectDesignFile={onSelectDesignFile}
        onSelectResolution={onSelectResolution}
        onOpenDesignFile={onOpenDesignFile}
      />
    );

    const root = container.firstChild as HTMLElement;
    fireEvent.mouseEnter(root);
    expect(root.className).toContain('solver-setup--hovered');
    fireEvent.mouseLeave(root);
    expect(root.className).not.toContain('solver-setup--hovered');
  });
});
