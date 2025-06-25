import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RatingSetting {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'workspace_id' })
    @Index()
    workspaceId: string;

    @Column({ name: 'feedback_text', nullable: true, length: 150 })
    feedbackText: string;

    @Column({ name: 'rating_text', nullable: true, length: 150 })
    ratingText: string;

    @Column({ name: 'link_text', nullable: true, length: 150 })
    linkText: string;

    @Column({ name: 'disable_link_after_rating', type: 'bool', default: false, nullable: true })
    disableLinkAfterRating: boolean;

    @Column({ name: 'expires_in', type: 'bigint', nullable: true })
    expiresIn: number;

    @Column({ array: true, nullable: true, name: 'team_criteria', type: 'varchar' })
    teamCriteria?: string[];

    @Column({ array: true, nullable: true, name: 'tag_criteria', type: 'varchar' })
    tagCriteria?: string[];

    @Column({ array: true, nullable: true, name: 'channel_criteria', type: 'varchar' })
    channelCriteria?: string[];

    @Column({ name: 'message_after_rating', nullable: true, length: 250 })
    messageAfterRating?: string;

    @Column({ name: 'cta_button_text', nullable: true, length: 50 })
    ctaButtonText?: string;

    @Column({ name: 'cta_button_url', nullable: true })
    ctaButtonUrl?: string;

    // =================SCRIPT PARA ADD OS CAMPOS channel_criteria, tag_criteria, team_criteria
    // ALTER TABLE rating.rating_setting
    // ADD COLUMN channel_criteria VARCHAR ARRAY;
}
