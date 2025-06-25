import { Column, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ContactAutoAssign } from './contact-auto-assign.entity';

@Entity()
export class AutoAssignConversation {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name', nullable: false, length: 255 })
    name: string;

    @Column({ name: 'workspace_id', nullable: false })
    @Index()
    workspaceId: string;

    @Column({ name: 'team_id', nullable: false })
    teamId: string;

    @Column({ name: 'enable_rating', nullable: false, default: false })
    enableRating: boolean;

    @Column({ name: 'channel_config_ids', type: 'character varying', array: true, nullable: false })
    channelConfigIds: string[];

    @DeleteDateColumn({ name: 'deleted_at' })
    public deletedAt?: Date;

    contacts?: ContactAutoAssign[];
}
