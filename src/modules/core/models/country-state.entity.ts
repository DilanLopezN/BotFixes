import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CountryState {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    uf: string;
}
