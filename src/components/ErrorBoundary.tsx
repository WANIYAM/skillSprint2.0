import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SupportNova Error Boundary Caught]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleHardReload = () => {
    try {
      localStorage.removeItem('supportnova_user_session');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F0EFEA' }}>
          <div
            className="max-w-xl w-full rounded-2xl p-6 sm:p-8 shadow-2xl"
            style={{ background: '#FFFFFF', border: '1px solid rgba(210, 21, 21, 0.3)' }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(210, 21, 21, 0.08)', border: '1px solid rgba(210, 21, 21, 0.25)', color: '#D21515' }}
              >
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ color: '#171717' }}>
                  Application Runtime Exception
                </h1>
                <p className="text-xs font-medium" style={{ color: '#D21515' }}>
                  SupportNova Resilience Engine &bull; Error Boundary Intercepted
                </p>
              </div>
            </div>

            <p className="text-xs mb-4 leading-relaxed" style={{ color: '#3A3A3A' }}>
              An unexpected render or runtime exception occurred. The application state has been safely isolated to prevent unhandled data corruption.
            </p>

            {this.state.error && (
              <div
                className="mb-5 p-3 rounded-lg text-xs font-mono break-words"
                style={{ background: 'rgba(210, 21, 21, 0.06)', border: '1px solid rgba(210, 21, 21, 0.2)', color: '#D21515' }}
              >
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 mb-4">
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition active:scale-95 cursor-pointer"
                style={{ background: '#171717', color: '#FFFFFF' }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover & Try Again</span>
              </button>

              <button
                onClick={this.handleHardReload}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-medium transition active:scale-95 cursor-pointer"
                style={{ background: '#F0EFEA', color: '#171717', border: '1px solid #C0BCB1' }}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="flex items-center space-x-1 px-3 py-2 text-xs transition ml-auto cursor-pointer"
                style={{ color: '#6B6B6B' }}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{this.state.showDetails ? 'Hide Stack' : 'Show Stack'}</span>
                {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {this.state.showDetails && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #C0BCB1' }}>
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: '#6B6B6B' }}>Stack Trace:</p>
                <pre
                  className="max-h-48 overflow-y-auto p-2.5 rounded text-[10px] font-mono whitespace-pre-wrap"
                  style={{ background: '#F0EFEA', border: '1px solid #C0BCB1', color: '#3A3A3A' }}
                >
                  {this.state.error?.stack || 'No stack trace available.'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}