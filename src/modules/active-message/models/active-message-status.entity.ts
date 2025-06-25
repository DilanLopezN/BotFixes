import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ActiveMessageStatus {
    @PrimaryGeneratedColumn()
    id: number;

    // Workspace é opcional, pois o cliente pode usar apenas status globais
    @Column({name: 'workspace_id', nullable: true})
    @Index()
    workspaceId?: string;

    // Global é um status global que serve pra qualquer cliente
    @Column({name: 'global', nullable: false, default: 0})
    global?: number;

    @Column({name: 'status_name'})
    statusName: string;

    @Column({name: 'status_code'})
    statusCode: number;
}