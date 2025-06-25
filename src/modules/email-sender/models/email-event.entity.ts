import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum EmailEventStatus {
    // Delivery events in order
    'processed' = 'processed', // Message has been received and is ready to be delivered.
    'dropped' = 'dropped', // You may see the following drop reasons: Invalid SMTPAPI header, Spam Content (if Spam Checker app is enabled), Unsubscribed Address, Bounced Address, Spam Reporting Address, Invalid, Recipient List over Package Quota
    'delivered' = 'delivered', // Message has been successfully delivered to the receiving server
    'deferred' = 'deferred', // Receiving server temporarily rejected the message.
    'bounce' = 'bounce', // Receiving server could not or would not accept mail to this recipient permanently. If a recipient has previously unsubscribed from your emails, the message is dropped
    // Engagement events
    'open' = 'open',
    'click' = 'click',
}

@Entity()
export class EmailEvent {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'email_id', nullable: false })
    @Index()
    emailId: number;

    @Column({ type: 'enum', enum: EmailEventStatus, nullable: false })
    status: EmailEventStatus;

    @Column({ type: 'timestamp with time zone', name: 'created_at', nullable: false })
    createdAt: Date;
}
