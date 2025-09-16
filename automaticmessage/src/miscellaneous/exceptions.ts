import {
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  BadGatewayException,
  InternalServerErrorException,
  ConflictException,
  ForbiddenException,
  HttpException,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';

export class CustomBadRequestException extends BadRequestException {}
export class CustomForbiddenException extends ForbiddenException {}
export class CustomUnauthorizedException extends UnauthorizedException {}
export class CustomNotFoundException extends NotFoundException {}
export class CustomConflictException extends ConflictException {}
export class CustomBadGatewayException extends BadGatewayException {}
export class CustomInternalServerErrorException extends InternalServerErrorException {}

export const Exceptions = {
  CANNOT_GET_LIST_SCHEDULES_FROM_INTEGRATIONS: new CustomUnauthorizedException(
    'Cannot get listSchedules from integrations',
    'CANNOT_GET_LIST_SCHEDULES_FROM_INTEGRATIONS',
  ),
  CANNOT_SEND_ACTIVE_SCHEDULE_NOT_ENABLED: new CustomUnauthorizedException(
    'Cannot send active schedule not enabled',
    'CANNOT_SEND_ACTIVE_SCHEDULE_NOT_ENABLED',
  ),
  SPAM_SEND_MESSAGE_BY_API_KEY: new CustomBadRequestException(
    'SPAM_SEND_MESSAGE_BY_API_KEY',
    'SPAM_SEND_MESSAGE_BY_API_KEY',
  ),
  ERROR_SIZE_JSON_SCHEDULE: new CustomBadRequestException(
    'O tamanho do JSON "schedule" excede o limite permitido.',
    'ERROR_SIZE_JSON_SCHEDULE',
  ),
  ERROR_SIZE_JSON_CONTACT: new CustomBadRequestException(
    'O tamanho do JSON "contact" excede o limite permitido.',
    'ERROR_SIZE_JSON_CONTACT',
  ),
  INTERNAL_ERROR: (msg: string) =>
    new HttpException(
      {
        message: `Desculpe houve um erro`,
        location: msg,
        token: 'INTERNAL_ERROR',
      },
      500,
    ),
};

export const INTERNAL_ERROR_THROWER = (msg: string, e: any) => {
  if (
    e instanceof CustomBadRequestException ||
    e instanceof CustomForbiddenException ||
    e instanceof CustomNotFoundException ||
    e instanceof CustomConflictException ||
    e instanceof CustomBadGatewayException ||
    e instanceof CustomUnauthorizedException ||
    e instanceof CustomInternalServerErrorException
  ) {
    throw e;
  }
  try {
    Sentry.captureEvent({
      message: 'Internal error API',
      extra: {
        error: e,
        msg,
      },
    });
  } catch (e) {
    console.error('Error on sending sentry INTERNAL_ERROR', e);
  }
  throw Exceptions.INTERNAL_ERROR(msg);
};

interface CatchErrorConfig {
  ignoreThrow?: boolean;
}
/**
 *
 * @param ignoreThrow não lança o erro para frente, não chama INTERNAL_ERROR_THROWER, usado
 *      por exemplo quando a função não retorna para nenhum lugar como um consumidor de fila
 * @returns
 */
export function CatchError(config?: CatchErrorConfig) {
  const { ignoreThrow } = config || {};
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;
    descriptor.value = async function (...args: any) {
      try {
        return await method.apply(this, args);
      } catch (e) {
        const errorPlace = `${this.constructor?.name}.${propertyKey}`;
        if (ignoreThrow) {
          console.error(errorPlace, e);
        } else {
          INTERNAL_ERROR_THROWER(errorPlace, e);
        }
      }
    };
  };
}
