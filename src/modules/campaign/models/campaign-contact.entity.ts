import { Column, Entity, Generated, Index, PrimaryGeneratedColumn } from "typeorm";
import { Campaign } from "./campaign.entity";
import { Contact } from "./contact.entity";

@Entity()
export class CampaignContact {
    @PrimaryGeneratedColumn('uuid')
    id: number;

    @Column()
    hash?: string;

    @Column({ type: 'boolean', default: null })
    invalid?: boolean;

    @Column({ name: 'contact_id' })
    contactId: number;

    @Column({ name: 'campaign_id' })
    campaignId: number;

    @Column({ name: 'active_message_id', nullable: true })
    activeMessageId?: number;

    @Column({ name: 'send_at', type: 'bigint', nullable: true })
    sendAt?: number;

    @Column({ name: 'received_at', type: 'bigint', nullable: true })
    receivedAt?: number;

    contact?: Contact;
    campaign?: Campaign;
}