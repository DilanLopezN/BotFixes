import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { KissbotRequest } from '../../../common/interfaces/interfaces';
import { WorkspaceAccessGroupService } from '../services/workspace-access-group.service';
import { matches } from 'ip-matching';
import { geIp } from '../../../common/utils/utils';

export const matchIp = (group: any, clientIp: string, xForwardedForHeader?: string): boolean =>
    group.accessSettings.ipListData.find((ip) => {
        if (ip == '*') {
            return true;
        }

        try {
            if (clientIp == ip) {
                return true;
            }
            const contains = matches(clientIp, ip);
            if (!contains && process.env.NODE_ENV !== 'local') {
                if (xForwardedForHeader) {
                    console.log('======================');
                    console.log('clientIp', clientIp);
                    console.log('GroupIp', ip);
                    console.log('xForwardedForHeader', xForwardedForHeader);
                    console.log('group.name', group.name);
                    console.log('======================');
                }
            }
            return contains;
        } catch (e) {
            console.log('error on IpMiddleware.use', e);
            return false;
        }
    });

@Injectable()
export class IpMiddleware implements NestMiddleware {
    private readonly logger = new Logger(IpMiddleware.name)
    constructor(private readonly workspaceAccessGroupService: WorkspaceAccessGroupService) {}

    async use(req: KissbotRequest, res: Response, next: (...params) => any) {
        const groups = await this.workspaceAccessGroupService.findByWorkspaceId(req.params.workspaceId);
        const clientIp = geIp(req);
        const userGroups = groups.filter((group) => {
            const userId = group.accessSettings.userList.find((userId) => userId.equals(req.user._id));
            return !!userId;
        });
        
        let mismatchIp = false;
        for (const group of userGroups) {
            const ipMatches = matchIp(group, clientIp, req.headers['x-forwarded-for'] as string);
            if (!ipMatches) {
                mismatchIp = true;
            }
        }

        req.mismatchIp = mismatchIp;
        next();
    }
}
