import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Segment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
