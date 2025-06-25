import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Functionality {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
