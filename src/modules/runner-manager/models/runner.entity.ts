import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Service } from './service.entity';

@Entity()
export class Runner {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name', nullable: false, length: 200 })
    name: string;

    @Column({ name: 'workspace_id', nullable: false })
    @Index()
    workspaceId: string;

    @CreateDateColumn({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;

    @OneToMany(() => Service, (service) => service.runner, {
        cascade: true,
    })
    services: Service[];
}
