import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Exceptions } from './../../auth/exceptions';
import { ReportsRequest } from '../interfaces/reports-request.interface';

@Injectable()
export class ReportsValidatorGuard {
    constructor(readonly reflector: Reflector) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: ReportsRequest = context.switchToHttp().getRequest();
        if (!!request.workspaceId) {
            if (!request.permissions.length) {
                return false;
            }

            const parts = request.url.split('/');
            const path = parts?.[parts?.length - 1] || '';
            if (!request.permissions.includes(path)) {
                return false;
            }
            return true;
        }
        throw Exceptions.EXTERNAL_REQUEST_MISSING_WORKSPACE_ID;
    }
}
