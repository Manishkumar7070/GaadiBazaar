/**
 * Structured Logger for AsOneDealer
 * Centralizing logs for better monitoring and cleanup in production
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  context?: string;
  data?: any;
}

const isProduction = import.meta.env.PROD;

class Logger {
  private log(level: LogLevel, message: string, options?: LogOptions) {
    if (isProduction && level === 'debug') return;

    const timestamp = new Date().toISOString();
    const contextPrefix = options?.context ? `[${options.context}] ` : '';
    const formattedMessage = `${timestamp} ${level.toUpperCase()} ${contextPrefix}${message}`;

    switch (level) {
      case 'info':
        console.info(formattedMessage, options?.data || '');
        break;
      case 'warn':
        console.warn(formattedMessage, options?.data || '');
        break;
      case 'error':
        console.error(formattedMessage, options?.data || '');
        break;
      case 'debug':
        console.debug(formattedMessage, options?.data || '');
        break;
    }
  }

  info(message: string, options?: LogOptions) {
    this.log('info', message, options);
  }

  warn(message: string, options?: LogOptions) {
    this.log('warn', message, options);
  }

  error(message: string, options?: LogOptions) {
    this.log('error', message, options);
  }

  debug(message: string, options?: LogOptions) {
    this.log('debug', message, options);
  }
}

export const logger = new Logger();
