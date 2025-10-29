import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class WhatsappBillingEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'conversation_id', nullable: true })
  conversationId?: string;

  @Column({ name: 'workspace_id', nullable: true })
  workspaceId?: string;

  @Column({ name: 'channel_config_token' })
  channelConfigToken: string;

  @Column({ name: 'message_id' })
  @Index()
  messageId: string;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @Column({ name: 'conversation_whatsapp_id', nullable: true })
  conversationWhatsappId?: string;

  @Column({ name: 'conversation_expiration_timestamp', nullable: true })
  conversationExpirationTimestamp?: string;

  @Column({ name: 'conversation_origin_type', nullable: true })
  conversationOriginType?: string;

  @Column({ name: 'billable' })
  billable: boolean;

  @Column({ name: 'pricing_model' })
  pricingModel: string;

  @Column({ name: 'category' })
  category: string;

  @Column({ name: 'pricing_type', nullable: true })
  pricingType?: string;

  @Column({ type: 'bigint', name: 'timestamp' })
  timestamp: number;

  @Column({ type: 'bigint', name: 'created_at' })
  createdAt: number;
}
