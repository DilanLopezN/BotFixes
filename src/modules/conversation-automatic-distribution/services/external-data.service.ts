import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConversationService } from '../../conversation/services/conversation.service';
import { UsersService } from '../../users/services/users.service';
import { TeamService } from '../../team/services/team.service';
import { WorkingTimeService } from '../../../modules/agent-status/services/working-time.service';
import { WorkingTimeType } from '../../../modules/agent-status/interfaces/working-time.interface';
import { WorkspacesService } from '../../../modules/workspaces/services/workspaces.service';

@Injectable()
export class ExternalDataService {
    private _conversationService: ConversationService;
    private _usersService: UsersService;
    private _teamService: TeamService;
    private _workingTimeService: WorkingTimeService;
    private _workspacesService: WorkspacesService;
    constructor(private readonly moduleRef: ModuleRef) {}

    private get conversationService(): ConversationService {
        if (!this._conversationService) {
            this._conversationService = this.moduleRef.get<ConversationService>(ConversationService, { strict: false });
        }
        return this._conversationService;
    }

    private get usersService(): UsersService {
        if (!this._usersService) {
            this._usersService = this.moduleRef.get<UsersService>(UsersService, { strict: false });
        }
        return this._usersService;
    }

    private get teamService(): TeamService {
        if (!this._teamService) {
            this._teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
        }
        return this._teamService;
    }

    private get workingTimeService(): WorkingTimeService {
        if (!this._workingTimeService) {
            this._workingTimeService = this.moduleRef.get<WorkingTimeService>(WorkingTimeService, { strict: false });
        }
        return this._workingTimeService;
    }

    private get workspacesService(): WorkspacesService {
        if (!this._workspacesService) {
            this._workspacesService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
        }
        return this._workspacesService;
    }

    async getConversationById(conversationId: string) {
        const result = await this.conversationService.getOne(conversationId);
        return result;
    }

    async addMember(conversationId, member) {
        await this.conversationService.addMember(conversationId, member);
    }

    async dispatchMessageActivity(conversation, activity) {
        await this.conversationService.dispatchMessageActivity(conversation, activity);
    }

    async transferConversationToAgent(conversationId: string, agentId: string): Promise<void> {
        try {
            await this.conversationService.transferConversationToAgentAutomaticDistribution(conversationId, agentId);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getUsersByQuery(query: any) {
        return await this.usersService.getAll(query);
    }

    async getTeamById(teamId: string) {
        return await this.teamService.getOne(teamId);
    }

    getConversationModel() {
        return this.conversationService.getModel();
    }

    async getUserConversationCounts(userIds: string[], workspaceId: string): Promise<Map<string, number>> {
        return await this.conversationService.getUserConversationCounts(userIds, workspaceId);
    }

    async isAgentStatusActive(workspaceId: string) {
        const workspace = await this.workspacesService._getOne(workspaceId);

        if (
            !workspace?.advancedModuleFeatures?.enableAgentStatus ||
            !workspace?.generalConfigs?.enableAgentStatusForAgents
        ) {
            return false;
        }

        return true;
    }

    async isOnline(userId: string) {
        const workingTime = await this.workingTimeService.findActiveByUser(userId);
        if (!workingTime) {
            return false;
        }
        if (workingTime.type == WorkingTimeType.ONLINE) {
            return true;
        }
        return false;
    }
}
