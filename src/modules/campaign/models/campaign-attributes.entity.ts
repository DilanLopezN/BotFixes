import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { Campaign } from "./campaign.entity";

@Entity()
export class CampaignAttribute {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'campaign_id', nullable: false})
    @Index()
    campaignId: number;

    @Column({type: 'varchar', name: 'label'})
    label: string;

    @Column({type: 'varchar', name: 'name'})
    name: string;

    @Column({type: 'varchar', name: 'template_id', nullable: true})
    templateId?: string;

    campaign?: Campaign;
}