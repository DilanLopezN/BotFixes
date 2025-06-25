import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Account } from "./account.entity";
import { PaymentItem } from "./payment-item.entity";
import * as  moment from 'moment';
import { Workspace } from "./workspace.entity";

export enum PaymentStatus {
    opened = 'opened',
    awaitingPayment = 'awaitingPayment',
    paid = 'paid',
    unpaid = 'unpaid',
    deleted = 'deleted',
    overDue = 'overDue',
    receivedInCash = 'RECEIVED_IN_CASH',
}
@Entity()
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    /**
     * Data do ultimo fechamento
    */
    @Column({name: 'billing_start_date', type: 'bigint'})
    billingStartDate: number;
    
    /**
     * Data do setada no momento do fechamento do payment
     */
    @Column({name: 'billing_end_date', nullable: true, type: 'bigint'})
    billingEndDate: number;

    /* Mês competência */
    @Column({name: 'billing_month', nullable: false})
    billingMonth: string;

    /* data de vencimento */
    @Column({name: 'due_date', nullable: true, type: "bigint"})
    dueDate?: number;

    @Column({name: 'account_id'})
    accountId: number;

    /** Campo total_value populado quando é gerado o boleto */
    @Column({name: 'total_value', nullable: true, type: "numeric"})
    totalValue?: number;

    @Column({name: 'workspace_id'})
    workspaceId: string;

    @Column({name: 'status', enum: [...Object.values(PaymentStatus)], default: PaymentStatus.opened})
    status: PaymentStatus;


    @OneToMany(() => PaymentItem, item => item.payment, {
        cascade: true
    })
    items: PaymentItem[];

    // ============COLUNAS EXTERNAS DO GATEWAY
    
    /** Campo que representa o id da cobrança dentro do gateway - populado quando é gerado a cobrança no gateway */
    @Column({name: 'gateway_payment_id', nullable: true})
    gatewayPaymentId?: string;

    /** Valor original da cobrança (preenchido quando paga com juros e multa) - populado quando é sincronizado com o gateway */
    @Column({name: 'gateway_original_value', nullable: true, type: "numeric"})
    gatewayOriginalValue?: number;

    /** Valor líquido da cobrança após desconto da tarifa do Asaas - populado quando é sincronizado com o gateway */
    @Column({name: 'gateway_net_value', nullable: true, type: "numeric"})
    gatewayNetValue?: number;

    /** Campo do dia do pagamento no gatway - populado quando é sincronizado com o gateway */
    @Column({name: 'gateway_payment_date', nullable: true, type: "numeric"})
    gatewayPaymentDate?: number;

    /* Data de vencimento da cobrança - populado quando é sincronizado com o gateway  */
    @Column({name: 'gateway_due_date', nullable: true, type: "numeric"})
    gatewayDueDate?: number;
    
    @Column({name: 'gateway_invoice_id', nullable: true})
    gatewayInvioceId?: string;

    account?: Account;
    
    workspace?: Workspace;
}