import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CustomerErp {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
