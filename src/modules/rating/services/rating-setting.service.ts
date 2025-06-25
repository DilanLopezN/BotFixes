import { InjectRepository } from '@nestjs/typeorm';
import { CatchError, Exceptions } from './../../auth/exceptions';
import { Repository } from 'typeorm';
import { RatingSetting } from '../models/rating-setting.entity';
import { CreateRatingSettingData } from '../interfaces/rating-setting.interface';
import { Rating } from '../models/rating.entity';
import { RATING_CONNECTION } from '../ormconfig';

export class RatingSettingService {
    constructor(
        @InjectRepository(RatingSetting, RATING_CONNECTION)
        private settingRepository: Repository<RatingSetting>,
    ) {}

    @CatchError()
    async findOneByWorkspaceId(workspaceId: string): Promise<RatingSetting> {
        const setting = await this.settingRepository
            .createQueryBuilder('settings')
            .where('settings.workspace_id = :workspaceId', { workspaceId })
            .getOne();

        if (!setting) {
            return;
        }

        return {
            ...setting,
            expiresIn: setting?.expiresIn ? parseInt(String(setting?.expiresIn), 10) : setting?.expiresIn,
        };
    }

    @CatchError()
    async getSettingIdByConversationId(conversationId: string): Promise<RatingSetting> {
        return await this.settingRepository
            .createQueryBuilder('settings')
            .select('settings.id')
            .innerJoin(
                Rating,
                'rating',
                `rating.workspace_id = settings.workspace_id AND rating.conversation_id = '${conversationId}'`,
            )
            .getOne();
    }

    @CatchError()
    async create(data: CreateRatingSettingData): Promise<void> {
        const existingSetting = await this.findOneByWorkspaceId(data.workspaceId);
        if (existingSetting) {
            throw Exceptions.RATING_SETTING_ALREADY_EXISTS;
        }
        await this.settingRepository.insert(data as any);
    }

    @CatchError()
    async updateRatingAndFeedbackText(data: CreateRatingSettingData, settingsId: number): Promise<void> {
        const existingSetting = await this.findOneByWorkspaceId(data.workspaceId);
        if (!existingSetting) {
            throw Exceptions.BAD_REQUEST;
        }

        await this.settingRepository.update(
            { id: settingsId, workspaceId: data.workspaceId },
            {
                ratingText: data.ratingText,
                feedbackText: data.feedbackText,
                linkText: data.linkText,
                disableLinkAfterRating: data.disableLinkAfterRating,
                expiresIn: data.expiresIn,
                channelCriteria: data.channelCriteria,
                tagCriteria: data.tagCriteria,
                teamCriteria: data.teamCriteria,
                ctaButtonText: data.ctaButtonText,
                ctaButtonUrl: data.ctaButtonUrl,
                messageAfterRating: data.messageAfterRating,
            },
        );
    }
}
