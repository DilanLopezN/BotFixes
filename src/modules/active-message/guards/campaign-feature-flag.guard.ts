import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Exceptions } from './../../auth/exceptions';
import { WorkspacesService } from './../../workspaces/services/workspaces.service';
import { isUserAgent } from '../../../common/utils/roles';

@Injectable()
export class CampaignFeatureFlagGuard implements CanActivate {
    constructor(readonly reflector: Reflector, readonly workspaceService: WorkspacesService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const { workspaceId } = request.params;
        const user = request.user;

        const workspace = await this.workspaceService.getOne(workspaceId);
        if (!workspace.featureFlag?.campaign) {
            throw Exceptions.CAMPAIGN_FEATURE_FLAG_NOT_ENABLED;
        }

        const isAgent = isUserAgent(user, workspaceId);
        if (workspace.featureFlag.campaign && !workspace?.generalConfigs?.enableCampaignAllUsers && isAgent) {
            throw Exceptions.CAMPAIGN_FEATURE_FLAG_NOT_ENABLED;
        }

        return true;
    }
}
