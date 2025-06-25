import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Runner } from './runner.entity';
import { Deploy } from './deploy.entity';

export enum EnvTypes {
    production = 'production',
    development = 'development',
}

@Entity()
export class Service {
    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;

    @Column({ name: 'env', enum: [...Object.values(EnvTypes)], nullable: false })
    env: EnvTypes;

    @Column({ name: 'integration_id', nullable: false })
    @Index()
    integrationId: string;

    @Column({ name: 'workspace_id', nullable: false })
    @Index()
    workspaceId: string;

    @ManyToOne(() => Runner, (runner) => runner.services)
    @JoinColumn({ name: 'runner_id' })
    runner: Runner;

    @OneToMany(() => Deploy, (deploy) => deploy.service, {
        cascade: true,
    })
    deploys: Deploy[];
}
