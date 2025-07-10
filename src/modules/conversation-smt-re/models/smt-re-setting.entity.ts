import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('smt_re_settings')
@Index(['workspaceId'])
@Index(['createdAt'])
export class SmtReSetting {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workspace_id', type: 'varchar' })
    workspaceId: string;

    @Column({ name: 'automatic_reactivate', type: 'boolean', default: false })
    automaticReactivate: boolean;

    @Column({ name: 'initial_wait_time', type: 'int', comment: 'Tempo de espera inicial em minutos' })
    initialWaitTime: number;

    @Column({ name: 'initial_message', type: 'text' })
    initialMessage: string;

    @Column({
        name: 'automatic_wait_time',
        type: 'int',
        comment: 'Tempo de espera para mensagem automática em minutos',
    })
    automaticWaitTime: number;

    @Column({ name: 'automatic_message', type: 'text' })
    automaticMessage: string;

    @Column({ name: 'finalization_wait_time', type: 'int', comment: 'Tempo de espera para finalização em minutos' })
    finalizationWaitTime: number;

    @Column({ name: 'finalization_message', type: 'text' })
    finalizationMessage: string;

    @Column({ name: 'team_ids', type: 'text', array: true, nullable: true })
    teamIds: string[];

    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Column({ name: 'deleted_at', nullable: true })
    deletedAt: Date;

    @Column({ name: 'objective_id', type: 'numeric', nullable: true })
    objectiveId?: number;

    @Column({ name: 'outcome_id', type: 'numeric', nullable: true })
    outcomeId?: number;

    @Column({ name: 'active', type: 'boolean', default: true })
    active: boolean;
}
