import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TeamService } from '../../team-v2/services/team.service';
import { Team } from '../../team-v2/interfaces/team.interface';
import { ConversationService } from '../../conversation/services/conversation.service';
import { Conversation } from '../../conversation/interfaces/conversation.interface';
import { Workspace } from '../../workspaces/interfaces/workspace.interface';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { UsersService } from '../../users/services/users.service';
import { SmtReSettingService } from '../../conversation-smt-re/services/smt-re-setting.service';
import { SmtReSetting } from '../../conversation-smt-re/models/smt-re-setting.entity';

@Injectable()
export class ExternalDataService {
    private _teamService: TeamService;
    private _conversationService: ConversationService;
    private _workspaceService: WorkspacesService;
    private _usersService: UsersService;
    private _smtReSettingService: SmtReSettingService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get teamService(): TeamService {
        if (!this._teamService) {
            this._teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
        }
        return this._teamService;
    }

    private get conversationService(): ConversationService {
        if (!this._conversationService) {
            this._conversationService = this.moduleRef.get<ConversationService>(ConversationService, { strict: false });
        }
        return this._conversationService;
    }

    private get workspaceService(): WorkspacesService {
        if (!this._workspaceService) {
            this._workspaceService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
        }
        return this._workspaceService;
    }

    private get usersService(): UsersService {
        if (!this._usersService) {
            this._usersService = this.moduleRef.get<UsersService>(UsersService, { strict: false });
        }
        return this._usersService;
    }

    private get smtReSettingService(): SmtReSettingService {
        if (!this._smtReSettingService) {
            this._smtReSettingService = this.moduleRef.get<SmtReSettingService>(SmtReSettingService, { strict: false });
        }
        return this._smtReSettingService;
    }

    async getTeam(workspaceId: string, teamId: string): Promise<Team> {
        const { data: team } = await this.teamService.getTeam(workspaceId, teamId);
        return team;
    }

    async getConversation(conversationId: string): Promise<Conversation> {
        return await this.conversationService.getConversationById(conversationId);
    }

    async getWorkspace(workspaceId: string): Promise<Workspace> {
        return await this.workspaceService._getOne(workspaceId);
    }

    async getUsersByIds(userIds: string[]) {
        return await this.usersService.getUsersByIds(userIds);
    }

    async getSmtReSettingsByIds(ids: string[]): Promise<SmtReSetting[]> {
        return await this.smtReSettingService.findByIds(ids);
    }
}
