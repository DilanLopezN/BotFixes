import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Payment } from './payment.entity';

export enum PaymentItemTypes {
    plan = 'plan',
    exceeded_message = 'exceeded_message',
    hsm_message = 'hsm_message',
    discount = 'discount',
    reminder_discount = 'reminder_discount',
    campaign_discount = 'campaign_discount',
    api_discount = 'api_discount',
    confirmation_discount = 'confirmation_discount',
    nps_discount = 'nps_discount',
    medical_report_discount = 'medical_report_discount',
    documents_request_discount = 'documents_request_discount',
    active_mkt_discount = 'active_mkt_discount',
    api_ivr_discount = 'api_ivr_discount',
    schedule_notification_discount = 'schedule_notification_discount',
    recover_lost_schedule_discount = 'recover_lost_schedule_discount',
    setup = 'setup',
    session = 'session',
    conversation = 'conversation',
    conversation_api = 'conversation_api',
    conversation_campaign = 'conversation_campaign',
    conversation_gupshup = 'conversation_gupshup',
    conversation_liveagent = 'conversation_liveagent',
    conversation_webchat = 'conversation_webchat',
    user = 'user',
    extra = 'extra',
}

@Entity()
export class PaymentItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'item_description' })
    itemDescription: string;

    @Column()
    quantity: number;

    @Column({ name: 'unit_price', type: 'decimal' })
    unitPrice: number;

    @Column({ name: 'total_price', type: 'decimal' })
    totalPrice: number;

    @Column({ enum: [...Object.values(PaymentItemTypes)] })
    type: PaymentItemTypes;

    @ManyToOne(() => Payment, (payment) => payment.items)
    @JoinColumn({ name: 'payment_id' })
    payment: Payment;

    // Para ser usado quando não é necessário a entidade inteira
    paymentId: number;
}
