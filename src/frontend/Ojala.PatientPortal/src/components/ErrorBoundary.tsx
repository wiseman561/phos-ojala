import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  Card,
  CardContent,
  CardActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh,
  Home,
  BugReport,
  ExpandMore,
  LocalHospital,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console and potentially to error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // TODO: Report error to monitoring service
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Report to error monitoring service (Sentry, LogRocket, etc.)
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId') || 'anonymous',
    };

    // Mock error reporting - replace with actual service
    console.log('Error Report:', errorReport);

    // Example: Send to error tracking service
    // errorTrackingService.captureException(error, {
    //   contexts: { errorInfo },
    //   tags: { errorId: this.state.errorId },
    // });
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
Error Message: ${this.state.error?.message}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}

Steps to reproduce:
1.
2.
3.

Expected behavior:


Actual behavior:


Additional context:

    `);

    window.open(`mailto:support@ojala.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            minHeight: '100vh',
            backgroundColor: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Container maxWidth="md">
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
              }}
            >
              {/* Error Icon and Header */}
              <Box sx={{ mb: 3 }}>
                <ErrorIcon
                  sx={{
                    fontSize: 80,
                    color: 'error.main',
                    mb: 2,
                  }}
                />
                <Typography variant="h3" gutterBottom color="error">
                  Oops! Something went wrong
                </Typography>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  We're sorry for the inconvenience. An unexpected error occurred.
                </Typography>
              </Box>

              {/* Error ID */}
              <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Error ID:</strong> {this.state.errorId}
                </Typography>
                <Typography variant="body2">
                  Please include this ID when reporting the issue for faster resolution.
                </Typography>
              </Alert>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={this.handleRetry}
                  startIcon={<Refresh />}
                  size="large"
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleGoHome}
                  startIcon={<Home />}
                  size="large"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={this.handleReportBug}
                  startIcon={<BugReport />}
                  size="large"
                >
                  Report Bug
                </Button>
              </Box>

              {/* Helpful Information */}
              <Card variant="outlined" sx={{ mb: 3, textAlign: 'left' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    What you can do:
                  </Typography>
                  <Typography variant="body2" component="div">
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                      <li>Click "Try Again" to reload this page</li>
                      <li>Go back to the Dashboard and try a different action</li>
                      <li>Clear your browser cache and cookies</li>
                      <li>Check your internet connection</li>
                      <li>Report this issue to our support team</li>
                    </ul>
                  </Typography>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card variant="outlined" sx={{ mb: 3, textAlign: 'left' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Need immediate assistance?
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    For urgent medical matters, please contact your healthcare provider directly
                    or call emergency services.
                  </Typography>
                  <Typography variant="body2">
                    For technical support: <strong>support@ojala.com</strong> or <strong>1-800-OJALA-HELP</strong>
                  </Typography>
                </CardContent>
              </Card>

              {/* Technical Details (Expandable) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Accordion sx={{ textAlign: 'left' }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1">
                      Technical Details (Development Only)
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" component="pre" sx={{
                      fontSize: '0.75rem',
                      backgroundColor: '#f5f5f5',
                      p: 2,
                      borderRadius: 1,
                      overflow: 'auto',
                      whiteSpace: 'pre-wrap',
                    }}>
                      <strong>Error:</strong> {this.state.error.message}
                      {'\n\n'}
                      <strong>Stack Trace:</strong>
                      {'\n'}
                      {this.state.error.stack}
                      {'\n\n'}
                      <strong>Component Stack:</strong>
                      {'\n'}
                      {this.state.errorInfo?.componentStack}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              )}
            </Paper>
          </Container>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
