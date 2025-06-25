import * as jwt from 'jsonwebtoken';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Exceptions } from '../../auth/exceptions';
import { ReportsAuthInfo } from '../interfaces/reports-auth-info.interface';
import { ReportsRequest } from '../interfaces/reports-request.interface';

export const validateJwt = (token) => {
    try {
        const reportsSecret = process.env.REPORTS_JWT_SECRET;

        return jwt.verify(token, reportsSecret);
    } catch (e) {
        throw Exceptions.INVALID_TOKEN;
    }
};

@Injectable()
export class ReportsAuthMiddleware implements NestMiddleware {
    async use(req: ReportsRequest, res: Response, next: (...params) => any) {
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
        const payload = validateJwt(token) as ReportsAuthInfo;
        const date = new Date().valueOf();
        if (payload.expiration < date) {
            throw Exceptions.EXPIRED_TOKEN;
        }

        if (!payload.permissions?.length) {
            throw Exceptions.INVALID_TOKEN;
        }

        req.workspaceId = payload.workspaceId;
        req.permissions = payload.permissions;

        next();
    }
}
