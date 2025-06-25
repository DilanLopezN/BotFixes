import { CacheService } from '../../_core/cache/cache.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { Team } from '../interfaces/team.interface';
import { castObjectId } from '../../../common/utils/utils';
import { EventsService } from '../../events/events.service';
import { Exceptions } from '../../auth/exceptions';
import { ConversationService } from '../../conversation/services/conversation.service';
import { KissbotEventDataType, KissbotEventType } from 'kissbot-core';

@Injectable()
export class DeleteTeamService extends MongooseAbstractionService<Team> {
    constructor(
        @InjectModel('Team') protected readonly model: Model<Team>,
        private readonly conversationService: ConversationService,
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

    async deleteTeam(teamId: string) {
        const team = await this.getOne(teamId);
        if (!team) {
            throw Exceptions.TEAM_NOT_FOUND;
        }

        const conversationsOpenedByTeam = await this.conversationService.getOpenedConversationsByAssignedToTeamId(
            String(team.workspaceId),
            teamId,
        );

        if (conversationsOpenedByTeam?.length) {
            throw Exceptions.ERROR_DELETE_TEAM_EXIST_OPENED_CONVERSATIONS;
        }

        if (this.cacheService) {
            this.cacheService.remove(teamId).then().catch(console.log);
        }

        await this.model.updateOne({ _id: castObjectId(teamId) }, { $set: { deletedAt: new Date() } } as any);

        return { deleted: true };
    }
}
