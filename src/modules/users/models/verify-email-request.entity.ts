import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity()
export class VerifyEmailRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    @Index()
    userId: string;

    @Column()
    @Index()
    token: string;

    @Column({ nullable: true })
    email: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
    verifiedAt: Date;

    @Column({ name: 'reseted_at', type: 'timestamp', nullable: true })
    resetedAt: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}
