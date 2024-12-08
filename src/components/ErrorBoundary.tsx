import React, { Component, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { trackEvent } from '../services/analytics';

const ERROR_EVENTS = {
  UNCAUGHT_ERROR: 'uncaught_error',
  ERROR_RECOVERY: 'error_recovery_attempt'
} as const;

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    trackEvent({
      event_name: ERROR_EVENTS.UNCAUGHT_ERROR,
      event_data: {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        componentStack: errorInfo.componentStack,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    });
  }

  private handleReset = () => {
    trackEvent({
      event_name: ERROR_EVENTS.ERROR_RECOVERY,
      event_data: {
        error: this.state.error?.message,
        recovery_method: 'page_refresh'
      }
    });
    
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleNavigateHome = () => {
    trackEvent({
      event_name: ERROR_EVENTS.ERROR_RECOVERY,
      event_data: {
        error: this.state.error?.message,
        recovery_method: 'navigate_home'
      }
    });
    
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-red-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>

            <div className="space-y-4">
              <Button
                variant="primary"
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              
              <button 
                onClick={this.handleNavigateHome}
                className="text-sm text-accent hover:text-accent-dark block mx-auto"
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 