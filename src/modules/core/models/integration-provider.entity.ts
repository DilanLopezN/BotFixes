import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class IntegrationProvider {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
