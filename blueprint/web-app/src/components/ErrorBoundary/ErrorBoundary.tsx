import { Component, ErrorInfo, ReactNode } from 'react';
import styles from './ErrorBoundary.module.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development or test
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test'
    ) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: Send to error reporting service in production
    // if (import.meta.env.PROD) {
    //   errorReportingService.logError(error, errorInfo);
    // }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={styles['error-boundary']}
          role='alert'
          aria-live='assertive'
        >
          <div className={styles['error-boundary__container']}>
            <h2 className={styles['error-boundary__title']}>
              Something went wrong
            </h2>
            <p className={styles['error-boundary__message']}>
              We're sorry, but something unexpected happened. Please try
              refreshing the page or click "Try Again" to retry.
            </p>

            {(process.env.NODE_ENV === 'development' ||
              process.env.NODE_ENV === 'test') &&
              this.state.error && (
                <details className={styles['error-boundary__details']}>
                  <summary>Error Details (Development)</summary>
                  <pre className={styles['error-boundary__stack']}>
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

            <div className={styles['error-boundary__actions']}>
              <button
                onClick={this.handleRetry}
                className={`${styles['error-boundary__button']} ${styles['error-boundary__button--primary']}`}
                type='button'
                aria-label='Try to render the component again'
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className={`${styles['error-boundary__button']} ${styles['error-boundary__button--secondary']}`}
                type='button'
                aria-label='Reload the entire page'
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
export type { ErrorBoundaryProps, ErrorBoundaryState };
