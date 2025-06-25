import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@Index('phone_number_waid', ['phoneNumber', 'waid'])
export class MismatchWaid {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ name: 'phone_number' })
    phoneNumber?: string;

    @Column({ name: 'waid', nullable: true })
    waid?: string;
}