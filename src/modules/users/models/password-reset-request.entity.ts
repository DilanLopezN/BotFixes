import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity()
export class PasswordResetRequest {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id' })
    @Index()
    userId: string;

    @Column()
    @Index()
    token: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    @Column({ name: 'reseted_at', type: 'timestamp', nullable: true })
    resetedAt: Date;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;
}
