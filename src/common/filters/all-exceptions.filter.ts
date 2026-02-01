import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';
import { AppLoggerService } from '../services/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new AppLoggerService();

  constructor() {
    this.logger.setContext('AllExceptionsFilter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorMessage =
      typeof message === 'string'
        ? message
        : typeof message === 'object' &&
            message !== null &&
            'message' in message
          ? String(message.message)
          : 'An error occurred';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorMessage,
      requestId: request.id,
      ...(typeof message === 'object' && message !== null ? message : {}),
    };

    // Capture exception in Sentry
    Sentry.captureException(exception, {
      tags: {
        method: request.method,
        path: request.url,
        statusCode: status,
        requestId: request.id || 'unknown',
      },
    });

    // Log the error with request ID
    this.logger.error(
      `${request.method} ${request.url} - ${errorMessage}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        requestId: request.id,
        statusCode: status,
      },
    );

    response.status(status).json(errorResponse);
  }
}
