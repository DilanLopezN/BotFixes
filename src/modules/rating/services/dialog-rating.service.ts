import { Injectable } from '@nestjs/common';
import { ActivityType, KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';
import { CustomEnvs, getEnv } from '../../../common/utils/get-env';
import { Rating } from '../models/rating.entity';
import { CatchError } from './../../auth/exceptions';
import { EventsService } from './../../events/events.service';
import { RatingService } from './rating.service';

@Injectable()
export class DialogRatingService {
    constructor(public readonly eventsService: EventsService, private readonly ratingService: RatingService) {}

    async dispatchInitialDialogActivity(member, conversationId: string): Promise<void> {
        const rating = await this.ratingService.getRatingWithSetting(conversationId);

        let canRating = true

        if(!!rating.setting.teamCriteria && rating.setting.teamCriteria.length > 0) {
            if (!rating.setting.teamCriteria.includes(rating.teamId)) {
                canRating = false
            }
        }

        if(!!rating.setting.channelCriteria && rating.setting.channelCriteria.length > 0) {
            if (!rating.setting.channelCriteria.includes(rating.channel)) {
                canRating = false
            }
        }

        if (!canRating) {
            return;
        }

        const content = await this.getMessageContent(rating);

        const activityRequestDto: any = {
            type: ActivityType.rating_message,
            from: member,
        };

        if (typeof content == 'object') {
            activityRequestDto.attachments = [content];
        } else {
            activityRequestDto.text = content;
        }

        const event = {
            data: {
                _id: conversationId,
                activity: activityRequestDto,
            },
            dataType: KissbotEventDataType.ACTIVITY,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.ACTIVITY_RECEIVED_REQUEST,
        };

        await this.eventsService.sendEvent(event);
    }

    @CatchError()
    private async getMessageContent(rating: Rating): Promise<string> {
        let message = `${getEnv(CustomEnvs.rating_api_uri)}/a/${rating.urlIdentifier}`;

        if (rating.setting?.linkText) {
            message = `${rating.setting?.linkText}\n${message}`;
        }
        return message;
    }
}
