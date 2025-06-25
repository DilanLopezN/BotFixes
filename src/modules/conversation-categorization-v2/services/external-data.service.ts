import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TeamService } from '../../team-v2/services/team.service';
import { Team } from '../../team-v2/interfaces/team.interface';
import { ConversationService } from '../../conversation/services/conversation.service';
import { Conversation } from '../../conversation/interfaces/conversation.interface';
import { Workspace } from '../../workspaces/interfaces/workspace.interface';
import { WorkspacesService } from '../../workspaces/services/workspaces.service';
import { UsersService } from '../../users/services/users.service';

@Injectable()
export class ExternalDataService {
    private teamService: TeamService;
    private conversationService: ConversationService;
    private workspaceService: WorkspacesService;
    private usersService: UsersService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.teamService = this.moduleRef.get<TeamService>(TeamService, { strict: false });
        this.conversationService = this.moduleRef.get<ConversationService>(ConversationService, { strict: false });
        this.workspaceService = this.moduleRef.get<WorkspacesService>(WorkspacesService, { strict: false });
        this.usersService = this.moduleRef.get<UsersService>(UsersService, { strict: false });
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
}
