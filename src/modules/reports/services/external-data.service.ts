import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { UserRoles } from 'kissbot-core';
import { WorkspaceUserService } from '../../workspace-user/workspace-user.service';
import { Result_getUserList } from '../interfaces/result_get_user_list.interface';

@Injectable()
export class ExternalDataService {
    private workspaceUserService: WorkspaceUserService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.workspaceUserService = this.moduleRef.get<WorkspaceUserService>(WorkspaceUserService, { strict: false });
    }
    async reportGetAllWorkspaceUser(workspaceId: string): Promise<Result_getUserList[]> {
        const result = await this.workspaceUserService.getAllWorkspaceUser(
            {
                filter: {},
                projection: {
                    email: 0,
                    timezone: 0,
                    loginMethod: 0,
                    language: 0,
                    createdAt: 0,
                    updatedAt: 0,
                    passwordExpires: 0,
                    cognitoUniqueId: 0,
                    liveAgentParams: 0,
                    avatar: 0,
                },
            },
            workspaceId,
        );

        if (result?.data?.length) {
            return result.data.map((user) => {
                const status = !!user?.roles?.find((role) => role.role === UserRoles.WORKSPACE_INACTIVE)
                    ? 'inativo'
                    : 'ativo';
                return { id: String(user._id), nome: user.name, status: status };
            });
        }
        return [];
    }
}
