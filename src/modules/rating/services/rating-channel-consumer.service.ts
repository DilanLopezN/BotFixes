import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { ActivityType } from 'kissbot-core';
import { EventsService } from './../../events/events.service';
import { DialogRatingService } from './dialog-rating.service';
import { RatingService } from './rating.service';
import { ExternalDataService } from './external-data.service';
export const ChannelId = 'rating';

@Injectable()
export class RatingChannelConsumerService {
    private readonly logger = new Logger(RatingChannelConsumerService.name);

    constructor(
        private readonly ratingService: RatingService,
        private readonly dialogRatingService: DialogRatingService,
        private readonly externalDataService: ExternalDataService,
        public readonly eventsService: EventsService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.CHANNEL_EXCHANGE_NAME,
        routingKey: ChannelId + '.outgoing',
        queue: ChannelId + '.outgoing',
        queueOptions: {
            durable: true,
            channel: RatingChannelConsumerService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    async sendMessage(event: any): Promise<void> {
        try {
            const { activity, conversation } = event;

            if (activity.type == ActivityType.rating) {
                const channel = await this.externalDataService.getChannelConfigByIdOrToken(conversation.token);

                await this.ratingService.createRating({
                    conversationId: conversation._id,
                    workspaceId: conversation.workspace?._id,
                    tags: (conversation.tags || [])
                        .filter((tag) => !!tag.name)
                        .map((tag) => (tag.name as string).trim()),
                    channel: String(channel?._id),
                    teamId: conversation.assignedToTeamId,
                    closedBy: activity.from.id,
                });

                await this.dialogRatingService.dispatchInitialDialogActivity(activity.to, conversation._id);
            }
        } catch (e) {
            console.log('Error on RatingQueueService', e);
        }
    }
}
