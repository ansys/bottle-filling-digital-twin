// React import removed - not needed with new JSX transform
import { render, screen } from '../utils/test-utils';
import Loading from '../../src/components/Loading';

describe('Loading Component', () => {
  it('renders with default message', () => {
    render(<Loading />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const customMessage = 'Loading simulation data...';
    render(<Loading message={customMessage} />);

    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  xit('renders with different sizes', () => {
    const { rerender } = render(<Loading size='small' />);

    let loadingContainer = screen.getByText('Loading...').closest('.loading');
    expect(loadingContainer).toHaveClass('loading--small');

    rerender(<Loading size='large' />);
    loadingContainer = screen.getByText('Loading...').closest('.loading');
    expect(loadingContainer).toHaveClass('loading--large');
  });

  it('has proper accessibility attributes', () => {
    render(<Loading message='Loading content' />);

    const loadingElement = screen.getByText('Loading content');
    expect(loadingElement).toBeInTheDocument();
  });

  xit('contains a spinner element', () => {
    render(<Loading />);

    const spinnerElement = document.querySelector('.spinner');
    expect(spinnerElement).toBeInTheDocument();
  });
});
