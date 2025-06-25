import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CustomerStep {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
