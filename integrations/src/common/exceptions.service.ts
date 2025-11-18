import { BadRequestException, HttpException, HttpStatus, Logger } from '@nestjs/common';

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

const INTERNAL_ERROR_THROWER = (location: string = '', err: any, omitLog?: boolean, payload?: any) => {
  if (err instanceof CustomBadRequestException || err instanceof HttpException) {
    throw err;
  }

  if (!omitLog) {
    loggerInternal.error(`${location}`);
    loggerInternal.error(err);
    console.error(err);

    if (payload) {
      loggerInternal.error(payload);
    }
  }
  throw Exceptions.INTERNAL_ERROR(location, err);
};

const HTTP_ERROR_THROWER = (statusCode: number, err: any, type?: HttpErrorOrigin, omitLog?: boolean, payload?: any) => {
  if (err instanceof HttpException) {
    throw err;
  }

  if (!omitLog) {
    loggerError.error(err);

    if (payload) {
      loggerError.error(payload);
    }
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

export { Exceptions, INTERNAL_ERROR_THROWER, HTTP_ERROR_THROWER, getErrorType, throwNotImplementedException };
