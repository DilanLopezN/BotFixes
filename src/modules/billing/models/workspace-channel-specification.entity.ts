import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum WorkspaceChannels {
    api = 'api',
    campaign = 'campaign',
    gupshup = 'whatsapp-gupshup',
    liveagent = 'live-agent',
    webchat = 'webchat',
}

@Entity()
export class WorkspaceChannelSpecification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_id' })
    workspaceId: string;

    @Column({ name: 'channel_id', enum: [...Object.values(WorkspaceChannels)] })
    channelId: WorkspaceChannels;

    @Column({ name: 'conversation_limit', type: 'decimal' })
    conversationLimit: number;

    @Column({ name: 'conversation_exceded_price', type: 'decimal' })
    conversationExcededPrice: number;

    @Column({ name: 'message_limit', type: 'decimal' })
    messageLimit: number;

    @Column({ name: 'message_exceded_price', type: 'decimal' })
    messageExcededPrice: number;
}
