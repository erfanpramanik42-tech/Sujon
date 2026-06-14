import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 max-w-sm w-full space-y-4">
            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-800">Something went wrong</h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              The application encountered an unexpected error. We've logged the details and are working to fix it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-all uppercase tracking-widest text-[10px]"
            >
              Reload Application
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-4 p-3 bg-slate-900 text-rose-400 text-[8px] text-left overflow-auto rounded-lg max-h-32 font-mono">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
