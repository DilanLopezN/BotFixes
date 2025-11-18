import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { bigint } from '../../common/entity-helpers';

@Index(['phone', 'integrationId', 'erpCode'])
@Unique(['cpf', 'erpCode', 'phone', 'integrationId'])
@Entity({ name: 'patient' })
export class PatientData {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ name: 'integration_id', length: 24 })
  integrationId: string;

  @Column({ name: 'workspace_id', length: 24, nullable: true })
  workspaceId: string;

  @Column({ name: 'erp_code' })
  erpCode: string;

  @Column({ name: 'erp_legacy_code', nullable: true })
  erpLegacyCode?: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'phone' })
  phone: string;

  @Column({ name: 'cpf' })
  cpf: string;

  @Column({ name: 'email', nullable: true, length: 255 })
  email: string;

  @Column({ name: 'born_date', type: 'bigint', transformer: bigint })
  bornDate: number;

  @Column({ name: 'created_at', type: 'bigint', transformer: bigint })
  createdAt: number;
}
