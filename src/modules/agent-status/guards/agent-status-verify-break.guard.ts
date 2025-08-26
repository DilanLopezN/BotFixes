import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Exceptions } from '../../auth/exceptions';
import { WorkingTimeService } from '../services/working-time.service';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../common/utils/roles';
import { castObjectIdToString } from '../../../common/utils/utils';
import { WorkingTimeType } from '../interfaces/working-time.interface';

@Injectable()
export class AgentStatusVerifyBreakGuard implements CanActivate {
    private workingTimeService: WorkingTimeService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const { workspaceId } = request.params;
        const user = request.user;

        const isAnyAdmin = isAnySystemAdmin(user);
        const isAdmin = workspaceId ? isWorkspaceAdmin(user, workspaceId) : true;
        if (isAnyAdmin || isAdmin) {
            return true;
        }

        this.workingTimeService = this.moduleRef.get<WorkingTimeService>(WorkingTimeService, { strict: false });

        const activeBreak = await this.workingTimeService.findActiveByUserAndWorkspaceId(
            workspaceId,
            castObjectIdToString(user._id),
        );
        if (activeBreak && activeBreak.type !== WorkingTimeType.ONLINE) {
            throw Exceptions.AGENT_STATUS_BREAK_ACTIVE;
        }

        return true;
    }
}
