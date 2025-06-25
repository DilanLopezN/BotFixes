import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class WppIdHash {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'conversation_id', nullable: true })
    conversationId?: string;

    @Column({ name: 'workspace_id', nullable: true })
    workspaceId?: string;

    @Column({ name: 'channel_config_token' })
    channelConfigToken: string;

    @Column({ name: 'hash' })
    @Index({ unique: true })
    hash: string;

    @Column({ name: 'wpp_id' })
    @Index({ unique: true })
    wppId: string;

    @Column({ type: 'bigint', name: 'created_at' })
    createdAt: number;
}
