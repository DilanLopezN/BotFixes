import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ schema: 'core', name: 'templates' })
export class Templates {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'template_id', type: 'varchar', nullable: true })
    templateId: string;

    @Column({ name: 'name', type: 'varchar', nullable: true })
    name: string;

    @Column({ name: 'category', type: 'varchar', nullable: true })
    category: string;

    @Column({ name: 'app_name', type: 'varchar', nullable: true })
    appName: string;

    @Column({ name: 'channel_config_id', type: 'varchar', nullable: true })
    channelConfigId: string;

    @Column({ name: 'workspace_id', type: 'varchar', nullable: true })
    workspaceId: string;

    @Column({ name: 'waba_template_id', type: 'varchar', nullable: true })
    wabaTemplateId: string;

    @Column({ name: 'element_name', type: 'varchar', nullable: true })
    elementName: string;

    @Column({ name: 'active', type: 'boolean', nullable: true })
    active: boolean;
}
