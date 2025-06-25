import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { SmtReSetting } from './smt-re-setting.entity';

@Entity('smt_re')
@Index(['conversationId'])
@Index(['workspaceId'])
@Index(['smtReSettingId'])
@Index(['finalizationMessageSent', 'stopped'])
@Index(['initialMessageSent', 'stopped'])
@Index(['automaticMessageSent', 'stopped'])
@Index(['createdAt'])
export class SmtRe {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'conversation_id', type: 'varchar' })
    conversationId: string;

    @Column({ name: 'workspace_id', type: 'varchar' })
    workspaceId: string;

    @Column({ name: 'smt_re_setting_id', type: 'varchar' })
    smtReSettingId: string;

    @ManyToOne(() => SmtReSetting)
    @JoinColumn({ name: 'smt_re_setting_id' })
    smtReSetting: SmtReSetting;

    @Column({ name: 'initial_message_sent', type: 'boolean', default: false })
    initialMessageSent: boolean;

    @Column({ name: 'initial_message_sent_at', type: 'timestamp', nullable: true })
    initialMessageSentAt: Date;

    @Column({ name: 'automatic_message_sent', type: 'boolean', default: false })
    automaticMessageSent: boolean;

    @Column({ name: 'automatic_message_sent_at', type: 'timestamp', nullable: true })
    automaticMessageSentAt: Date;

    @Column({ name: 'finalization_message_sent', type: 'boolean', default: false })
    finalizationMessageSent: boolean;

    @Column({ name: 'finalization_message_sent_at', type: 'timestamp', nullable: true })
    finalizationMessageSentAt: Date;

    @Column({ name: 'stopped', type: 'boolean', default: false })
    stopped: boolean;

    @Column({ name: 'stopped_at', type: 'timestamp', nullable: true })
    stoppedAt: Date;

    @Column({ name: 'stopped_by_member_id', type: 'varchar', nullable: true })
    stoppedByMemberId: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
