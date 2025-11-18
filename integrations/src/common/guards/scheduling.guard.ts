import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { decodeToken } from '../helpers/decode-token';

@Injectable()
export class SchedulingAuthGuard implements CanActivate {
  public verifyToken(token: string): boolean {
    return !!decodeToken(token, process.env.SCHEDULING_JWT_SECRET_KEY);
  }

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!this.verifyToken(this.getToken(request))) {
      throw new UnauthorizedException({
        type: 'error',
        messages: {
          pt: 'Você não tem permissão para acessar este recurso',
        },
      });
    }

    return true;
  }

  private getToken(request: Request): string {
    const headerToken = request.headers.authorization || '';
    const queryToken = request.query.token || '';

    return String(headerToken || queryToken)
      .replace('Bearer', '')
      .trim();
  }
}
