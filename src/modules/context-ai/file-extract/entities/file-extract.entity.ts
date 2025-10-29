import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ExtractionType, IFileExtract } from '../interfaces/file-extract.interface';

@Index(['workspaceId', 'extractionType'])
@Entity('file_extract')
export class FileExtract implements IFileExtract {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'workspace_id', nullable: false, length: 24 })
    workspaceId: string;

    @Column({ name: 'extraction_type', nullable: false, enum: ExtractionType })
    extractionType: ExtractionType;

    @Column({ name: 'filename', nullable: false })
    filename: string;

    @Column({ name: 'response_time_ms', nullable: false, type: 'numeric' })
    responseTimeMs: number;

    @Column({ name: 'extracted_content', nullable: false, type: 'jsonb' })
    extractedContent: Record<string, any>;

    @Column({ name: 'input_tokens', nullable: false, type: 'numeric' })
    inputTokens: number;

    @Column({ name: 'output_tokens', nullable: false, type: 'numeric' })
    outputTokens: number;

    @Column({ name: 'created_at', nullable: false, type: 'timestamp without time zone', default: () => 'CURRENT_TIMESTAMP' })
    createdAt: Date;
}