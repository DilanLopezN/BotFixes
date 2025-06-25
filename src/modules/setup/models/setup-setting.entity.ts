import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class SetupSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_name', nullable: true })
    workspaceName: string;

    @Column({ name: 'workspace_created', default: false })
    workspaceCreated: boolean;

    @Column({ name: 'billing_specification_created', default: false})
    billingSpecificationCreated: boolean;

    @Column({ name: 'account_created', default: false})
    accountCreated: boolean;

    // @Column({ name: 'account_created', default: false})
    // accountCreated: boolean;
}
