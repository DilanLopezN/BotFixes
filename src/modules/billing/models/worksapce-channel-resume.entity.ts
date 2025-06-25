
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class WorkspaceChannelResume {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: 'workspace_id'})
    workspaceId: string;

    @Column({name: 'created_by_channel'})
    createdByChannel: string;

    @Column({name: 'conversations_sum'})
    conversationsSum: number;

    @Column({name: 'messages_sum'})
    messagesSum: number;

    @Column({name: 'month_reference', type: 'timestamp without time zone'})
    monthReference: Date;
    
    @Column({name: 'created_at', type: 'bigint'})
    createdAt: number;
    
}