import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['integrationId', 'createdAt'])
@Entity({ name: 'entities_embedding_sync' })
export class EntitiesEmbeddingSync {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'integration_id', length: 24, nullable: false })
  integrationId: string;

  @Column({ name: 'synced_entities', type: 'varchar', array: true })
  syncedEntities: string[];

  @Column({ name: 'total_tokens', nullable: false })
  totalTokens: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt: Date;
}
