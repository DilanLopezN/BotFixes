import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { ExtractionStatus, IExtractions } from '../interfaces/extractions.interface';

@Index(['integrationId', 'status'])
@Entity()
export class Extractions implements IExtractions {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'integration_id', length: 24, nullable: false })
  integrationId: string;

  @Column({ name: 'workspace_id', length: 24, nullable: false })
  workspaceId: string;

  @Column({ name: 'created_at', type: 'bigint', nullable: false })
  createdAt: number;

  @Column({ name: 'extract_started_at', type: 'bigint', nullable: true })
  extractStartedAt: number;

  @Column({ name: 'extract_ended_at', type: 'bigint', nullable: true })
  extractEndedAt: number;

  @Column({ name: 'results_count', type: 'bigint', nullable: true })
  resultsCount: number;

  @Column({
    type: 'smallint',
    name: 'status',
    enum: [...Object.values(ExtractionStatus)],
    nullable: false,
    default: ExtractionStatus.pending,
  })
  status: ExtractionStatus;

  @Column({ name: 'data', type: 'json', nullable: true })
  data: any;
}
