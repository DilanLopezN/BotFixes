import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { bigint } from '../../common/entity-helpers';

@Index(['phone', 'integrationId'])
@Entity()
export class PatientAcceptance {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ name: 'integration_id', length: 24 })
  integrationId: string;

  @Column({ name: 'phone' })
  phone: string;

  @Column({ name: 'accepted_at', type: 'bigint', nullable: true, transformer: bigint })
  acceptedAt?: number;

  @Column({ name: 'recused_at', type: 'bigint', nullable: true, transformer: bigint })
  recusedAt?: number;

  @Column({ name: 'revoked_at', type: 'bigint', nullable: true, transformer: bigint })
  revokedAt?: number;

  @Column({ name: 'expiration', type: 'bigint', nullable: true, transformer: bigint })
  expiration?: number;
}
