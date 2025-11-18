import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  public verifyToken(token: string): boolean {
    return token === process.env.API_TOKEN;
  }

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!this.verifyToken(this.getToken(request))) {
      throw new UnauthorizedException();
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
