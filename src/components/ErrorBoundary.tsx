import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'motion/react';

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
      let errorMessage = "Something went wrong. Our technical team has been notified.";
      
      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error) errorMessage = parsed.error;
        }
      } catch (e) {
        if (this.state.error?.message) {
          errorMessage = this.state.error.message;
        }
      }

      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center bg-slate-50 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -z-10" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[100px] -z-10" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8 max-w-lg"
          >
            <div className="relative inline-block">
              <div className="w-24 h-24 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center text-red-500 border border-slate-100 rotate-[-5deg]">
                <AlertCircle size={48} />
              </div>
              <div className="absolute -top-2 -right-2 w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-lg rotate-12">
                <span className="text-xl font-black italic">!</span>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-4xl font-[1000] text-slate-900 tracking-tighter uppercase italic leading-none">Unexpected Break</h2>
              <p className="text-slate-500 font-medium leading-relaxed">
                {errorMessage}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={this.handleReset} 
                className="h-16 px-10 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
              >
                <RefreshCcw size={20} className="mr-3" /> Fix & Refresh
              </Button>
              <Button 
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="h-16 px-10 rounded-2xl font-black uppercase tracking-widest text-slate-400 hover:text-slate-900"
              >
                Go Home
              </Button>
            </div>

            <div className="pt-8 border-t border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Error ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
