import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WorkspaceService } from '../../billing/services/workspace.service';
import { ConversationService } from '../../conversation/services/conversation.service';

@Injectable()
export class ExternalDataService {
    private workspaceService: WorkspaceService;
    private conversationService: ConversationService;
    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.workspaceService = this.moduleRef.get<WorkspaceService>(WorkspaceService, { strict: false });
        this.conversationService = this.moduleRef.get<ConversationService>(ConversationService, { strict: false });
    }

    async getWorkspaces() {
        try {
            return await this.workspaceService.getActiveWorkspaces();
        } catch (e) {
            return [];
        }
    }

    async getWorkspaceById(wokspaceId: string) {
        try {
            return await this.workspaceService.getOneByIdAndVinculedAccount(wokspaceId);
        } catch (e) {
            return null;
        }
    }

    async getCountAttendanceWaitingTimeGroupedBy(wokspaceId: string) {
        try {
            return await this.conversationService.getCountAttendanceWaitingTimeGroupedBy(wokspaceId);
        } catch (e) {
            return [];
        }
    }
}
