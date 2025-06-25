import { Column, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class PrivacyPolicy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'text', nullable: false, length: 1000 })
    text: string;

    @Column({ name: 'workspace_id', nullable: false })
    @Index()
    workspaceId: string;

    @Column({ name: 'channel_config_ids', type: 'character varying', array: true, nullable: false })
    channelConfigIds: string[];

    @Column({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;

    @Column({ name: 'update_acceptance_at', nullable: true, type: 'timestamp without time zone' })
    updateAcceptanceAt?: Date;

    @Column({ name: 'created_by', nullable: false })
    createdBy: string;

    @Column({ name: 'accept_button_text', nullable: true })
    acceptButtonText?: string;

    @Column({ name: 'reject_button_text', nullable: true })
    rejectButtonText?: string;

    @DeleteDateColumn({ name: 'deleted_at' })
    public deletedAt?: Date;
}
