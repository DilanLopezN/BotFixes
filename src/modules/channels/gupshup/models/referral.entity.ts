import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum SourceTypeEnum {
    ad = 'ad',
    post = 'post',
}

@Entity()
@Index('referral_workspace_id_conversation_id', ['workspaceId', 'conversationId'])
export class Referral {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'conversation_id' })
    conversationId: string;

    @Column({ name: 'workspace_id' })
    workspaceId: string;

    @Column({ name: 'source_id' })
    sourceId: string;

    @Column({ name: 'source_type', enum: [...Object.values(SourceTypeEnum)], default: SourceTypeEnum.ad })
    sourceType: SourceTypeEnum;

    @Column({ name: 'source_url' })
    sourceUrl: string;

    @Column({ name: 'headline', nullable: true })
    headline?: string;

    @Column({ name: 'body', nullable: true })
    body?: string;

    @Column({ name: 'image_id', nullable: true })
    imageId?: string;

    @Column({ name: 'video_id', nullable: true })
    videoId?: string;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp without time zone' })
    createdAt?: Date;
}
