import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { CampaignContact } from "./campaign-contact.entity";
import { ContactAttribute } from "./contact-attribute.entity";
import { ActiveMessage } from "../../active-message/models/active-message.entity";

@Entity()
@Index('whatsapp_workspace', ['whatsapp', 'workspaceId'], {
    unique: true,
})
export class Contact {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'varchar', name: 'name', nullable: true, length: '150'})
    name: string;

    @Column({type: 'varchar', name: 'whatsapp', nullable: true})
    whatsapp: string;

    @Column({type: 'varchar', name: 'phone', nullable: true})
    phone: string;

    @Column({type: 'boolean', name: 'is_valid', nullable: true})
    isValid: boolean;

    @Column({name: 'workspace_id', nullable: false})
    @Index()
    workspaceId: string;

    contactAttributes?: ContactAttribute[];
    campaignContact?: CampaignContact;
    activeMessage?: ActiveMessage;
    conversationId?: string;
    descriptionError?: string;
}