import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ schema: 'core', name: 'teams' })
export class Teams {
    @PrimaryColumn({ type: 'varchar', length: 40 })
    id: string;

    @Column({ name: 'name', type: 'varchar', length: 200 })
    name: string;

    @Column({ name: 'workspace_id', type: 'varchar', length: 40 })
    workspaceId: string;
}
