import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { SendActiveMessageData } from "../interfaces/send-active-message-data.interface";

@Entity()
export class SendActiveMessageIncomingData implements SendActiveMessageData {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'api_token'})
    apiToken: string;
    
    @Column({name: 'team_id', nullable: true})
    teamId?: string;

    @Column({name: 'phone_number', nullable: true})
    phoneNumber: string;

    @Column({name: 'action', nullable: true})
    action?: string;

    @Column({name: 'priority', nullable: true})
    priority?: number;

    @Column({name: 'text', nullable: true})
    text?: string;

    @Column({name: 'template_id', nullable: true})
    templateId?: string;

    @Column({name: 'external_id', nullable: true})
    externalId?: string;

    @Column({ type: 'jsonb', nullable: true })
    attributes?: any

    @Column({name: 'campaign_id', nullable: true})
    campaignId?: number;

    @Column({name: 'confirmation_id', nullable: true})
    confirmationId?: number;

    @Column({name: 'active_message_setting_id', nullable: true})
    activeMessageSettingId?: number;

    @Column({name: 'created_at', type: 'bigint'})
    createdAt: number;

    @Column({name: 'retry_at', type: 'bigint', nullable: true})
    retryAt: number;

}