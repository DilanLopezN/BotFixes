import { Injectable, NestMiddleware } from '@nestjs/common';
import { KissbotRequest } from '../../../common/interfaces/interfaces';
import { GeneralBreakSettingService } from '../services/general-break-setting.service';
import {
    DEFAULT_BREAK_START_DELAY_SECONDS,
    DEFAULT_NOTIFICATION_INTERVAL_SECONDS,
} from '../models/general-break-setting.entity';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { ModuleRef } from '@nestjs/core';
import { isUserAgent } from '../../../common/utils/roles';
import { ZSetEventManagerService } from '../services/zset-event-manager.service';
import { WorkingTimeService } from '../services/working-time.service';
import { WorkingTimeType } from '../interfaces/working-time.interface';

@Injectable()
export class AgentStatusMiddleware implements NestMiddleware {
    constructor(private readonly moduleRef: ModuleRef) {}

    private workspaceService: WorkspacesService;
    private generalBreakSettingService: GeneralBreakSettingService;
    private zsetEventManager: ZSetEventManagerService;
    private workingTimeService: WorkingTimeService;

    private ensureDependenciesLoaded() {
        if (!this.workspaceService) {
            this.workspaceService = this.moduleRef.get(WorkspacesService, { strict: false });
            this.generalBreakSettingService = this.moduleRef.get(GeneralBreakSettingService, { strict: false });
            this.zsetEventManager = this.moduleRef.get(ZSetEventManagerService, { strict: false });
            this.workingTimeService = this.moduleRef.get(WorkingTimeService, { strict: false });
        }
    }

    private async setLastAccessInStatusAgent(workspaceId: string, userId: string, expirationInSeconds: number) {
        const now = Date.now();
        const expirationTimestamp = now + expirationInSeconds * 1000;
        await this.zsetEventManager.addLastAccessEvent(workspaceId, userId, expirationTimestamp, now);
    }

    async use(req: KissbotRequest, res: Response, next: () => void) {
        const workspaceId = req.params?.['workspaceId'];
        const user = req.user;
        const userId = user?._id?.toJSON ? user._id.toJSON() : user?._id;

        // libera o fluxo logo
        next();

        // processa em background sem bloquear a resposta
        if (!workspaceId || !userId || !isUserAgent(user, workspaceId)) return;

        try {
            this.ensureDependenciesLoaded();

            const [workspace, generalBreakSettingByWorkspace] = await Promise.all([
                this.workspaceService.getOne(workspaceId),
                this.generalBreakSettingService.getByWorkspaceId(workspaceId),
            ]);

            if (
                workspace?.advancedModuleFeatures?.enableAgentStatus &&
                workspace?.generalConfigs?.enableAgentStatusForAgents &&
                generalBreakSettingByWorkspace?.enabled
            ) {
                const activeRecord = await this.workingTimeService.findActiveByUser(userId);

                if (activeRecord?.type === WorkingTimeType.ONLINE) {
                    const expiration =
                        (generalBreakSettingByWorkspace.notificationIntervalSeconds ??
                            DEFAULT_NOTIFICATION_INTERVAL_SECONDS) +
                        (generalBreakSettingByWorkspace.breakStartDelaySeconds ?? DEFAULT_BREAK_START_DELAY_SECONDS);

                    await this.setLastAccessInStatusAgent(workspaceId, userId, expiration);
                }
            }
        } catch (error) {
            console.error('ERROR AgentStatusMiddleware:', error);
        }
    }
}
