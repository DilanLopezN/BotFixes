import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { IAudioTts } from '../interfaces/audio-tts.interface';

@Index(['workspaceId', 'botId'])
@Entity({ name: 'audio_tts' })
export class AudioTts implements IAudioTts {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'name', nullable: false })
    name: string;

    @Column({ name: 'cost', type: 'decimal', precision: 10, scale: 6, nullable: false })
    cost: number;

    @Column({ name: 'model', nullable: false })
    model: string;

    @Column({ name: 'duration', type: 'int', nullable: false })
    duration: number;

    @Column({ name: 'processing_time_ms', type: 'int', nullable: false })
    processingTimeMs: number;

    @Column({ name: 'attachment_id', nullable: true })
    attachmentId?: string;

    @Column({ name: 's3_key', nullable: false })
    s3Key: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'bot_id', nullable: false })
    botId: string;

    @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;

    @Column({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt: Date;
}
