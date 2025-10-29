import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'core', name: 'users' })
export class Users {
    @PrimaryColumn({ type: 'varchar' })
    id: string;

    @Column({ name: 'name', type: 'varchar', nullable: true })
    name: string;

    @Column({ name: 'email', type: 'varchar', nullable: true })
    email: string;
}
