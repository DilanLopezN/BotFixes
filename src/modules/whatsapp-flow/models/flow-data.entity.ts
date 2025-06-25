import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Flow } from './flow.entity';

@Entity()
@Index('idx_flow_data_workspace_flow_id', ['workspaceId', 'flowId'])
export class FlowData {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_id' })
    workspaceId: string;

    @Column({ name: 'name' })
    name: string;

    @Column({ name: 'flow_id', type: 'numeric' })
    flowId: number;

    @Column({ name: 'flow_screen' })
    flowScreen: string;

    @Column({ name: 'data', type: 'jsonb', nullable: true })
    data?: Record<string, any>;

    flow?: Flow;
}
