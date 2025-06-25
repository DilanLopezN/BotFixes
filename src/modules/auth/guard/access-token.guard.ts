import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Exceptions } from '../exceptions';
import { validateJwt } from '../middleware/auth.middleware';

@Injectable()
export class AccessTokenGuard implements CanActivate {
    constructor(readonly reflector: Reflector) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest();
        const authorizationToken: string | undefined = req.headers?.['authorization']?.split(' ')?.[1];
        const acessToken: string | undefined = req.headers?.['access-token']?.split(' ')?.[1];

        try {
            validateJwt(authorizationToken, process.env.COGNITO_AUTHORIZATION_JWK);
            validateJwt(acessToken, process.env.COGNITO_AUTHORIZATION_JWK);
            return true;
        } catch (error) {
            console.log(error);
            throw Exceptions.INVALID_TOKEN;
        }
    }
}
