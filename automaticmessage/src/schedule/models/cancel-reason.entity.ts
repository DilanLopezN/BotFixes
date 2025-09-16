import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class CancelReason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'reason_name', nullable: false })
  reasonName: string;

  @Column({ name: 'workspace_id', nullable: false })
  @Index()
  workspaceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
