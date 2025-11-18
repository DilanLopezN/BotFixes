import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['integrationId', 'createdAt'])
@Entity({ name: 'entities_embedding' })
export class EntitiesEmbedding {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'integration_id', length: 24, nullable: false })
  integrationId: string;

  // @ts-ignore TypeORM does not support but the database supports
  @Column({ name: 'embedding', type: 'vector', nullable: false })
  embedding: number[];

  @Column({ name: 'original_name', nullable: false })
  originalName: string;

  @Column({ name: 'entity_id', nullable: false })
  entityId: string;

  @Column({ name: 'total_tokens', nullable: false })
  totalTokens: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', nullable: false })
  createdAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;
}
