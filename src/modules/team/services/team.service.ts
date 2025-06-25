import { OffDaysPeriod, TeamPermissionTypes } from '../interfaces/team.interface';
import { CacheService } from '../../_core/cache/cache.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { Team } from '../interfaces/team.interface';
import { KissbotEventDataType, KissbotEventType, User } from 'kissbot-core';
import { castObjectId, castObjectIdToString } from '../../../common/utils/utils';
import { EventsService } from '../../events/events.service';
import { CreateTeamDto, UpdateTeamDto } from '../dto/team.dto';
import { TeamHistoryService } from './teamHistory.service';
import * as moment from 'moment';
import { ExternalDataService } from './external-data.service';
import { isAnySystemAdmin, isSystemAdmin, isWorkspaceAdmin } from '../../../common/utils/roles';
import { User as UserInterface } from './../../users/interfaces/user.interface';

@Injectable()
export class TeamService extends MongooseAbstractionService<Team> {
    constructor(
        @InjectModel('Team') protected readonly model: Model<Team>,
        private readonly teamHistoryService: TeamHistoryService,
        private readonly externalDataService: ExternalDataService,
        cacheService: CacheService,
        eventsService: EventsService,
    ) {
        super(model, cacheService, eventsService);
    }

    getSearchFilter(search: any) {
        if (
            String(search)
                .split('')
                .every((char: string) => char === '.')
        ) {
            search = `[${search}]`;
        }

        return {
            $or: [{ name: { $regex: `.*${search}.*`, $options: 'i' } }],
        };
    }

    getEventsData() {
        return {
            dataType: KissbotEventDataType.ANY,
            update: KissbotEventType.TEAM_UPDATED,
            create: KissbotEventType.TEAM_CREATED,
            delete: KissbotEventType.TEAM_DELETED,
        };
    }

    async getTeamsOneUserCanViewOpenTeamConversations(workspaceId: string, userId: string) {
        return await this.model
            .find({
                workspaceId,
                roleUsers: {
                    $elemMatch: {
                        userId,
                        $or: [{ 'permission.canViewOpenTeamConversations': true }, { isSupervisor: true }],
                    },
                },
            })
            .exec();
    }

    async getTeamByUserIsSupervisor(workspaceId: string, teamId: string, userId: string) {
        return await this.model
            .findOne({
                workspaceId,
                _id: teamId,
                roleUsers: {
                    $elemMatch: {
                        userId,
                        isSupervisor: { $eq: true },
                    },
                },
            })
            .exec();
    }

    async getUserTeamPermissions(workspaceId: string, userId: string, type: TeamPermissionTypes, teamId?: string) {
        const permissionField = `permission.${type}`;
        const orCondition = [{ [permissionField]: true }];

        // se for supervisor não deve dar match se for consultada a permissao de histórico
        if (type !== TeamPermissionTypes.canViewHistoricConversation) {
            orCondition.push({ isSupervisor: true });
        }

        let query = {
            workspaceId,
            roleUsers: {
                $elemMatch: {
                    userId,
                    $or: orCondition,
                },
            },
        } as FilterQuery<Team>;

        if (teamId) {
            query = {
                _id: teamId,
                ...query,
            };
        }

        return await this.model.find(query).exec();
    }

    async getTeamsByWorkspaceAndUser(workspaceId: string, userId: string) {
        return await this.model
            .find({
                roleUsers: {
                    $elemMatch: {
                        userId,
                        'permission.canViewHistoricConversation': { $not: { $eq: true } },
                    },
                },
                workspaceId,
            })
            .exec();
    }

    async getAllTeamsByWorkspaceAndUser(workspaceId: string, userId: string) {
        return await this.model
            .find({
                roleUsers: {
                    $elemMatch: {
                        userId,
                    },
                },
                workspaceId,
            })
            .exec();
    }

    async getUserIsOnTeam(userId: string, teamId: string) {
        return await this.model
            .findOne({
                _id: castObjectId(teamId),
                roleUsers: {
                    $elemMatch: {
                        userId,
                        'permission.canViewHistoricConversation': { $not: { $eq: true } },
                    },
                },
            })
            .exec();
    }

    async canSendMultipleMessage(userId: string, teamId: string): Promise<Boolean> {
        const permissionField = `permission.${TeamPermissionTypes.canSendMultipleMessages}`;

        const result = await this.model
            .findOne({
                _id: castObjectId(teamId),
                roleUsers: {
                    $elemMatch: {
                        userId,
                        $or: [{ [permissionField]: true }, { isSupervisor: true }],
                    },
                },
            })
            .exec();

        return !!result?._id;
    }

    async listTeamsCanSendMultipleMessage(workspaceId: string, user: UserInterface): Promise<Partial<Team>[]> {
        const permissionField = `permission.${TeamPermissionTypes.canSendMultipleMessages}`;

        let query = {
            workspaceId,
            deletedAt: { $eq: null },
        } as FilterQuery<Team>;

        if (!isAnySystemAdmin(user) && !isWorkspaceAdmin(user, workspaceId)) {
            query = {
                ...query,
                roleUsers: {
                    $elemMatch: {
                        userId: user._id,
                        $or: [{ [permissionField]: true }, { isSupervisor: true }],
                    },
                },
            };
        }

        return await this.model.find(query, { _id: 1, name: 1, inactivatedAt: 1 }).exec();
    }

    async _queryPaginate(query: any, user: User, workspaceId: string) {
        return await this.queryPaginate(query);
    }

    async createTeam(workspaceId: string, team: CreateTeamDto) {
        const result = await this.create(team);
        try {
            if (result?._id && result?.reassignConversationInterval > 0) {
                await this.externalDataService.updateInteractionWelcome(workspaceId);
            }
        } catch (e) {
            console.log('Error on update interaction on update team: ', JSON.stringify(e));
        }
        return result;
    }

    async updateTeam(workspaceId: string, whoUserId: string, teamId: string, teamData: UpdateTeamDto) {
        const team = await this.getOne({ _id: teamId });

        try {
            if (teamData?.reassignConversationInterval > 0) {
                await this.externalDataService.updateInteractionWelcome(workspaceId);
            }
        } catch (e) {
            console.log('Error on update interaction on update team: ', JSON.stringify(e));
        }
        const newRole = teamData.roleUsers.map((role) => {
            if (role.permission.canViewHistoricConversation) {
                let permission = {
                    ...Object.keys(TeamPermissionTypes).reduce((acc, permission) => {
                        return {
                            ...acc,
                            [permission]: false,
                        };
                    }, {}),
                    canViewHistoricConversation: true,
                } as { [key in TeamPermissionTypes]: boolean };
                role.permission = permission;
                return role;
            }
            return role;
        });

        const updatedTeam = await this.update(teamId, {
            ...team.toJSON({ minimize: false }),
            ...teamData,
            roleUsers: newRole,
            updatedAt: moment().valueOf(),
        });

        await this.teamHistoryService.create(whoUserId, team);

        return updatedTeam;
    }

    async createOffDayTeams(teamIds: string[], offDay: OffDaysPeriod, whoUserId: string): Promise<any> {
        await teamIds.forEach(async (id) => {
            const team = await this.getOne({
                _id: id,
            });

            if (team) {
                const newOffDays = [...team.offDays, offDay];

                await this.update(castObjectIdToString(team._id), {
                    ...team.toObject(),
                    offDays: newOffDays,
                    updatedAt: moment().valueOf(),
                });

                await this.teamHistoryService.create(whoUserId, team);
            }
        });
    }
}
