import { v4 as uuidv4 } from 'uuid';
import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    BeforeInsert,
    BeforeUpdate,
    AfterLoad,
    AfterInsert,
    AfterUpdate,
} from 'typeorm';
import { castObjectId } from '../../../common/utils/utils';

@Entity('contact')
export class ContactEntity {
    @PrimaryColumn()
    id: string;

    _id: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true, default: '55' })
    ddi: string;

    @Column({ nullable: true })
    @Index()
    telegram: string;

    @Column({ nullable: true })
    @Index()
    email: string;

    @Column({ nullable: true })
    name: string;

    @Column({ nullable: true, type: 'text', array: true, default: [] })
    conversations: string[];

    @Column({ nullable: true, name: 'webchat_id' })
    webchatId: string;

    @Column({ name: 'created_by_channel' })
    createdByChannel: string;

    @Column({ name: 'workspace_id' })
    @Index()
    workspaceId: string;

    @Column({ nullable: true })
    whatsapp: string;

    @Column({ nullable: true, name: 'blocked_by' })
    blockedBy: string;

    @Column({ nullable: true, type: 'bigint', name: 'blocked_at' })
    blockedAt: number;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;

    @BeforeInsert()
    generateId() {
        if (!this.id) this.id = uuidv4();
    }

    @BeforeInsert()
    @BeforeUpdate()
    cleanNameField() {
        if (this.name && typeof this.name == 'string') {
            this.name = ((this.name || '') as string).replace(/\0/g, '');

            let jsonString = JSON.stringify(this.name);
            jsonString = jsonString.replace(/\0/g, '');
            this.name = JSON.parse(jsonString);

            if (this.name.length > 255) {
                this.name = this.name.slice(0, 255);
            }
        }
    }

    @BeforeInsert()
    @BeforeUpdate()
    cleanEmailField() {
        if (this.email && typeof this.email == 'string' && this.email.length > 255) {
            this.email = this.email.slice(0, 255);
        }
    }

    @BeforeInsert()
    @BeforeUpdate()
    setDefaultDdi() {
        if (!this.ddi || this.ddi === 'null') this.ddi = '55';
    }

    @AfterLoad()
    @AfterInsert()
    @AfterUpdate()
    setObjectId() {
        this._id = castObjectId(this.id);
    }
}

@Index(['workspace_id', 'whatsapp'], { where: 'whatsapp IS NOT NULL' })
@Index(['workspace_id', 'phone'], { where: 'phone IS NOT NULL' })
@Index(['workspace_id', 'email'], { where: 'email IS NOT NULL' })
export class ContactEntityWithIndex extends ContactEntity {}
