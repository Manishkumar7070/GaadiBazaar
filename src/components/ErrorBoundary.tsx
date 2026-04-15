import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong. Please try again.";
      
      try {
        // Check if it's a Firestore JSON error
        const firestoreError = JSON.parse(this.state.error?.message || '');
        if (firestoreError.error) {
          if (firestoreError.error.includes('permissions')) {
            errorMessage = "You don't have permission to perform this action. Please make sure you are logged in.";
          } else {
            errorMessage = `Database Error: ${firestoreError.error}`;
          }
        }
      } catch (e) {
        // Not a JSON error, use default or specific error message
        if (this.state.error?.message) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-6">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500">
            <AlertCircle size={40} />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="text-2xl font-bold text-slate-900">Oops! Something went wrong</h2>
            <p className="text-slate-500">{errorMessage}</p>
          </div>
          <Button 
            onClick={this.handleReset} 
            className="bg-primary hover:bg-primary/90 rounded-xl flex gap-2"
          >
            <RefreshCcw size={18} /> Refresh Page
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
