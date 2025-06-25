import {
    CanActivate,
    ExecutionContext,
    Injectable,
} from '@nestjs/common';
import { Exceptions } from '../exceptions';

@Injectable()
export class AuthApiGuard implements CanActivate {
    constructor() { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        if (process.env.NODE_ENV === 'test') {
            return true;
        }
        if (!request.user) {
            throw Exceptions.AUTHORIZATION_TOKEN_MUST_BE_PROVIDED;
        } else if (request.user
            && request.user.name === 'API_USER'
            && request.user.email === 'api@botdesigner.io') {
            return true;
        }
    }
}
