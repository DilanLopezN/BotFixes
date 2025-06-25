import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatchError } from '../../auth/exceptions';
import { UpdateCampaignAttributeDto } from '../dto/update-campaign-attribute.dto';
import { CreateCampaignAttributeData } from '../interfaces/create-campaign-attribute-data.interface';
import { CampaignAttribute } from '../models/campaign-attributes.entity';
import { CAMPAIGN_CONNECTION } from '../ormconfig';

export class CampaignAttributeService {
    constructor(
        @InjectRepository(CampaignAttribute, CAMPAIGN_CONNECTION)
        private campaignAttrRepository: Repository<CampaignAttribute>,
    ) {}

    @CatchError()
    async createAttribute(data: CreateCampaignAttributeData) {
        return await this.campaignAttrRepository.save({
            ...data,
        });
    }

    @CatchError()
    async updateCampaignAttribute(data: UpdateCampaignAttributeDto) {
        return await this.campaignAttrRepository.update(
            {
                id: data.id,
                campaignId: data.campaignId,
            },
            {
                ...data,
            },
        );
    }

    @CatchError()
    async deleteCampaignAttribute(campaignId: number, attributeId: number) {
        return await this.campaignAttrRepository.delete({
            id: attributeId,
            campaignId: campaignId,
        });
    }

    @CatchError()
    async deleteAllCampaignAttributeByCampaignId(campaignId: number) {
        return await this.campaignAttrRepository.delete({
            campaignId: campaignId,
        });
    }

    @CatchError()
    async getAttributesByCampaign(campaignId: number) {
        return await this.campaignAttrRepository.find({
            campaignId,
        });
    }
}
