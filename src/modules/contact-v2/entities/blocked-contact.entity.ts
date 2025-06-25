import {
    Entity,
    Column,
    PrimaryColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    BeforeInsert,
    AfterLoad,
    AfterInsert,
    AfterUpdate,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { castObjectId } from '../../../common/utils/utils';

@Entity('blocked_contact')
export class BlockedContactEntity {
    @PrimaryColumn()
    id: string;

    _id: string;

    @Column({ name: 'workspace_id' })
    @Index()
    workspaceId: string;

    @Column({ name: 'contact_id' })
    @Index()
    contactId: string;

    @Column()
    phone: string;

    @Column()
    @Index()
    whatsapp: string;

    @Column({ name: 'blocked_by' })
    blockedBy: string;

    @Column({ type: 'bigint', name: 'blocked_at' })
    blockedAt: number;

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt: Date;

    @BeforeInsert()
    generateId() {
        if (!this.id) this.id = uuidv4();
    }

    @AfterLoad()
    @AfterInsert()
    @AfterUpdate()
    setObjectId() {
        this._id = castObjectId(this.id);
    }
}

@Index(['workspace_id', 'contact_id'], { unique: true })
@Index(['workspace_id', 'phone'])
@Index(['workspace_id', 'whatsapp'])
export class BlockedContactEntityWithIndex extends BlockedContactEntity {}
