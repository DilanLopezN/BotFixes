import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { Team, TeamUser } from '../interfaces/team.interface';
import { KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';
import { SimplifiedTeam } from '../interfaces/simplified-team.interface';
import { ExternalDataService } from './external-data.service';
import { castObjectId, castObjectIdToString, getUnaccentRegexString } from '../../../common/utils/utils';
import { DefaultResponse } from '../../../common/interfaces/default';
import { TeamCacheService } from './team-cache.service';
import { CreateTeamParams } from '../interfaces/create-team.interface';
import { UpdateTeamParams } from '../interfaces/update-team.interface';
import { UpdateTeamResponse } from '../interfaces/update-team-response.interface';
import * as moment from 'moment';
import { TeamHistoryService } from './teamHistory.service';
import { EventsService } from '../../events/events.service';
import { omit } from 'lodash';

@Injectable()
export class TeamService {
    constructor(
        @InjectModel('Team') protected readonly model: Model<Team>,
        private readonly externalDataService: ExternalDataService,
        private readonly teamHistoryService: TeamHistoryService,
        @Inject(TeamCacheService) private readonly teamCacheService: TeamCacheService,
        @Inject(EventsService) protected readonly eventsService: EventsService,
    ) {}

    getSearchFilter(search: any) {
        const regexSearch = getUnaccentRegexString(search);
        return {
            $or: [
                {
                    name: { $regex: `.*${regexSearch}.*`, $options: 'i' },
                },
            ],
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

    private async sendEvent(data: Team, operation: 'update' | 'create' | 'delete') {
        if (this.eventsService) {
            const eventsData = this.getEventsData();
            if (eventsData && eventsData[operation]) {
                this.eventsService.sendEvent({
                    data,
                    dataType: eventsData.dataType,
                    source: KissbotEventSource.KISSBOT_API,
                    type: eventsData[operation],
                });
            }
        }
    }

    async listSimplified(
        workspaceId: string,
        usersLimit: number = 5,
        search: string = null,
    ): Promise<DefaultResponse<SimplifiedTeam[]>> {
        let searchFilter = {};

        const hasSearch = JSON.stringify(search) !== JSON.stringify({ $exists: true });
        if (search && hasSearch) searchFilter = this.getSearchFilter(search.toString());

        const teams: Team[] = await this.model
            .find(
                {
                    workspaceId,
                    ...searchFilter,
                    deletedAt: { $exists: false },
                },
                'name roleUsers inactivatedAt',
            )
            .sort({ name: 1 })
            .exec();

        const simplifiedTeams = await Promise.all(
            teams.map(async (team) => await this.mapToSimplifiedTeam(team, workspaceId, usersLimit)),
        );

        return {
            data: simplifiedTeams,
        };
    }

    private async mapToSimplifiedTeam(team: Team, workspaceId: string, usersLimit: number): Promise<SimplifiedTeam> {
        const users = await this.mapTeamUsers(team.roleUsers, workspaceId);
        const simplifiedTeam: SimplifiedTeam = {
            _id: team._id.toString(),
            name: team.name,
            users: users.slice(0, usersLimit),
            usersCount: users.length,
            inactivedAt: team.inactivatedAt,
        };

        return simplifiedTeam;
    }

    private async mapTeamUsers(
        roleUsers: TeamUser[],
        workspaceId: string,
    ): Promise<{ _id: ObjectId; name: string; avatar: string }[]> {
        const userIds = roleUsers.map((roleUser) => castObjectId(roleUser.userId));

        const users = await this.externalDataService.getUsers(userIds, workspaceId, '_id name avatar');

        return users.map((user) => ({
            _id: user._id,
            name: user.name,
            avatar: user.avatar ?? '',
        }));
    }

    async doInactiveTeam(workspaceId: string, teamId: string): Promise<DefaultResponse<Team>> {
        teamId = castObjectId(teamId);
        workspaceId = castObjectId(workspaceId);

        const team: Team = await this.model.findOne({ _id: teamId, workspaceId });

        if (!team) throw new NotFoundException(`Team with ID '${teamId}' not found in workspace '${workspaceId}'.`);
        if (team.inactivatedAt) throw new BadRequestException(`team '${teamId}' already inactive.`);

        team.inactivatedAt = new Date();
        try {
            await team.save();
        } catch (err) {
            console.log('ERROR', err);
            throw new BadRequestException(err.message);
        }
        await this.teamCacheService.deleteFromCache(teamId, workspaceId);
        return {
            data: team,
        };
    }

    async doDeleteTeam(workspaceId: string, whoUserId: string, teamId: string): Promise<DefaultResponse<Team>> {
        teamId = castObjectId(teamId);
        workspaceId = castObjectId(workspaceId);

        const team: Team = await this.model.findOne({ _id: teamId, workspaceId });

        if (!team) throw new NotFoundException(`Team with ID '${teamId}' not found in workspace '${workspaceId}'.`);
        if (team.deletedAt) throw new BadRequestException(`team '${teamId}' is already deleted.`);

        team.deletedAt = new Date();
        try {
            await team.save();
        } catch (err) {
            console.log('ERROR', err);
            throw new BadRequestException(err.message);
        }
        await this.teamHistoryService.create(whoUserId, team);
        return {
            data: team,
        };
    }

    async getTeam(workspaceId: string, teamId: string): Promise<DefaultResponse<Team>> {
        let team: Team = await this.teamCacheService.getFromCache(teamId, workspaceId);

        if (team) return { data: team };

        team = await this.model
            .findOne({
                _id: castObjectId(teamId),
                workspaceId: castObjectId(workspaceId),
                deletedAt: undefined,
            })
            .exec();

        if (!team) throw new NotFoundException(`Team with ID '${teamId}' not found in workspace '${workspaceId}'.`);

        await this.teamCacheService.saveToCache(team, workspaceId);

        return { data: team };
    }

    async getTeamsByIds(workspaceId: string, teamIds: string[]): Promise<DefaultResponse<Team[]>> {
        const teams = await this.model
            .find({
                workspaceId: castObjectId(workspaceId),
                _id: { $in: teamIds.map((id) => castObjectId(id)) },
            })
            .exec();

        return { data: teams };
    }

    async createTeam(workspaceId: string, teamParams: CreateTeamParams): Promise<DefaultResponse<Team>> {
        let team: Team;
        try {
            team = await this.model.create({ ...teamParams, workspaceId });
        } catch (error) {
            console.error('Error on creating team:', JSON.stringify(error));
            throw new Error('Error on creating team.');
        }

        try {
            if (team?._id && team?.reassignConversationInterval > 0)
                await this.externalDataService.updateInteractionWelcome(workspaceId);
        } catch (error) {
            console.log('Error on updating interaction on create team: ', JSON.stringify(error));
            throw new Error('Error on updating interaction on create team.');
        }

        return {
            data: team,
            metadata: {
                count: 1,
                skip: 0,
                limit: 1,
            },
        };
    }

    async updateTeam(
        workspaceId: string,
        whoUserId: string,
        teamParams: UpdateTeamParams,
    ): Promise<UpdateTeamResponse> {
        let team: Team = await this.teamCacheService.getFromCache(String(teamParams.teamId), workspaceId);

        const teamId = castObjectId(teamParams.teamId);
        if (!team)
            team = await this.model
                .findOne({
                    _id: teamId,
                    workspaceId: castObjectId(workspaceId),
                    deletedAt: undefined,
                })
                .exec();

        if (!team)
            throw new NotFoundException(`Team with ID '${String(teamId)}' not found in workspace '${workspaceId}'.`);

        try {
            if (teamParams?.reassignConversationInterval > 0)
                await this.externalDataService.updateInteractionWelcome(workspaceId);
        } catch (error) {
            console.log('Error on updating interaction on update team: ', JSON.stringify(error));
            return {
                ok: false,
            };
        }

        try {
            await this.update(teamId, {
                ...team?.toJSON?.({ minimize: false }),
                ...teamParams,
                updatedAt: moment().valueOf(),
            });
        } catch (error) {
            console.error('Error on updating team:', JSON.stringify(error));
            return {
                ok: false,
            };
        }
        await this.teamCacheService.deleteFromCache(teamId, workspaceId);
        await this.teamHistoryService.create(whoUserId, team);
        return {
            ok: true,
        };
    }

    async doReactivateTeam(workspaceId: string, teamId: string): Promise<DefaultResponse<Team>> {
        teamId = castObjectId(teamId);
        workspaceId = castObjectId(workspaceId);

        const team: Team = await this.model.findOne({ _id: teamId, workspaceId });

        if (!team) throw new NotFoundException(`Team with ID '${teamId}' not found in workspace '${workspaceId}'.`);
        if (!team.inactivatedAt) throw new BadRequestException(`team '${teamId}' is already active.`);

        team.set('inactivatedAt', undefined, { strict: false });
        try {
            await team.save();
        } catch (err) {
            console.log('ERROR', err);
            throw new BadRequestException(err.message);
        }
        await this.teamCacheService.deleteFromCache(teamId, workspaceId);
        return {
            data: team,
        };
    }

    public async update(teamId: string | ObjectId, team: any): Promise<Team> {
        const exists = await this.model.findOne({ _id: castObjectId(teamId) });
        const parsedTeam = team.toJSON ? team.toJSON() : team;
        const newObj = Object.assign(exists.toJSON(), parsedTeam);
        await this.model.updateOne({ _id: castObjectId(teamId) }, {
            $set: omit({ ...newObj }, ['_id']),
        } as any);
        this.sendEvent(newObj, 'update');
        return newObj;
    }

    public async getUsersOnTeam(workspaceId: string, teamId: string): Promise<{ _id: string; name: string }[]> {
        const team = (await this.getTeam(workspaceId, teamId)).data;
        const userIds = team.roleUsers.map((roleUser) => castObjectId(roleUser.userId));

        const users = await this.externalDataService.getUsers(userIds, workspaceId, '_id name');

        return users.map((user) => ({
            _id: castObjectIdToString(user._id),
            name: user.name,
        }));
    }

    public async getUserTeams(userId: string, workspaceId: string) {
        return await this.model.find(
            {
                'roleUsers.userId': castObjectId(userId),
                deletedAt: { $exists: false },
                workspaceId: castObjectId(workspaceId),
            },
            '_id name inactivatedAt',
        );
    }
}
