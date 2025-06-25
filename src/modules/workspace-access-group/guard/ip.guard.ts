import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { KissbotRequest } from './../../../common/interfaces/interfaces';
import { Exceptions } from './../../auth/exceptions';
import { isAnySystemAdmin } from '../../../common/utils/roles';

@Injectable()
export class IpGuard implements CanActivate {
    constructor() {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req: KissbotRequest = context.switchToHttp().getRequest();

        if (!req.user) {
            throw new UnauthorizedException();
        }

        const sysAdmin = isAnySystemAdmin(req.user);

        if (sysAdmin) {
            return true;
        }

        if (req.mismatchIp) {
            throw Exceptions.IP_MIDDLEWARE_VALIDATION_FAILED;
        }
        return true;
    }
}
