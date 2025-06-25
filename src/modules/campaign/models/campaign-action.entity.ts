import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class CampaignAction {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    action: string;

    @Column()
    name: string;

    @Column({name: 'workspace_id', nullable: false})
    @Index()
    workspaceId: string;

    @Column({ name: 'created_at', nullable: false, type: 'timestamp without time zone' })
    createdAt: Date;

    published?: boolean;
}
