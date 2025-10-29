import { ChannelIdConfig } from 'kissbot-core';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum TimeType {
    'days' = 'days',
    'hours' = 'hours',
    'minutes' = 'minutes',
}

export enum ObjectiveType {
    'api' = ChannelIdConfig.api,
    'campaign' = ChannelIdConfig.campaign,
    'confirmation' = ChannelIdConfig.confirmation,
    'reminder' = ChannelIdConfig.reminder,
    'nps' = ChannelIdConfig.nps,
    'nps_score' = ChannelIdConfig.nps_score,
    'medical_report' = ChannelIdConfig.medical_report,
    'api_ivr' = ChannelIdConfig.api_ivr,
    'schedule_notification' = ChannelIdConfig.schedule_notification,
    'recover_lost_schedule' = ChannelIdConfig.recover_lost_schedule,
    'documents_request' = ChannelIdConfig.documents_request,
    'active_mkt' = ChannelIdConfig.active_mkt,
}

@Entity()
export class ActiveMessageSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'setting_name', nullable: true })
    settingName: string;

    @Column({ name: 'channel_config_id', nullable: false })
    channelConfigToken: string;

    @Column({ name: 'api_token', nullable: false })
    apiToken: string;

    @Column({ name: 'enabled', default: true })
    enabled: boolean;

    @Column({ name: 'callback_url', nullable: true })
    callbackUrl?: string;

    @Column({ name: 'authorization_header', nullable: true })
    authorizationHeader?: string;

    @Column({ name: 'template_id', nullable: true })
    templateId?: string;

    @Column({ name: 'action', nullable: true })
    action?: string;

    @Column({ name: 'expiration_time_type', nullable: true, enum: [...Object.values(TimeType)] })
    expirationTimeType: TimeType;

    @Column({ name: 'expiration_time', nullable: true })
    expirationTime: number;

    @Column({ name: 'suspend_conversation_until_type', nullable: true, enum: [...Object.values(TimeType)] })
    suspendConversationUntilType: TimeType;

    @Column({ name: 'suspend_conversation_until_time', nullable: true })
    suspendConversationUntilTime: number;

    @Column({ name: 'send_message_to_open_conversation', nullable: true })
    sendMessageToOpenConversation: boolean;

    @Column({ type: 'character varying', array: true, nullable: true })
    tags?: string[];

    @Column({
        name: 'objective',
        nullable: true,
        default: ObjectiveType.api,
        enum: [...Object.values(ObjectiveType)],
        type: 'character varying',
    })
    objective?: ObjectiveType; // Campo sera usado para filtrar quando lista para os devidos objetivos

    @Column({ name: 'end_message', nullable: true })
    endMessage?: string; // Campo para mensagem que sera utilizada para finalização de atendimentos após tempo de expiração da conversa

    @Column({ name: 'data', type: 'jsonb', nullable: true })
    data: any;
}
