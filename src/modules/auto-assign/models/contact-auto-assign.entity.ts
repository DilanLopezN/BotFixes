import { Column, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class ContactAutoAssign {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'name', nullable: false, length: 255 })
    name: string;

    @Column({ name: 'workspace_id', nullable: false })
    @Index()
    workspaceId: string;

    @Column({ name: 'phone', nullable: false, length: 15 })
    phone: string;

    @Column({ name: 'contact_id', type: 'character varying', nullable: true })
    contactId?: string;

    @Column({ name: 'auto_assign_conversation_ids', type: 'int', array: true, nullable: false })
    @Index()
    autoAssignConversationIds: number[];

    @DeleteDateColumn({ name: 'deleted_at' })
    public deletedAt?: Date;
}
