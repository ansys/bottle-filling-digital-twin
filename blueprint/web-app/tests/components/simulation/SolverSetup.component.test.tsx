import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import SolverSetup, { DesignFile } from '../../../src/components/simulation/SolverSetup/SolverSetup';

describe('SolverSetup component', () => {
  it('renders disabled when loading and enables selects when files present', () => {
    const files: DesignFile[] = [
      { id: '1', name: 'Design A', url: 'http://a' },
    ];

    const onSelectDesignFile = jest.fn();
    const onSelectResolution = jest.fn();
    const onOpenDesignFile = jest.fn();

    const { rerender } = render(
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

    // select should be disabled when loading
    const designSelect = screen.getByLabelText('Select design file');
    expect(designSelect).toBeDisabled();

    // now provide files and ensure selection works
    rerender(
      <SolverSetup
        designFiles={files}
        selectedDesignFileId={'1'}
        selectedResolution={'400k'}
        isLoading={false}
        isOpening={false}
        onSelectDesignFile={onSelectDesignFile}
        onSelectResolution={onSelectResolution}
        onOpenDesignFile={onOpenDesignFile}
      />
    );

    expect(screen.getByText('Design A')).toBeInTheDocument();

  // open button should be enabled - prefer aria-label
  const openButton = screen.getByLabelText('Open selected design file');
  expect(openButton).toBeEnabled();

  fireEvent.click(openButton);
  expect(onOpenDesignFile).toHaveBeenCalled();
  });
});
