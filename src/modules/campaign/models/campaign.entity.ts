import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { CampaignResume } from "../interfaces/campaign-resume.interface";
import { CampaignAttribute } from "./campaign-attributes.entity";
import { Contact } from "./contact.entity";

export enum CampaignStatus {
    'draft' = 'draft',
    'awaiting_send' = 'awaiting_send',
    'running' = 'running',
    'paused' = 'paused',
    'finished_complete' = 'finished_complete',
}

export enum CampaignType {
    // Apenas informativo, apenas envia mensagem
    'simple' = 'simple',
    // Exige uma configuração de respostas possiveis e status de respostas
    'research' = 'research',
}

export const DEFAULT_CONTACT_LIST_LIMITS = {
    NORMAL_LIST_LIMIT: 200,
    TEST_LIST_LIMIT: 5,
};

@Entity()
export class Campaign {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'workspace_id', nullable: false})
    @Index()
    workspaceId: string;

    @Column({name: 'active_message_setting_id', nullable: true})
    activeMessageSettingId?: number;

    @Column({name: 'template_id', nullable: true})
    templateId?: string;

    @Column({name: 'name'})
    name: string;

    @Column({name: 'description', nullable: true})
    description?: string;

    @Column({type: 'enum', enum: CampaignStatus, default: CampaignStatus.draft})
    status: CampaignStatus;

    @Column({type: 'bigint', name: 'created_at'})
    createdAt: number;

    @Column({type: 'bigint', name: 'send_at', nullable: true})
    sendAt: number;

    @Column({type: 'bigint', name: 'started_at', nullable: true})
    startedAt: number;

    @Column({type: 'bigint', name: 'ended_at', nullable: true})
    endedAt: number;

    @Column({type: 'bigint', name: 'send_interval', nullable: true})
    sendInterval: number;

    @Column({type: 'int', name: 'processing_total', nullable: true})
    processingTotal?: number;

    @Column({type: 'int', name: 'processed_total', nullable: true})
    processedTotal?: number;

    @Column({type: 'bool', name: 'processed_finished', nullable: true})
    processingFinished?: boolean;

    @Column({name: 'campaign_type', type: 'enum', enum: CampaignType, default: CampaignType.simple, nullable: true})
    campaignType: CampaignType;

    @Column({type: 'int', name: 'cloned_from', nullable: true})
    clonedFrom?: number;

    @Column({name: 'action', nullable: true})
    action?: string;

    @Column({name: 'is_test', nullable: true, type: 'bool'})
    isTest?: boolean;

    @Column({name: 'is_forwarding', nullable: true, type: 'bool'})
    isForwarding?: boolean;

    @Column({name: 'immediate_start', nullable: true, type: 'bool'})
    immediateStart?: boolean;

    campaignAttributes?: CampaignAttribute[];
    contacts?: Contact[];

    resume?: CampaignResume;
}