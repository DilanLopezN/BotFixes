import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCampaignActionData, UpdateCampaignActionData } from '../interfaces/campaign-action-data.interface';
import { CampaignAction } from '../models/campaign-action.entity';
import { CAMPAIGN_CONNECTION } from '../ormconfig';
import { Exceptions } from '../../auth/exceptions';
import { ExternalDataService } from './external-data.service';

@Injectable()
export class CampaignActionService {
    constructor(
        @InjectRepository(CampaignAction, CAMPAIGN_CONNECTION)
        private campaignActionRepository: Repository<CampaignAction>,
        private readonly externalDataService: ExternalDataService,
    ) {}

    async listByWorkspaceId(workspaceId: string): Promise<CampaignAction[]> {
        const campaignActions = await this.campaignActionRepository.find({ workspaceId });

        const result: CampaignAction[] = await Promise.all(
            campaignActions.map(async (campaignAction) => {
                const published = await this.externalDataService.checkInteractionIsPublishedByTrigger(
                    workspaceId,
                    campaignAction.action,
                );
                return {
                    ...campaignAction,
                    published,
                };
            }),
        );

        return result.filter(campaignAction => (campaignAction.published));
    }

    async createCampaignAction(data: CreateCampaignActionData) {
        const action = await this.campaignActionRepository.findOne({ action: data.action });

        if (action) {
            data = { ...data, id: action.id } as any;
        }
        return await this.campaignActionRepository.save({
            ...data,
            createdAt: new Date(),
        });
    }

    async updateCampaignAction(data: UpdateCampaignActionData) {
        const action = await this.campaignActionRepository.findOne({ id: data.id });

        if (!action) {
            throw Exceptions.NOT_FOUND;
        }

        const result = await this.campaignActionRepository.update(
            { id: action.id },
            {
                name: data.name,
            },
        );

        return result.affected > 0 ? { ok: true } : { ok: false };
    }

    async deleteCampaignAction(workspaceId: string, campaignActionId: number) {
        const action = await this.campaignActionRepository.findOne({ id: campaignActionId, workspaceId });

        if (!action) {
            throw Exceptions.NOT_FOUND;
        }

        const existTriggerOnInteraction = await this.externalDataService.existsInteractionByTrigger(
            workspaceId,
            action.action,
        );

        if (existTriggerOnInteraction) {
            throw Exceptions.ERROR_ACTION_USED_ON_INTERACTION;
        }

        return await this.campaignActionRepository.delete({ id: action.id });
    }
}
