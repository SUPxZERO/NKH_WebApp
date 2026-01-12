import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

/**
 * Sprint 3: Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the error, and displays a fallback UI instead of crashing.
 * 
 * @example
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomError />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // Log error to console (development)
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            errorInfo
        });

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Report error to backend (production)
        this.reportError(error, errorInfo);
    }

    private reportError(error: Error, errorInfo: React.ErrorInfo) {
        // Only report in production
        if (import.meta.env.PROD) {
            try {
                fetch('/api/client-errors', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        message: error.message,
                        stack: error.stack,
                        componentStack: errorInfo.componentStack,
                        url: window.location.href,
                        userAgent: navigator.userAgent,
                        timestamp: new Date().toISOString()
                    })
                }).catch(err => {
                    // Silent fail - don't crash on error reporting
                    console.error('Failed to report error:', err);
                });
            } catch (err) {
                // Silent fail
            }
        }
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border border-gray-200">
                        {/* Error Icon & Title */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-10 w-10 text-red-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Something went wrong
                                </h2>
                                <p className="text-sm text-gray-500">
                                    We're sorry for the inconvenience
                                </p>
                            </div>
                        </div>

                        {/* Error Message */}
                        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                            <p className="text-sm text-red-800 font-medium mb-1">
                                Error: {this.state.error?.message || 'Unknown error'}
                            </p>
                            {import.meta.env.DEV && this.state.error?.stack && (
                                <details className="mt-2">
                                    <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                                        Technical details (dev only)
                                    </summary>
                                    <pre className="mt-2 text-xs text-red-700 overflow-auto max-h-40 bg-red-100 p-2 rounded">
                                        {this.state.error.stack}
                                    </pre>
                                </details>
                            )}
                        </div>

                        {/* Help Text */}
                        <p className="text-gray-600 text-sm mb-6">
                            {import.meta.env.PROD
                                ? "Our team has been notified and is working on a fix. Please try refreshing the page."
                                : "Check the console for more details about this error."}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-2.5 rounded-md hover:bg-blue-700 transition-colors font-medium"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reload Page
                            </button>

                            {import.meta.env.DEV && (
                                <button
                                    onClick={this.handleReset}
                                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm"
                                >
                                    Try to Recover (Dev)
                                </button>
                            )}

                            <button
                                onClick={() => window.history.back()}
                                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Higher-order component version for easier usage
 */
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundaryWrapper(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
