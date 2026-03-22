import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white p-4 text-center z-50">
          <div>
            <h1 className="text-2xl font-bold mb-4 text-red-500">Something went wrong.</h1>
            <p className="mb-4">The application encountered an unexpected error.</p>
            <pre className="text-sm bg-gray-800 p-4 rounded text-left overflow-auto max-w-2xl mx-auto">
              {this.state.error?.toString()}
            </pre>
            <button
              className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
