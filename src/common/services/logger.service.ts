import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';

interface LogContext {
  requestId?: string;
  userId?: number;
  [key: string]: unknown;
}

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: LogContext) {
    this.formatLog('LOG', message, context);
  }

  error(message: string, trace?: string, context?: LogContext) {
    this.formatLog('ERROR', message, context);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: string, context?: LogContext) {
    this.formatLog('WARN', message, context);
  }

  debug(message: string, context?: LogContext) {
    this.formatLog('DEBUG', message, context);
  }

  verbose(message: string, context?: LogContext) {
    this.formatLog('VERBOSE', message, context);
  }

  private formatLog(level: string, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const ctx = this.context || 'Application';
    const requestId = context?.requestId ? `[${context.requestId}]` : '';
    const userId = context?.userId ? `[User:${context.userId}]` : '';

    const logMessage = `[${timestamp}] [${level}] [${ctx}] ${requestId}${userId} ${message}`;

    // Add additional context data if present
    const extraContext = { ...context };
    delete extraContext.requestId;
    delete extraContext.userId;

    if (Object.keys(extraContext).length > 0) {
      console.log(logMessage, extraContext);
    } else {
      console.log(logMessage);
    }
  }
}
