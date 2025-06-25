import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

export enum EmployeeType {
    ux = 'ux',
    cs = 'cs',
}

@Entity()
export class InternalEmployee {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    // @Column({ array: true, nullable: true })
    // type: string; // EmployeeType
}
