import * as jwt from 'jsonwebtoken';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { KissbotRequest } from '../../../common/interfaces/interfaces';
import { Exceptions } from '../../auth/exceptions';
import { RunnerManagerAuthInfo } from '../interfaces/runner-manager-auth-info.interface';

export const validateJwt = (token) => {
    const runnerManagerSecret = process.env.RUNNER_MANAGER_JWT_SECRET;

    return jwt.verify(token, runnerManagerSecret);
};

@Injectable()
export class RunnerManagerAuthMiddleware implements NestMiddleware {

    async use(req: KissbotRequest, res: Response, next: (...params) => any) {
        const request = req;
        const bearerHeader = request.headers['authorization'];

        if (!bearerHeader) {
            throw Exceptions.AUTHORIZATION_TOKEN_MUST_BE_PROVIDED;
        }
        const headerContent = bearerHeader.split(' ');
        const bearerToken = headerContent[0];
        const token = headerContent[1];
        if (!token || bearerToken != 'Bearer') {
            throw Exceptions.INVALID_TOKEN;
        }
        try {
            const payload = validateJwt(token);
            req.runnerManagerAuthInfo = payload as RunnerManagerAuthInfo;
        } catch (e) {
            throw Exceptions.INVALID_TOKEN;
        }
        next();
    }
}
