import { BeforeInsert, BeforeUpdate, Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('user_settings')
@Index(['workspaceId', 'userId', 'type'])
@Index(['workspaceId', 'userId', 'type', 'key'], { unique: true })
export class UserSettingsEntity {
    @PrimaryColumn()
    id: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'user_id', nullable: false })
    userId: string;

    @Column({ nullable: false })
    key: string;

    @Column({ type: 'text', nullable: false })
    value: string;

    @Column({ nullable: false })
    type: string;

    @Column({ nullable: true })
    label?: string;

    @Column({ type: 'timestamp without time zone', name: 'created_at', nullable: true })
    createdAt: Date;

    @Column({ type: 'timestamp without time zone', name: 'updated_at', nullable: true })
    updatedAt: Date;

    @BeforeInsert()
    setCreatedAt() {
        const now = new Date();
        const utcDate = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                now.getUTCHours(),
                now.getUTCMinutes(),
                now.getUTCSeconds(),
                now.getUTCMilliseconds(),
            ),
        );

        this.createdAt = utcDate;
        this.updatedAt = utcDate;
        if (!this.id) this.id = uuidv4();
    }

    @BeforeUpdate()
    setUpdatedAt() {
        const now = new Date();
        this.updatedAt = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                now.getUTCHours(),
                now.getUTCMinutes(),
                now.getUTCSeconds(),
                now.getUTCMilliseconds(),
            ),
        );
    }
}
