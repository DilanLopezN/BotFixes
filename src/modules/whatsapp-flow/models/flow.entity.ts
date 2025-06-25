import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
@Index('idx_flow_workspace_channel_flow', ['workspaceId', 'channelConfigId', 'flowId'])
export class Flow {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_id' })
    workspaceId: string;

    @Column({ name: 'channel_config_id' })
    channelConfigId: string;

    @Column({ name: 'active', nullable: false, default: true })
    active: boolean;

    @Column({ name: 'flow_id' })
    flowId: string;

    @Column({ name: 'flow_name' })
    flowName: string;

    @Column({ name: 'status' })
    status: string;

    @Column({ name: 'flow_library_id', type: 'numeric' })
    flowLibraryId: number;

    @Column({ name: 'flow_fields', type: 'jsonb', nullable: true })
    flowFields?: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
