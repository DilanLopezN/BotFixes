import { Column, Entity, PrimaryGeneratedColumn, Index } from 'typeorm';

@Index(['workspaceId'])
@Entity('training_entry_type')
export class TrainingEntryType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'name', nullable: false, length: 180 })
    name: string;

    @Column({ name: 'workspace_id', nullable: false, length: 24 })
    workspaceId: string;
}