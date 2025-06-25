import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class FlowCategory {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'category' })
    category: string;
}
