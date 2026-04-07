import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ShiftKeyGuard implements CanActivate {
  public verifyKey(key: string): boolean {
    return key === process.env.SHIFT_API_KEY;
  }

  public canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    if (!process.env.SHIFT_API_KEY) {
      throw new UnauthorizedException('Shift key unavailable');
    }

    if (!this.verifyKey(request.headers['x-shift-key'])) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
