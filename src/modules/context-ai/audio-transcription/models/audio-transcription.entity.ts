import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audio_transcription')
export class AudioTranscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workspace_id', nullable: false })
    workspaceId: string;

    @Column({ name: 'conversation_id', nullable: true })
    conversationId?: string;

    @Column({ name: 'external_id', nullable: true })
    externalId?: string;

    @Column({ name: 'text_transcription', nullable: false })
    textTranscription: string;

    @Column({ name: 'total_time_transcription', nullable: false, type: 'int' })
    totalTimeTranscription: number; // Tempo ficara salvo em segundos

    @Column({ name: 'url_file', nullable: true })
    urlFile?: string;

    @Column({ name: 'created_by', nullable: true })
    createdBy?: string;

    @Column({ name: 'created_from', nullable: true })
    createdFrom?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
