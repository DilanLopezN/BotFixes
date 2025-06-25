import { Column, Entity, PrimaryColumn } from "typeorm";
@Entity()
export class Workspace {
    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @Column({name: 'invoice_description', nullable: true})
    invoiceDescription?: string;

    @Column({name: 'payment_description', nullable: true })
    paymentDescription?: string;

    @Column({name: 'account_id', nullable: true})
    accountId: number;

    @Column({name: 'due_date', nullable: true})
    dueDate: number;

    @Column({name: 'start_at', type: 'bigint', nullable: true})
    startAt?: number;

    @Column({nullable: true})
    plan?: string;

    @Column({name: 'plan_price', nullable: true, type: 'decimal'})
    planPrice?: number;

    @Column({name: 'plan_message_limit', nullable: true, type: 'decimal'})
    planMessageLimit?: number;

    @Column({name: 'plan_hsm_message_limit', nullable: true, type: 'decimal'})
    planHsmMessageLimit?: number;
    
    @Column({name: 'plan_user_limit', nullable: true, type: 'decimal'})
    planUserLimit?: number;

    @Column({name: 'plan_conversation_limit', nullable: true, type: 'decimal'})
    planConversationLimit?: number;

    @Column({name: 'plan_exceeded_message_price', nullable: true, type: 'decimal'})
    planExceededMessagePrice?: number;

    @Column({name: 'plan_hsm_exceed_message_price', nullable: true, type: 'decimal'})
    planHsmExceedMessagePrice?: number;

    @Column({name: 'plan_user_exceed_price', nullable: true, type: 'decimal'})
    planUserExceedPrice?: number;

    @Column({name: 'plan_conversation_exceed_price', nullable: true, type: 'decimal'})
    planConversationExceedPrice?: number;

    @Column({type: 'bool', name: 'active', nullable: false, default: true})
    active?: boolean;

    @Column({type: 'bool', name: 'has_integration', nullable: false, default: true})
    hasIntegration?: boolean;

    @Column({name: 'segment', nullable: true })
    segment?: string;

    @Column({name: 'observations', nullable: true })
    observations?: string;

    @Column({name: 'customer_x_id', nullable: true })
    customerXId?: string;

    @Column({name: 'customer_x_email', nullable: true })
    customerXEmail?: string;

    @Column({name: 'billing_type', nullable: true })
    billingType?: BillingType;
}

export enum BillingType {
    global = 'global',
    channel = 'channel',
}
