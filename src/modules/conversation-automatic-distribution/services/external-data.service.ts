import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { ConversationService } from '../../conversation/services/conversation.service';
import { UsersService } from '../../users/services/users.service';
import { TeamService } from '../../team/services/team.service';

@Injectable()
export class ExternalDataService {
    private conversationService: ConversationService;
    private usersService: UsersService;
    private teamService: TeamService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.conversationService = this.moduleRef.get<ConversationService>(ConversationService, { strict: false });
        this.usersService = this.moduleRef.get<UsersService>(UsersService, { strict: false });
        this.teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
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
}
