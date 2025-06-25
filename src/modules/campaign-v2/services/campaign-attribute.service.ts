import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CatchError } from '../../auth/exceptions';
import { CAMPAIGN_CONNECTION } from '../ormconfig';
import { CampaignAttribute } from '../../campaign/models/campaign-attributes.entity';
import { CreateCampaignAttributeParams } from '../interfaces/create-campaign-attribute.interface';

export class CampaignAttributeService {
    constructor(
        @InjectRepository(CampaignAttribute, CAMPAIGN_CONNECTION)
        private campaignAttrRepository: Repository<CampaignAttribute>,
    ) {}

    @CatchError()
    async createAttribute(data: CreateCampaignAttributeParams, transactionalEntityManager?: EntityManager) {
        if (!transactionalEntityManager) return this.campaignAttrRepository.save(data);
        const attribute = this.campaignAttrRepository.create(data);
        return await transactionalEntityManager.save(attribute);
    }

    @CatchError()
    async getAttributesByCampaign(campaignId: number) {
        return await this.campaignAttrRepository.find({
            campaignId,
        });
    }

    @CatchError()
    async deleteCampaignAttributes(campaignId: number, transactionalEntityManager?: EntityManager): Promise<void> {
        const queryBuilder = transactionalEntityManager
            ? transactionalEntityManager.createQueryBuilder().delete().from(CampaignAttribute)
            : this.campaignAttrRepository.createQueryBuilder().delete();

        await queryBuilder.where('campaign_id = :campaignId', { campaignId }).execute();
    }
}
