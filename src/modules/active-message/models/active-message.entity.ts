import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { ActiveMessageSetting } from "./active-message-setting.entity";
import { ActiveMessageStatus } from "./active-message-status.entity";

@Entity()
export class ActiveMessage {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'conversation_id', nullable: true})
    @Index()
    conversationId?: string;

    @Column({name: 'workspace_id'})
    workspaceId: string;

    @Column({name: 'channel_config_id'})
    channelConfigId: string;

    @Column({name: 'is_created_conversation', default: false})
    isCreatedConversation: boolean;
    
    @Column({type: 'bigint'})
    timestamp: number;

    @Column({name: 'active_message_setting_id'})
    activeMessageSettingId: number;

    // se existir no momento da criação da mensagem salva o id do contato
    // senão salva no evento KissbotEventType.CONTACT_CREATED
    @Column({name: 'contact_id', nullable: true})
    contactId?: string;

    // campo aberto pra integração enviar pra gente;
    @Column({name: 'external_id', nullable: true})
    externalId?: string;

    // Esses dados vão vir dos attributos
    @Column({name: 'member_name', nullable: true})
    memberName?: string;

    @Column({name: 'member_phone',  nullable: true})
    memberPhone?: string;

    @Column({name: 'member_email', nullable: true})
    memberEmail?: string;

    @Column({name: 'member_born_date', nullable: true})
    memberBornDate?: string;

    @Column({name: 'campaign_id', nullable: true})
    campaignId?: number;

    @Column({name: 'message_error', nullable: true})
    messageError?: string;

    @Column({name: 'received_at', type: 'bigint', nullable: true})
    receivedAt?: number;

    @Column({name: 'answered_at', type: 'bigint', nullable: true})
    answeredAt?: number;

    @Column({name: 'read_at', type: 'bigint', nullable: true})
    readAt?: number;

    @Column({name: 'status_changed_at', type: 'bigint', nullable: true})
    statusChangedAt?: number;

    @Column({name: 'status_id', nullable: true, type: 'numeric'})
    statusId?: number;

    status?: ActiveMessageStatus;
    setting?: ActiveMessageSetting;
}