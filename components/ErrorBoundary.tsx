
import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Standard React Error Boundary. 
 * Explicitly typed inheritance ensures that 'props' and 'state' are correctly recognized
 * by the TypeScript compiler.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  // Use a constructor to ensure the base class is properly initialized with Props and State
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  // Static method to update state when an error occurs during rendering
  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  // Lifecycle method to handle error reporting
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    // Correctly check this.state.hasError
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-100 text-center space-y-6">
            <h1 className="text-4xl font-black text-slate-900">Oops!</h1>
            <p className="text-slate-500 font-medium">Something went wrong with the simulation. Please refresh the application.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100"
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }

    // Return this.props.children which is now correctly recognized as a property of the base class
    return this.props.children;
  }
}
