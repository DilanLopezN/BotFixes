import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { CatchError } from '../../auth/exceptions';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { castObjectIdToString } from '../../../common/utils/utils';
import { ConversationAttributeService } from '../../conversation-attribute/service/conversation-attribute.service';

@Injectable()
export class SetupWorkspaceService {
    constructor(private readonly moduleRef: ModuleRef) {}

    @CatchError()
    async createWorkspace(workspaceName: string) {
        const workspaceService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
        const conversationAttributeService = this.moduleRef.get<ConversationAttributeService>(ConversationAttributeService, {
            strict: false,
        });
        const workspace = await workspaceService._create({
            name: workspaceName,
        });

        await conversationAttributeService.configurePartitioning(castObjectIdToString(workspace._id));

        return workspace?.toJSON?.();
    }
}
