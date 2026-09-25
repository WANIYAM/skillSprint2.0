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
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-rose-950/40">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100">
                  Application Runtime Exception
                </h1>
                <p className="text-xs text-rose-400/90 font-medium">
                  SupportNova Resilience Engine &bull; Error Boundary Intercepted
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              An unexpected render or runtime exception occurred. The application state has been safely isolated to prevent unhandled data corruption.
            </p>

            {this.state.error && (
              <div className="mb-5 p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs font-mono break-words">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="flex flex-wrap gap-2.5 mb-4">
              <button
                onClick={this.handleReset}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover & Try Again</span>
              </button>

              <button
                onClick={this.handleHardReload}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition active:scale-95 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="flex items-center space-x-1 px-3 py-2 text-slate-400 hover:text-slate-200 text-xs transition ml-auto cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{this.state.showDetails ? 'Hide Stack' : 'Show Stack'}</span>
                {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {this.state.showDetails && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 mb-1.5">Stack Trace:</p>
                <pre className="max-h-48 overflow-y-auto p-2.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono whitespace-pre-wrap">
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
