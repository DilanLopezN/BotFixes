import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Service } from './service.entity';

export enum DeployStatus {
    success = 'success',
    error = 'error',
}

@Entity()
export class Deploy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_id', nullable: false })
    @Index()
    workspaceId: string;

    @CreateDateColumn({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;

    @Column({ name: 'tag', nullable: false })
    tag: string;

    @Column({ name: 'status', enum: [...Object.values(DeployStatus)], nullable: true })
    status?: DeployStatus;

    @ManyToOne(() => Service, (service) => service.deploys)
    @JoinColumn({ name: 'service_id' })
    service: Service;

    @Column({ name: 'runner_id', nullable: false })
    runnerId: number;
}
