import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { PublicAuthService } from '../services/public-auth.service';

@Injectable()
export class PublicAuthGuard implements CanActivate {
  constructor(private readonly publicAuthService: PublicAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const authToken = await this.publicAuthService.validateToken(token);

    if (!authToken) {
      throw new UnauthorizedException('Token inválido ou inativo');
    }

    request.integrationId = authToken.integrationId;
    request.authTokenId = authToken.id;

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers['authorization'];
    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
