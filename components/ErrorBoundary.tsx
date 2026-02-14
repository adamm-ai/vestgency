/**
 * Error Boundary Component
 * ========================
 * Catches JavaScript errors in child components and displays a fallback UI.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="bg-white dark:bg-[#0c0c0f] rounded-2xl p-8 max-w-md w-full text-center shadow-xl border border-black/5 dark:border-white/10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-brand-charcoal dark:text-white mb-2">
              Une erreur est survenue
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Nous nous excusons pour ce desagrement. Veuillez reessayer.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-gold to-cyan-400 text-black font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-gold/25 transition-all"
            >
              <RefreshCw size={18} />
              Reessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
