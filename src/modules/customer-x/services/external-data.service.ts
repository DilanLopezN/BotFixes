import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { WorkspaceService } from '../../billing/services/workspace.service';
import { ConversationService } from '../../conversation/services/conversation.service';

@Injectable()
export class ExternalDataService {
    private _workspaceService: WorkspaceService;
    private _conversationService: ConversationService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get workspaceService(): WorkspaceService {
        if (!this._workspaceService) {
            this._workspaceService = this.moduleRef.get<WorkspaceService>(WorkspaceService, { strict: false });
        }
        return this._workspaceService;
    }

    private get conversationService(): ConversationService {
        if (!this._conversationService) {
            this._conversationService = this.moduleRef.get<ConversationService>(ConversationService, { strict: false });
        }
        return this._conversationService;
    }

    async getWorkspaces() {
        try {
            return await this.workspaceService.getActiveWorkspaces();
        } catch (e) {
            return [];
        }
    }

    async getWorkspaceById(workspaceId: string) {
        try {
            return await this.workspaceService.getOneByIdAndVinculedAccount(workspaceId);
        } catch (e) {
            return null;
        }
    }

    async getCountAttendanceWaitingTimeGroupedBy(workspaceId: string) {
        try {
            return await this.conversationService.getCountAttendanceWaitingTimeGroupedBy(workspaceId);
        } catch (e) {
            return [];
        }
    }
}
