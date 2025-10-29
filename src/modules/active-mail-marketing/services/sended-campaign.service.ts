import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendedCampaign } from '../models/sended-campaign.entity';
import { ACTIVE_MAIL_MARKETING_CONNECTION } from '../ormconfig';

@Injectable()
export class SendedCampaignService {
    constructor(
        @InjectRepository(SendedCampaign, ACTIVE_MAIL_MARKETING_CONNECTION)
        private readonly sendedCampaignRepository: Repository<SendedCampaign>,
    ) {}

    async create(data: Partial<SendedCampaign>): Promise<SendedCampaign> {
        const sendedCampaign = this.sendedCampaignRepository.create(data);
        return await this.sendedCampaignRepository.save(sendedCampaign);
    }

    async findByShortId(shortId: string): Promise<SendedCampaign | null> {
        return await this.sendedCampaignRepository.findOne({
            where: { shortId },
        });
    }

    async findByShortIdOrFail(shortId: string): Promise<SendedCampaign> {
        const sendedCampaign = await this.findByShortId(shortId);
        if (!sendedCampaign) {
            throw new NotFoundException('Sended campaign not found');
        }
        return sendedCampaign;
    }

    async updateByShortId(shortId: string, data: Partial<SendedCampaign>): Promise<void> {
        const sendedCampaign = await this.findByShortIdOrFail(shortId);
        await this.sendedCampaignRepository.update(sendedCampaign.id, data);
    }

    async updateById(id: string, data: Partial<SendedCampaign>): Promise<void> {
        await this.sendedCampaignRepository.update(id, data);
    }

    async incrementClickCount(shortId: string): Promise<SendedCampaign> {
        const sendedCampaign = await this.findByShortIdOrFail(shortId);
        const now = new Date();

        const updateData: Partial<SendedCampaign> = {
            clickCount: sendedCampaign.clickCount + 1,
            lastClickAt: now,
        };

        if (sendedCampaign.clickCount === 0) {
            updateData.firstClickAt = now;
        }

        await this.updateById(sendedCampaign.id, updateData);

        return await this.findByShortIdOrFail(shortId);
    }

    async markAsExpiredAccess(shortId: string): Promise<void> {
        const sendedCampaign = await this.findByShortIdOrFail(shortId);
        await this.updateById(sendedCampaign.id, {
            expiredAccessAt: new Date(),
        });
    }

    async markEmailAsSent(id: string): Promise<void> {
        await this.updateById(id, {
            sendedEmailAt: new Date(),
            status: 'sent',
        });
    }

    async markAsError(id: string, error: string): Promise<void> {
        await this.updateById(id, {
            error,
            status: 'error',
        });
    }

    async updateConversationId(shortId: string, conversationId: string): Promise<void> {
        const sendedCampaign = await this.findByShortId(shortId);
        if (sendedCampaign) {
            await this.updateById(sendedCampaign.id, { conversationId });
        }
    }

    async findByCampaignConfigId(campaignConfigId: string): Promise<SendedCampaign[]> {
        return await this.sendedCampaignRepository.find({
            where: { campaignConfigId },
            order: { createdAt: 'DESC' },
        });
    }

    async findByWorkspaceId(workspaceId: string): Promise<SendedCampaign[]> {
        return await this.sendedCampaignRepository.find({
            where: { workspaceId },
            order: { createdAt: 'DESC' },
        });
    }

    async isExpired(sendedCampaign: SendedCampaign): Promise<boolean> {
        const now = new Date();
        return sendedCampaign.expiredAt && now > sendedCampaign.expiredAt;
    }
}
