import { AxiosError } from 'axios';

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userMessage: string;
}

export interface NetworkError extends AppError {
  statusCode: number;
  isRetryable: boolean;
}

export interface ValidationError extends AppError {
  field: string;
  value: any;
}

// Error codes
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Application errors
  FEATURE_UNAVAILABLE: 'FEATURE_UNAVAILABLE',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // Medical data errors
  MEDICAL_DATA_ERROR: 'MEDICAL_DATA_ERROR',
  HIPAA_VIOLATION: 'HIPAA_VIOLATION',

  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// User-friendly error messages
export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection and try again.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'The request took too long to complete. Please try again.',
  [ERROR_CODES.UNAUTHORIZED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.FORBIDDEN]: 'You don\'t have permission to access this resource.',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found.',
  [ERROR_CODES.SERVER_ERROR]: 'A server error occurred. Our team has been notified.',
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.REQUIRED_FIELD]: 'This field is required.',
  [ERROR_CODES.INVALID_FORMAT]: 'Please enter a valid value.',
  [ERROR_CODES.FEATURE_UNAVAILABLE]: 'This feature is temporarily unavailable.',
  [ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.PERMISSION_DENIED]: 'You don\'t have permission to perform this action.',
  [ERROR_CODES.MEDICAL_DATA_ERROR]: 'There was an error processing your medical data.',
  [ERROR_CODES.HIPAA_VIOLATION]: 'This action would violate HIPAA privacy regulations.',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
} as const;

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: Array<(error: AppError) => void> = [];

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Add error listener
  addErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners.push(listener);
  }

  // Remove error listener
  removeErrorListener(listener: (error: AppError) => void): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  // Handle different types of errors
  handleError(error: any): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (this.isAxiosError(error)) {
      appError = this.handleAxiosError(error);
    } else if (error instanceof Error) {
      appError = this.handleJavaScriptError(error);
    } else {
      appError = this.handleUnknownError(error);
    }

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(appError);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });

    // Log error
    this.logError(appError);

    return appError;
  }

  // Handle Axios/HTTP errors
  private handleAxiosError(error: AxiosError): NetworkError {
    const statusCode = error.response?.status || 0;
    let code: string;
    let isRetryable = false;

    switch (statusCode) {
      case 400:
        code = ERROR_CODES.VALIDATION_ERROR;
        break;
      case 401:
        code = ERROR_CODES.UNAUTHORIZED;
        break;
      case 403:
        code = ERROR_CODES.FORBIDDEN;
        break;
      case 404:
        code = ERROR_CODES.NOT_FOUND;
        break;
      case 408:
      case 504:
        code = ERROR_CODES.TIMEOUT_ERROR;
        isRetryable = true;
        break;
      case 429:
      case 500:
      case 502:
      case 503:
        code = ERROR_CODES.SERVER_ERROR;
        isRetryable = true;
        break;
      default:
        if (statusCode === 0) {
          code = ERROR_CODES.NETWORK_ERROR;
          isRetryable = true;
        } else {
          code = ERROR_CODES.SERVER_ERROR;
          isRetryable = statusCode >= 500;
        }
    }

    return {
      code,
      message: error.message || 'Network error occurred',
      details: {
        statusCode,
        response: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
      },
      timestamp: new Date().toISOString(),
      userMessage: ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
      statusCode,
      isRetryable,
    };
  }

  // Handle JavaScript errors
  private handleJavaScriptError(error: Error): AppError {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message,
      details: {
        stack: error.stack,
        name: error.name,
      },
      timestamp: new Date().toISOString(),
      userMessage: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    };
  }

  // Handle unknown errors
  private handleUnknownError(error: any): AppError {
    return {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: typeof error === 'string' ? error : 'Unknown error',
      details: error,
      timestamp: new Date().toISOString(),
      userMessage: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    };
  }

  // Check if error is an Axios error
  private isAxiosError(error: any): error is AxiosError {
    return error && error.isAxiosError === true;
  }

  // Log error to console and monitoring service
  private logError(error: AppError): void {
    console.error('Application Error:', {
      code: error.code,
      message: error.message,
      timestamp: error.timestamp,
      details: error.details,
    });

    // TODO: Send to error monitoring service
    // this.reportToMonitoringService(error);
  }

  // Report to monitoring service (implement based on your service)
  private reportToMonitoringService(error: AppError): void {
    // Example for Sentry, LogRocket, etc.
    try {
      // errorReportingService.captureException(new Error(error.message), {
      //   tags: { errorCode: error.code },
      //   extra: error.details,
      //   level: this.getErrorLevel(error.code),
      // });
    } catch (e) {
      console.error('Failed to report error to monitoring service:', e);
    }
  }

  // Get error severity level
  private getErrorLevel(code: string): 'error' | 'warning' | 'info' {
    const criticalErrors = [
      ERROR_CODES.HIPAA_VIOLATION,
      ERROR_CODES.MEDICAL_DATA_ERROR,
      ERROR_CODES.SERVER_ERROR,
    ];

    if (criticalErrors.includes(code)) {
      return 'error';
    }

    const warningErrors = [
      ERROR_CODES.UNAUTHORIZED,
      ERROR_CODES.FORBIDDEN,
      ERROR_CODES.VALIDATION_ERROR,
    ];

    if (warningErrors.includes(code)) {
      return 'warning';
    }

    return 'info';
  }
}

// Convenience functions
export const handleApiError = (error: any): string => {
  const errorHandler = ErrorHandler.getInstance();
  const appError = errorHandler.handleError(error);
  return appError.userMessage;
};

export const createValidationError = (field: string, message: string, value?: any): ValidationError => {
  return {
    code: ERROR_CODES.VALIDATION_ERROR,
    message,
    details: { field, value },
    timestamp: new Date().toISOString(),
    userMessage: message,
    field,
    value,
  };
};

export const createNetworkError = (statusCode: number, message: string): NetworkError => {
  const isRetryable = statusCode === 0 || statusCode >= 500 || statusCode === 408 || statusCode === 429;

  return {
    code: statusCode === 0 ? ERROR_CODES.NETWORK_ERROR : ERROR_CODES.SERVER_ERROR,
    message,
    details: { statusCode },
    timestamp: new Date().toISOString(),
    userMessage: statusCode === 0
      ? ERROR_MESSAGES[ERROR_CODES.NETWORK_ERROR]
      : ERROR_MESSAGES[ERROR_CODES.SERVER_ERROR],
    statusCode,
    isRetryable,
  };
};

// Error boundary helper
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; errorInfo: any }>
) => {
  return class WithErrorBoundary extends React.Component<P, { hasError: boolean; error?: Error }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
      const errorHandler = ErrorHandler.getInstance();
      errorHandler.handleError(error);
    }

    render() {
      if (this.state.hasError) {
        if (fallback) {
          return React.createElement(fallback, {
            error: this.state.error!,
            errorInfo: null
          });
        }
        return React.createElement('div', {}, 'Something went wrong.');
      }

      return React.createElement(Component, this.props);
    }
  };
};

// Initialize error handler
export const initializeErrorHandling = () => {
  const errorHandler = ErrorHandler.getInstance();

  // Set up global error listeners
  window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(event.reason);
    event.preventDefault();
  });

  return errorHandler;
};
