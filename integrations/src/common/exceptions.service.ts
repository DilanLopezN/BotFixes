import { BadRequestException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import * as contextService from 'request-context';
import { CtxMetadata } from './interfaces/ctx-metadata';
import { sanitizeObject } from './helpers/safe-json.helper';

export class CustomBadRequestException extends BadRequestException {}

export enum HttpErrorOrigin {
  ERROR = 'ERROR',
  API_ERROR = 'API_ERROR',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
}

export interface HttpDefaultError {
  statusCode: number;
  token: string;
  error: any;
}

const loggerError = new Logger('HTTP_ERROR');
const loggerInternal = new Logger('INTERNAL_ERROR');

interface ErrorContext {
  location?: string;
  integrationId?: string;
  workspaceId?: string;
  conversationId?: string;
}

const getRequestContext = (): CtxMetadata | null => {
  try {
    return contextService.get('req:default-headers');
  } catch {
    return null;
  }
};

const formatErrorLog = (context: ErrorContext, err: any, payload?: any) => {
  const metadata = getRequestContext();
  const errorStack = err?.stack || new Error().stack;

  const logContext = {
    timestamp: new Date().toISOString(),
    location: context.location,
    integrationId: context.integrationId,
    workspaceId: metadata?.workspaceId || context.workspaceId,
    conversationId: metadata?.conversationId || context.conversationId,
  };

  const errorData = err?.response?.data || err?.data || err;
  const sanitizedData = sanitizeObject(errorData);

  return {
    context: logContext,
    error: {
      message: err?.message || err,
      data: sanitizedData,
      statusCode: err?.response?.status || err?.statusCode,
      stack: String(errorStack ?? '')
        .split('')
        .slice(0, 1_000)
        .join(''),
    },
    payload: payload ? sanitizeObject(payload) : undefined,
  };
};

const INTERNAL_ERROR_THROWER = (
  location: string = '',
  err: any,
  omitLog?: boolean,
  payload?: any,
  context?: ErrorContext,
) => {
  if (err instanceof CustomBadRequestException || err instanceof HttpException) {
    throw err;
  }

  if (!omitLog) {
    const errorLog = formatErrorLog({ ...context, location }, err, payload);
    loggerInternal.error(JSON.stringify(errorLog, null, 2));
  }
  throw Exceptions.INTERNAL_ERROR(location, err);
};

const HTTP_ERROR_THROWER = (
  statusCode: number,
  err: any,
  type?: HttpErrorOrigin,
  omitLog?: boolean,
  payload?: any,
  context?: ErrorContext,
) => {
  if (err instanceof HttpException) {
    throw err;
  }

  if (!omitLog) {
    const errorLog = formatErrorLog({ ...context }, err, payload);
    loggerError.error(JSON.stringify(errorLog, null, 2));
  }
  throw Exceptions.HTTP_ERROR(statusCode, err, type);
};

const Exceptions = {
  HTTP_ERROR: (statusCode: number, error: any, type?: HttpErrorOrigin) => {
    return new HttpException(
      {
        statusCode,
        token: type || HttpErrorOrigin.ERROR,
        error,
      } as HttpDefaultError,
      statusCode,
    );
  },
  INTERNAL_ERROR: (location: string, error: any) =>
    new HttpException(
      {
        message: error,
        location: location,
        token: 'INTERNAL_ERROR',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    ),
  ERROR: new CustomBadRequestException({
    message: 'ERROR',
    token: 'ERROR',
  }),
};

const getErrorType = (error: any, type: HttpErrorOrigin) => {
  return error instanceof HttpException && (error.getResponse() as HttpDefaultError)?.token === type;
};

const throwNotImplementedException = (serviceName: string, methodName: string) => {
  throw HTTP_ERROR_THROWER(
    HttpStatus.NOT_IMPLEMENTED,
    `${serviceName}.${methodName}: Not implemented`,
    undefined,
    true,
  );
};

export {
  Exceptions,
  INTERNAL_ERROR_THROWER,
  HTTP_ERROR_THROWER,
  getErrorType,
  throwNotImplementedException,
  ErrorContext,
};
