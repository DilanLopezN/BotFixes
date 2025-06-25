import { IsString } from 'class-validator';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class EmailTemplateData {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'email_id', nullable: false })
    @Index()
    emailId: number;

    @Column({ name: 'field', nullable: false })
    field: string;

    @Column({ name: 'value', nullable: false })
    value: string;

    @Column({ type: 'timestamp with time zone', name: 'created_at', nullable: false })
    createdAt: Date;
}
