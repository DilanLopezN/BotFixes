import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ActiveMessageStatus } from "./active-message-status.entity";

@Entity()
export class Answer {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', name: 'terms'})
    terms: string;

    @Column({ name: 'status_id'})
    statusId: number;

    @Column({ name: 'campaign_id'})
    campaignId: number;

    status?: ActiveMessageStatus;
}