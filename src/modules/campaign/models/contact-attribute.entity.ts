import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { Contact } from "./contact.entity";

@Entity()
@Index(
    'campaign_contact_attribute',
    ['name', 'contactId', 'campaignId'],
    { unique: true }
)
export class ContactAttribute {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', name: 'name'})
    name: string;

    @Column({type: 'varchar', name: 'value', nullable: true, length: '150'})
    value: string;

    @Column({name: 'contact_id', nullable: false})
    @Index()
    contactId: number;

    @Column({name: 'workspace_id', nullable: false})
    @Index()
    workspaceId: string;

    @Column({name: 'campaign_id', nullable: true})
    @Index({})
    campaignId: number;

    contact?: Contact;
}