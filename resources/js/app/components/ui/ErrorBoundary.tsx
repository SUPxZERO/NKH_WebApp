import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './Button';
import { Card, CardContent } from './Card';
import { useTranslation } from '@/app/hooks/useTranslation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  translations?: Record<string, any>;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorBoundaryContent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          translations={this.props.translations}
        />
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

export default ErrorBoundary;

function ErrorBoundaryContent({
  error,
  errorInfo,
  onRetry,
  onGoHome,
  translations: initialTranslations,
}: {
  error?: Error;
  errorInfo?: ErrorInfo;
  onRetry: () => void;
  onGoHome: () => void;
  translations?: Record<string, any>;
}) {
  const { t: contextT } = useTranslation();
  const isDev = process.env.NODE_ENV === 'development';

  // Helper for early-stage translations
  const t = (key: string) => {
    if (initialTranslations) {
      const keys = key.split('.');
      let value: any = initialTranslations;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          value = null;
          break;
        }
      }
      if (typeof value === 'string') return value;
    }
    return contextT(key);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-rose-400" />
          </div>

          <h2 className="text-xl font-bold mb-2">{t('common.ui.error_boundary.title')}</h2>
          <p className="text-gray-400 mb-6">
            {t('common.ui.error_boundary.description')}
          </p>

          {isDev && error && (
            <details className="mb-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 mb-2">
                {t('common.ui.error_boundary.dev_details')}
              </summary>
              <pre className="text-xs bg-gray-800 p-3 rounded-lg overflow-auto max-h-32 text-gray-300">
                {error.toString()}
                {errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
              {t('common.ui.error_boundary.actions.retry')}
            </Button>
            <Button onClick={onGoHome} leftIcon={<Home className="w-4 h-4" />}>
              {t('common.ui.error_boundary.actions.go_home')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
