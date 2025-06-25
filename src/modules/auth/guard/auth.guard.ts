import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import * as moment from 'moment';
import { Exceptions } from '../exceptions';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    readonly reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const validatePasswordExpires: boolean = this.reflector
    .get<boolean>('validatePasswordExpires', context.getHandler()) ?? true;
    
    const request = context.switchToHttp().getRequest();
    if (request?.user && !request?.user?.password) return true;
    if (!request?.user) {
      throw Exceptions.AUTHORIZATION_TOKEN_MUST_BE_PROVIDED;
    }

    if (validatePasswordExpires && (moment().valueOf() > moment(request.user.passwordExpires).valueOf())) {
      throw Exceptions.PASSWORD_EXPIRED;
    }
    return true;
  }
}
