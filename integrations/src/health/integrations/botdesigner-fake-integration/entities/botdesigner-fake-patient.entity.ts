import { Column, Entity, Index, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { bigint } from '../../../../common/entity-helpers';

@Index(['integrationId', 'erpCode'])
@Unique(['cpf', 'integrationId'])
@Entity({
  name: 'botdesigner_fake_patient',
  schema: 'botdesigner_fake_integration',
})
export class BotdesignerFakePatient {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({ name: 'integration_id', length: 24 })
  integrationId: string;

  @Column({ name: 'erp_code' })
  erpCode: string;

  @Column({ name: 'name' })
  name: string;

  @Column({ name: 'cpf' })
  cpf: string;

  @Column({ name: 'phone', nullable: true })
  phone?: string;

  @Column({ name: 'email', nullable: true, length: 255 })
  email?: string;

  @Column({ name: 'born_date', type: 'date', nullable: true })
  bornDate?: string;

  @Column({ name: 'sex', length: 1, nullable: true })
  sex?: string;

  @Column({ name: 'mother_name', nullable: true })
  motherName?: string;

  @Column({ name: 'created_at', type: 'bigint', transformer: bigint })
  createdAt: number;

  @Column({ name: 'updated_at', type: 'bigint', transformer: bigint })
  updatedAt: number;
}
