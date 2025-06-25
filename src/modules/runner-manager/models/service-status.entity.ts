import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ServiceStatus {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'integration_id' })
    integrationId: string;

    @Column({})
    env: string;

    @Column({ nullable: true })
    version?: string;

    @Column({ name: 'runner_id', nullable: true })
    runnerId?: string;

    @Column({type: 'boolean'})
    ok?: boolean;

    @CreateDateColumn({name: 'created_at'})
    createdAt: Date;
}
