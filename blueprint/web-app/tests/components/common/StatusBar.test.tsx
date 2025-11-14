import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusBar from '../../../src/components/common/StatusBar/StatusBar';

describe('StatusBar Component', () => {
  it('renders without crashing', () => {
    render(<StatusBar />);
    // Component should render default design text
    expect(screen.getByText(/None selected/i)).toBeInTheDocument();
  });

  it('displays design name when provided', () => {
    render(<StatusBar designName="Test Design" />);
    expect(screen.getByText('Test Design')).toBeInTheDocument();
  });

  it('displays status when provided', () => {
    render(<StatusBar status="Running" />);
    expect(screen.getByText(/Running/i)).toBeInTheDocument();
  });

  it('shows session info when enabled', () => {
    render(<StatusBar showSessionInfo={true} sessionId="session-123" />);
    expect(screen.getByText(/session-123/i)).toBeInTheDocument();
  });

  it('renders progress bar when showProgress is true', () => {
    render(<StatusBar showProgress={true} progress={50} />);
    // Progress is rendered as text and progress bar; verify percent text
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatusBar className="custom-class" />);
    const statusBar = container.querySelector('.custom-class');
    expect(statusBar).toBeInTheDocument();
  });
});
