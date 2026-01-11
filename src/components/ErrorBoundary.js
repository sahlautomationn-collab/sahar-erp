'use client';

import { Component } from 'react';
import { logger } from '../lib/logger';
import { toast } from '../lib/toast';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the component tree
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log the error
    logger.error('Error Boundary caught an error', error, false);

    // Store error details for debugging
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('erp_error_boundary', JSON.stringify(errorLog));
    } catch (e) {
      // Silently fail if localStorage is not available
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border-2 border-red-500 rounded-2xl p-8 max-w-2xl w-full text-center shadow-2xl">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-exclamation-triangle text-red-500 text-4xl"></i>
            </div>

            {/* Error Title */}
            <h1 className="text-3xl font-bold text-white mb-4">
              Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-gray-400 mb-6">
              An unexpected error occurred. Our team has been notified and is working to fix it.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="text-left bg-[#121212] rounded-lg p-4 mb-6 border border-[#333]">
                <summary className="cursor-pointer text-red-400 font-bold mb-2">
                  Error Details (Development Mode)
                </summary>
                <pre className="text-xs text-gray-500 overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-[#B69142] hover:bg-[#d4af56] text-black font-bold rounded-lg transition-all"
              >
                <i className="fas fa-redo mr-2"></i>
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/admin'}
                className="px-6 py-3 bg-[#333] hover:bg-[#444] text-white font-bold rounded-lg transition-all"
              >
                <i className="fas fa-home mr-2"></i>
                Go to Dashboard
              </button>
            </div>

            {/* Support Info */}
            <p className="text-gray-600 text-sm mt-6">
              If this problem persists, please contact support
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
