import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { CatchError, CustomBadRequestException, Exceptions } from '../../auth/exceptions';
import { Connection, Repository } from 'typeorm';
import { PaymentItem, PaymentItemTypes } from '../models/payment-item.entity';
import { Payment, PaymentStatus } from '../models/payment.entity';
import { PaymentGetDataService } from './payment-get-data.service';
import { AsaasService } from './asaas.service';
import { Account } from '../models/account.entity';
import { BillingType, Workspace } from '../models/workspace.entity';
import { WorkspaceService } from './workspace.service';
import { BILLING_CONNECTION } from '../ormconfig';
import { UsersService } from '../../users/services/users.service';
import { WorkspaceChannelSpecificationService } from './workspace-channel-specification.service';
import { WorkspaceChannelResumeService } from './workspace-channel-resume.service';
import { ConvertChannelName } from '../../../common/utils/utils';
import { WorkspaceChannels } from '../models/workspace-channel-specification.entity';
import { EventsService } from '../../events/events.service';
import { IBillingCreatedPaymentEvent, KissbotEventDataType, KissbotEventSource, KissbotEventType } from 'kissbot-core';
import { PaymentSpecificationService } from './payment-item-specification.service';
import * as Sentry from '@sentry/node';

export interface CreatePayment {
    workspaceId: string;
    accountId: number;
    billingMonth?: string;
}

export interface ClosePayment extends CreatePayment {
    paymentId: number;
}

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    constructor(
        @InjectRepository(Payment, BILLING_CONNECTION)
        private paymentRepository: Repository<Payment>,
        @InjectConnection(BILLING_CONNECTION)
        private connection: Connection,
        private paymentGetDataService: PaymentGetDataService,
        private readonly workspaceService: WorkspaceService,
        private readonly asaasService: AsaasService,
        private readonly usersService: UsersService,
        private readonly workspaceChannelSpecificationService: WorkspaceChannelSpecificationService,
        private readonly workspaceChannelResumeService: WorkspaceChannelResumeService,
        public readonly eventsService: EventsService,
        private readonly paymentSpecificationService: PaymentSpecificationService,
    ) {}

    @CatchError()
    async getWorkspacesWithLastPayment(query: { active: boolean }) {
        const result = await this.paymentRepository.query(`
            SELECT
                w.w_id as id,
                ws.account_id as "accountId",
                ws.name,
                ws.active,
                pay.status,
                pay.billing_end_date as "billingEndDate",
                pay.billing_start_date as "billingStartDate",
                due_pay.id as "overDueId",
                pay.gateway_payment_id as "gatewayPaymentId",
                pay.gateway_invoice_id as "gatewayInvoiceId",
                pay.id as "paymentId",
                ws.plan_user_limit as "planUserLimit",
                ws.plan_price as "planPrice",
                ws.plan_message_limit as "planMessageLimit",
                ws.plan_hsm_message_limit as "planHsmMessageLimit",
                ws.plan_exceeded_message_price as "planExceededMessagePrice",
                ws.plan_hsm_exceed_message_price as "planHsmExceedMessagePrice",
                ws.plan_conversation_exceed_price as "planConversationExceedPrice",
                ws.plan_user_exceed_price as "planUserExceedPrice",
                ws.plan_conversation_limit as "planConversationLimit"
            FROM
            (
                SELECT
                    w.id AS w_id,
                    MAX(pay.id) AS pay_id
                FROM
                    billing.workspace w
                LEFT JOIN
                    billing.payment AS pay ON pay.workspace_id = w.id
                GROUP BY w_id
            ) w
                INNER JOIN billing.workspace AS ws ON ws.id = w.w_id AND ws.active = ${query.active}
                LEFT JOIN billing.payment AS pay ON pay.id = w.pay_id
                LEFT JOIN billing.payment AS due_pay ON due_pay.workspace_id = w.w_id AND due_pay.status = 'OverDue'
            ;
        `);
        // for(const customWorkspace of result) {
        //     try {
        //         if (customWorkspace.billingStartDate && customWorkspace.billingEndDate) {
        //             const items = await this.getVirtualItems(
        //                 customWorkspace,
        //                 moment(parseFloat(String(customWorkspace.billingStartDate) || '0')),
        //                 moment(parseFloat(String(customWorkspace.billingEndDate) || '0')),
        //             );
        //             customWorkspace.value = items.reduce((accumulator, curr) => {
        //                 return accumulator + curr.totalPrice;
        //             }, 0);
        //         }
        //     } catch (e) {
        //         this.logger.error(e);
        //     }
        // }

        return result;
    }

    @CatchError()
    async getPayments(workspaceId: string, limit: string, skip: string) {
        let query = this.paymentRepository
            .createQueryBuilder('payment')
            .innerJoinAndMapOne('payment.workspace', Workspace, 'wspc', `wspc.id = payment.workspace_id`)
            .leftJoinAndMapMany('payment.items', PaymentItem, 'item', `item.payment_id = payment.id`)
            .where('wspc.id = :workspaceId', { workspaceId })
            .orderBy('payment.billingStartDate', 'DESC');

        if (skip) {
            query = query.skip(Number(skip));
        }
        if (limit) {
            query = query.take(Number(limit));
        }
        const payments = await query.getManyAndCount();

        const result = await Promise.all(
            payments[0].map(async (payment) => {
                if (payment.status === PaymentStatus.opened) {
                    if (!payment?.items) {
                        payment.items = [];
                    }
                    const virtualItens = (await this.getVirtualItems(
                        payment.workspace,
                        moment(parseFloat(String(payment.billingStartDate) || '0')),
                        moment(parseFloat(String(payment.billingEndDate) || '0')),
                    )) as PaymentItem[];
                    payment.items = [...(virtualItens || []), ...payment.items];
                }
                payment.items = payment.items.map((item) => ({
                    ...item,
                    unitPrice: parseFloat(String(item.unitPrice)),
                    totalPrice: parseFloat(String(item.totalPrice)),
                    quantity: parseFloat(String(item.quantity)),
                }));
                return payment;
            }),
        );

        return { data: result, count: payments[1] };
    }

    @CatchError()
    async getCustomerPayments(workspaceId: string) {
        const payments = await this.paymentRepository
            .createQueryBuilder('payment')
            .innerJoinAndMapOne('payment.workspace', Workspace, 'wspc', `wspc.id = payment.workspace_id`)
            .leftJoinAndMapMany('payment.items', PaymentItem, 'item', `item.payment_id = payment.id`)
            .where('wspc.id = :workspaceId', { workspaceId })
            .andWhere(`payment.status IN ('${PaymentStatus.awaitingPayment}', '${PaymentStatus.paid}')`)
            .orderBy('payment.billing_start_date', 'DESC')
            .getMany();
        return await Promise.all(
            payments.map(async (payment) => {
                if (payment.status === PaymentStatus.opened) {
                    if (!payment?.items) {
                        payment.items = [];
                    }
                    const virtualItens = (await this.getVirtualItems(
                        payment.workspace,
                        moment(parseFloat(String(payment.billingStartDate) || '0')),
                        moment(parseFloat(String(payment.billingEndDate) || '0')),
                    )) as PaymentItem[];
                    payment.items = [...(virtualItens || []), ...payment.items];
                }
                payment.items = payment.items.map((item) => ({
                    ...item,
                    unitPrice: parseFloat(String(item.unitPrice)),
                    totalPrice: parseFloat(String(item.totalPrice)),
                    quantity: parseFloat(String(item.quantity)),
                }));
                return payment;
            }),
        );
    }

    @CatchError()
    async createPaymentAll(billingMonth?: string): Promise<void> {
        const workspaces = await this.workspaceService.getActiveWorkspaces();
        for (const wspace of workspaces) {
            try {
                await this.createPayment({
                    accountId: wspace.accountId,
                    workspaceId: wspace.id,
                    billingMonth: billingMonth,
                });
            } catch (e) {
                console.log('PaymentService.createPaymentAll', e);
            }
        }
    }

    @CatchError()
    async createPayment(data: CreatePayment): Promise<Payment> {
        // const openedPayment = await this.getOpenPayment(data.accountId);
        // // Não permite criar 2 payment com status aberto
        // if (openedPayment) {
        //     throw Exceptions.ACCOUNT_HAS_OPENED_BILLING;
        // }
        const workspace = await this.workspaceService.getOneByIdAndAccount(data.workspaceId, data.accountId);
        if (!workspace) {
            throw Exceptions.WORKSPACE_DONT_BELONGS_TO_ACCOUNT;
        }

        let startDate: moment.Moment;
        let endDate: moment.Moment;
        let billingMonth: string;

        if (!!data.billingMonth) {
            const existingPayment = await this.getPaymentByBillingMonth(
                data.workspaceId,
                data.accountId,
                data.billingMonth,
            );
            if (
                existingPayment &&
                (existingPayment.status == PaymentStatus.opened ||
                    existingPayment.status == PaymentStatus.awaitingPayment ||
                    existingPayment.status == PaymentStatus.paid)
            ) {
                throw Exceptions.INVALID_CREATE_BILLING_MONTH;
            }
            const month = parseInt(data.billingMonth.split('/')[0]);
            const year = parseInt('20' + data.billingMonth.split('/')[1]);
            startDate = moment()
                .year(year)
                .month(month - 1)
                .startOf('month');
            endDate = moment()
                .year(year)
                .month(month - 1)
                .endOf('month');
            billingMonth = data.billingMonth;
        } else {
            const lastPayment = await this.getLastPayment(data.workspaceId, data.accountId);
            if (lastPayment) {
                startDate = moment(parseInt(String(lastPayment.billingStartDate)))
                    .add(1, 'month')
                    .startOf('month');
                endDate = moment(parseInt(String(lastPayment.billingEndDate)))
                    .add(1, 'month')
                    .endOf('month');
                billingMonth = moment(parseInt(String(lastPayment.billingEndDate)))
                    .add(1, 'month')
                    .format('MM/YY');
            }

            workspace.startAt = parseInt(String(workspace.startAt));

            //Significa que é o primeiro payment, logo o startDate deverá ser do workspace.startAt
            if (!lastPayment) {
                startDate = moment(workspace.startAt).startOf('day');
                endDate = moment(workspace.startAt).endOf('month');
                billingMonth = moment(workspace.startAt).format('MM/YY');
            }
        }

        const payment: Partial<Payment> = {
            accountId: data.accountId,
            workspaceId: data.workspaceId,
            billingStartDate: startDate.valueOf(),
            billingEndDate: endDate.valueOf(),
            billingMonth,
        };

        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const createdPayment = await queryRunner.manager.save(Payment, payment);
            await queryRunner.commitTransaction();

            createdPayment.items = (await this.getVirtualItems(workspace, startDate, endDate)) as PaymentItem[];

            this.eventsService.sendEvent({
                data: createdPayment as IBillingCreatedPaymentEvent,
                dataType: KissbotEventDataType.ANY,
                source: KissbotEventSource.KISSBOT_API,
                type: KissbotEventType.BILLING_CREATED_PAYMENT,
            });
            return createdPayment;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }

    @CatchError()
    async createGatewayPaymentAll(competencyMonth: string): Promise<void> {
        const completeOpenPayment = await this.paymentRepository
            .createQueryBuilder('payment')
            .andWhere('payment.status = :status', { status: PaymentStatus.opened })
            .andWhere('payment.billing_month = :competencyMonth', { competencyMonth })
            .andWhere('payment.gateway_payment_id IS NULL')
            .getMany();
        for (const pay of completeOpenPayment) {
            try {
                await this.createGatewayPayment({
                    accountId: pay.accountId,
                    workspaceId: pay.workspaceId,
                    paymentId: pay.id,
                });
            } catch (e) {
                console.log('PaymentService.createGatewayPaymentAll', e);
            }
        }
    }

    @CatchError()
    async createGatewayPayment(data: ClosePayment): Promise<Payment> {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const completeOpenPayment = await this.paymentRepository
                .createQueryBuilder('payment')
                .innerJoinAndMapOne('payment.account', Account, 'ac', `ac.id = payment.account_id`)
                .innerJoinAndMapOne('payment.workspace', Workspace, 'wspc', `ac.id = wspc.account_id`)
                .leftJoinAndMapMany('payment.items', PaymentItem, 'item', `item.payment_id = payment.id`)
                .where('wspc.id = :workspaceId', { workspaceId: data.workspaceId })
                .andWhere('payment.account_id = :accountId', { accountId: data.accountId })
                .andWhere('payment.id = :id', { id: data.paymentId })
                .andWhere('payment.status = :status', { status: PaymentStatus.opened })
                .getOne();

            const items = await this.getVirtualItems(
                completeOpenPayment.workspace,
                moment(parseFloat(String(completeOpenPayment.billingStartDate) || '0')),
                moment(parseFloat(String(completeOpenPayment.billingEndDate) || '0')),
            );
            const createdItems = await queryRunner.manager.save(
                PaymentItem,
                items.map((item) => ({ ...item, payment: { id: completeOpenPayment.id } })),
            );

            completeOpenPayment.items = [...createdItems, ...completeOpenPayment.items];

            const totalPayment = completeOpenPayment.items?.reduce((sum, curr) => {
                return parseFloat(String(curr.totalPrice)) + sum;
            }, 0);

            const externalReference = await this.getPaymentExternalReference(completeOpenPayment);
            const paymentMonth = completeOpenPayment.billingMonth.split('/')[0];
            const paymentYear = completeOpenPayment.billingMonth.split('/')[1];
            let dueDateMoment = moment(`20${paymentYear}-${paymentMonth}-01T00:00:00-03:00`)
                .add(1, 'month')
                .startOf('month')
                .add((completeOpenPayment.workspace?.dueDate || 10) - 1, 'days');
            const now = moment();
            if (dueDateMoment.valueOf() < now.valueOf()) {
                dueDateMoment = now.add(10, 'days');
            }

            const asaasResult = await this.asaasService.createPayment({
                billingType: 'BOLETO',
                dueDate: dueDateMoment.format('YYYY-MM-DD'),
                customer: completeOpenPayment.account.gatewayClientId,
                description: await this.renderPaymentDescription(completeOpenPayment),
                discount: {
                    dueDateLimitDays: 0,
                    value: 0,
                },
                externalReference,
                fine: {
                    value: 2,
                },
                interest: {
                    value: 1,
                },
                postalService: false,
                value: totalPayment,
            });

            await queryRunner.manager.update(
                Payment,
                {
                    id: completeOpenPayment.id,
                },
                {
                    status: PaymentStatus.awaitingPayment,
                    gatewayPaymentId: asaasResult.id,
                    totalValue: totalPayment,
                    dueDate: dueDateMoment.valueOf(),
                },
            );
            // atualiza objecto em memoria para nao ter que refazer outra consulta para retornar
            completeOpenPayment.status = PaymentStatus.awaitingPayment;
            completeOpenPayment.gatewayPaymentId = asaasResult.id;
            completeOpenPayment.totalValue = totalPayment;
            completeOpenPayment.dueDate = dueDateMoment.valueOf();

            await queryRunner.commitTransaction();

            return completeOpenPayment;
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }

    @CatchError()
    private async renderPaymentDescription(paymentWithItems: Payment): Promise<string> {
        // const itemsDescription = (paymentWithItems.items || []).reduce((total, curr) => {
        //     return `${total} \nItem: ${curr.itemDescription}; qtd: ${curr.quantity}; Vlr. unit.: ${curr.unitPrice}; Total: ${curr.totalPrice}`
        // }, '')

        if (!!paymentWithItems.workspace?.paymentDescription) {
            const vars = {
                MES: '{{MES}}',
            };
            const result = paymentWithItems.workspace?.paymentDescription.replace(
                new RegExp(vars.MES, 'g'),
                paymentWithItems.billingMonth,
            );
            return result;
        }

        return `REF ${paymentWithItems.billingMonth} - PLATAFORMA DE ATENDIMENTO OMNICHANNEL`;
    }

    @CatchError()
    async syncPaymentsInvoices(billingMonth: string) {
        const payments = await this.paymentRepository
            .createQueryBuilder('pay')
            .where('pay.gateway_invoice_id IS NULL')
            .andWhere('pay.gateway_payment_id IS NOT NULL')
            .andWhere('pay.billing_month = :billingMonth', { billingMonth })
            .getMany();
        for (const payment of payments) {
            await this.syncPaymentInvoice(payment);
        }
    }

    @CatchError()
    async syncPayments(workspaceId?: string) {
        let query = await this.paymentRepository
            .createQueryBuilder('pay')
            .where(
                `pay.status NOT IN ('${PaymentStatus.deleted}', '${PaymentStatus.paid}', '${PaymentStatus.receivedInCash}')`,
            );
        if (workspaceId) {
            query = query.andWhere('pay.workspace_id = :workspaceId', { workspaceId });
        }
        const payments = await query.getMany();
        for (const payment of payments) {
            await this.syncPaymentByPaymentObject(payment);
        }
    }

    @CatchError()
    async syncPayment(paymentId: number) {
        let payment = await this.paymentRepository
            .createQueryBuilder('pay')
            .where('pay.id = :paymentId', { paymentId })
            .getOne();
        return await this.syncPaymentByPaymentObject(payment);
    }

    @CatchError()
    private async syncPaymentByPaymentObject(payment: Payment) {
        let asaasPayment;
        try {
            asaasPayment = await this.asaasService.getPayment(payment.gatewayPaymentId);
        } catch (e) {
            const externalReference = await this.getPaymentExternalReference(payment);
            if (externalReference) {
                const result = await this.asaasService.getPaymentByExternalReference(externalReference);
                asaasPayment = result?.data?.[0];
            }
        }

        if (!asaasPayment) return;

        let statusToUpdate: PaymentStatus;
        if (asaasPayment.status == 'RECEIVED') {
            statusToUpdate = PaymentStatus.paid;
        } else if (asaasPayment.status == 'PENDING') {
            statusToUpdate = PaymentStatus.awaitingPayment;
        } else if (asaasPayment.status == 'OVERDUE') {
            statusToUpdate = PaymentStatus.overDue;
        } else {
            statusToUpdate = asaasPayment.status;
        }

        if (!!asaasPayment.deleted) {
            statusToUpdate = PaymentStatus.deleted;
        }

        const updateObject: Partial<Payment> = {};
        if (!!statusToUpdate) {
            updateObject.status = statusToUpdate;
        }

        updateObject.gatewayNetValue = asaasPayment.netValue;
        updateObject.gatewayOriginalValue = asaasPayment.originalValue;
        if (!!asaasPayment.paymentDate) {
            updateObject.gatewayPaymentDate = moment(asaasPayment.paymentDate).valueOf();
        }
        if (!!asaasPayment.dueDate) {
            updateObject.gatewayDueDate = moment(asaasPayment.dueDate).valueOf();
        }

        await this.paymentRepository.update({ id: payment.id }, updateObject);
    }

    @CatchError()
    private async syncPaymentInvoice(payment: Payment) {
        const asaasInvoice = await this.asaasService.findInvoiceByPaymentId(payment.gatewayPaymentId);
        if (asaasInvoice && asaasInvoice.id) {
            await this.paymentRepository.update(
                { id: payment.id },
                {
                    gatewayInvioceId: asaasInvoice.id,
                },
            );
        }
    }

    @CatchError()
    async createInvoiceBatch(billingMonth: string) {
        const payments = await this.paymentRepository
            .createQueryBuilder('pay')
            .where('pay.billingMonth = :billingMonth', { billingMonth })
            .andWhere('pay.gateway_invoice_id IS NULL')
            .andWhere('pay.gateway_payment_id IS NOT NULL')
            .getMany();

        let error = 0;
        for (const payment of payments) {
            try {
                await this.createPaymentInvoice(payment.id);
            } catch (e) {
                error++;
                this.logger.error('createInvoiceBatch');
                this.logger.error(e);
            }
        }

        return {
            total: payments.length,
            error,
        };
    }

    @CatchError()
    async createPaymentInvoice(paymentId: number) {
        const payment = await this.paymentRepository
            .createQueryBuilder('pay')
            .innerJoinAndMapOne('pay.account', Account, 'ac', `ac.id = pay.account_id`)
            .innerJoinAndMapOne(
                'pay.workspace',
                Workspace,
                'wspc',
                `ac.id = wspc.account_id AND wspc.id = pay.workspace_id`,
            )
            .where('pay.id = :paymentId', { paymentId })
            .andWhere('pay.gateway_invoice_id IS NULL')
            .getOne();
        if (!payment) return;
        if (!payment.workspace?.active) {
            return;
        }
        if (!payment.gatewayPaymentId) throw Exceptions.CANNOT_CREATE_INVOICE_GATEWAY_ON_NOT_SYNCHRONIZED_PAYMENT;
        const asaasInvoice = await this.asaasService.findInvoiceByPaymentId(payment.gatewayPaymentId);
        if (asaasInvoice && asaasInvoice.id) {
            await this.paymentRepository.update(
                { id: payment.id },
                {
                    gatewayInvioceId: asaasInvoice.id,
                },
            );
            return;
        } else {
            let invoice = await this.asaasService.createPaymentInvoice({
                deductions: 0,
                effectiveDate: moment(parseInt(String(payment.dueDate))).format('YYYY-MM-DD'),
                externalReference: await this.getPaymentExternalReference(payment),
                installment: null,
                municipalServiceId: '3482',
                municipalServiceCode: null,
                municipalServiceName: 'PLATAFORMA DE ATENDIMENTO OMNICHANNEL',
                payment: payment.gatewayPaymentId,
                observations: await this.renderInvoiceObservations(payment),
                serviceDescription: 'PLATAFORMA DE ATENDIMENTO OMNICHANNEL',
                taxes: {
                    retainIss: false,
                    iss: 2,
                    cofins: 0,
                    csll: 0,
                    inss: 0,
                    ir: 0,
                    pis: 0,
                },
                value: payment.totalValue,
            });
            if (!invoice || !invoice.id) {
                invoice = await this.asaasService.findInvoiceByPaymentId(payment.gatewayPaymentId);
            }
            if (invoice && invoice.id) {
                await this.paymentRepository.update(
                    { id: payment.id },
                    {
                        gatewayInvioceId: invoice.id,
                    },
                );
            }
            await this.asaasService.authorizeInvoice(invoice.id);
        }
    }

    @CatchError()
    private async renderInvoiceObservations(paymentWithWorkspace: Payment): Promise<string> {
        // const itemsDescription = (paymentWithItems.items || []).reduce((total, curr) => {
        //     return `${total} \nItem: ${curr.itemDescription}; qtd: ${curr.quantity}; Vlr. unit.: ${curr.unitPrice}; Total: ${curr.totalPrice}`
        // }, '')

        const prefixMessage =
            'Serviços de licenciamento – item 1.05 da LC 116/03 – Não se aplicam as retenções de IRRF e CSRF cfe. SC COSIT 407/2017.';

        if (!!paymentWithWorkspace.workspace?.invoiceDescription) {
            const vars = {
                MES: '{{MES}}',
                QTD_ATENDIMENTOS: '{{QTD_ATENDIMENTOS}}',
            };
            let result = paymentWithWorkspace.workspace?.invoiceDescription.replace(
                new RegExp(vars.MES, 'g'),
                paymentWithWorkspace.billingMonth,
            );
            if (paymentWithWorkspace.workspace?.invoiceDescription?.indexOf(vars.QTD_ATENDIMENTOS) > -1) {
                try {
                    const totalConversations = await this.paymentGetDataService.getConversationCount(
                        paymentWithWorkspace.workspaceId,
                        moment(parseFloat(String(paymentWithWorkspace.billingStartDate))),
                        moment(parseFloat(String(paymentWithWorkspace.billingEndDate))),
                    );
                    result = result.replace(new RegExp(vars.QTD_ATENDIMENTOS, 'g'), `${totalConversations}`);
                } catch (e) {
                    this.logger.error(`renderInvoiceObservations - totalConversations`);
                    this.logger.error(e);
                }
            }
            return `${prefixMessage} - ${result}`;
        }

        return `${prefixMessage} REF ${paymentWithWorkspace.billingMonth}`;
    }

    @CatchError()
    private async getPaymentExternalReference(payment: Payment) {
        return `INVOICE:${payment.id}`;
    }

    @CatchError()
    async deletePayment(paymentId: number): Promise<void> {
        // Apenas um payment com status opened pode ser excluido
        await this.paymentRepository.delete({
            id: paymentId,
            status: PaymentStatus.opened,
        });
    }

    @CatchError()
    async getOpenPayment(accountId: number): Promise<Payment> {
        return await this.paymentRepository
            .createQueryBuilder('payment')
            .where('payment.account_id = :accountId', { accountId })
            .andWhere('payment.status = :status', { status: PaymentStatus.opened })
            .getOne();
    }

    @CatchError()
    async getPaymentByWorkspaceIdAndId(workspaceId: string, paymentId: number): Promise<Payment> {
        return await this.paymentRepository
            .createQueryBuilder('payment')
            .where('payment.workspace_id = :workspaceId', { workspaceId })
            .andWhere('payment.id = :id', { id: paymentId })
            .getOne();
    }

    @CatchError()
    private async getPaymentByBillingMonth(
        workspaceId: string,
        accountId: number,
        billingMonth: string,
    ): Promise<Payment> {
        return await this.paymentRepository
            .createQueryBuilder('payment')
            .where('payment.account_id = :accountId', { accountId })
            .andWhere('payment.billing_month = :billingMonth', { billingMonth })
            .andWhere('payment.workspace_id = :workspaceId', { workspaceId })
            .getOne();
    }

    @CatchError()
    private async getLastPaidPayment(accountId: number): Promise<Payment> {
        return await this.paymentRepository
            .createQueryBuilder('payment')
            .where('payment.account_id = :accountId', { accountId })
            .andWhere('payment.status = :status', { status: PaymentStatus.paid })
            .orderBy('payment.billing_end_date', 'DESC')
            .getOne();
    }

    @CatchError()
    private async getLastPayment(workspaceId: string, accountId: number): Promise<Payment> {
        return await this.paymentRepository
            .createQueryBuilder('payment')
            .where('payment.account_id = :accountId', { accountId })
            .andWhere('payment.status <> :status', { status: PaymentStatus.deleted })
            .andWhere('payment.workspace_id = :workspaceId', { workspaceId: workspaceId })
            .orderBy('payment.billing_end_date', 'DESC')
            .getOne();
    }

    @CatchError()
    async updatePaymentStatus(gatewayPaymentId: string, status: PaymentStatus) {
        const queryRunner = this.connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.manager.update(
                Payment,
                {
                    gatewayPaymentId,
                },
                {
                    status,
                },
            );
            await queryRunner.commitTransaction();
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }

    @CatchError()
    async getCurrentPaymentResume(workspaceId: string): Promise<{
        sum: number;
        billingStartDate: number;
        billingEndDate: number;
    }> {
        const result: {
            sum: string;
            billingStartDate: string;
            billingEndDate: string;
            id;
        } = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('sum(item.total_price)')
            .addSelect('payment.billing_start_date as "billingStartDate"')
            .addSelect('payment.billing_end_date as "billingEndDate"')
            .addSelect('payment.id')
            .innerJoin(PaymentItem, 'item', `payment.id = item.payment_id`)
            .where('payment.workspace_id = :workspaceId', { workspaceId })
            .andWhere(`payment.billing_month = '${moment().format('MM/YY')}'`)
            .groupBy('payment.id')
            .getRawOne();
        return {
            billingEndDate: parseFloat(result?.billingEndDate || '0'),
            billingStartDate: parseFloat(result?.billingStartDate || '0'),
            sum: parseFloat(result?.sum || '0'),
        };
    }

    @CatchError()
    async getLastPaymentResume(workspaceId: string): Promise<{
        sum: number;
        billingStartDate: number;
        billingEndDate: number;
    }> {
        const result: {
            sum: string;
            billingStartDate: string;
            billingEndDate: string;
            id;
        } = await this.paymentRepository
            .createQueryBuilder('payment')
            .select('sum(item.total_price)')
            .addSelect('payment.billing_start_date as "billingStartDate"')
            .addSelect('payment.billing_end_date as "billingEndDate"')
            .addSelect('payment.id')
            .innerJoin(PaymentItem, 'item', `payment.id = item.payment_id`)
            .where('payment.workspace_id = :workspaceId', { workspaceId })
            .andWhere(`payment.billing_month = '${moment().subtract(1, 'month').format('MM/YY')}'`)
            .groupBy('payment.id')
            .orderBy('payment.billing_end_date', 'DESC')
            .getRawOne();
        return {
            billingEndDate: parseFloat(result?.billingEndDate || '0'),
            billingStartDate: parseFloat(result?.billingStartDate || '0'),
            sum: parseFloat(result?.sum || '0'),
        };
    }

    @CatchError()
    async getItensByChannels(
        workspace: Workspace,
        startDate: moment.Moment,
        endDate: moment.Moment,
    ): Promise<Partial<PaymentItem>[]> {
        const items: Partial<PaymentItem>[] = [];
        const month = moment(startDate.valueOf()).startOf('month').toDate();

        const itemPlanPrice = this.getItemPlanPrice(workspace, startDate, endDate);
        items.push({ ...itemPlanPrice });

        const workspaceChannelSpecification =
            await this.workspaceChannelSpecificationService.getWorkspaceChannelSpecificationByWorkspaceId(workspace.id);
        if (workspaceChannelSpecification?.length) {
            const channelsResume = await this.workspaceChannelResumeService.getChannelsResume(workspace.id, month);

            if (channelsResume.length) {
                // workspaceChannelSpecification.forEach((channelSpecification) => {
                for (const channelSpecification of workspaceChannelSpecification) {
                    const existChannelResume = channelsResume.find(
                        (resume) => resume.createdByChannel === channelSpecification.channelId,
                    );

                    if (existChannelResume) {
                        const excededMessageLimit = existChannelResume.messagesSum - channelSpecification.messageLimit;
                        const excededConversationLimit =
                            existChannelResume.conversationsSum - channelSpecification.conversationLimit;
                        if (excededMessageLimit > 0) {
                            const total = channelSpecification.messageExcededPrice * excededMessageLimit;
                            if (total) {
                                items.push({
                                    itemDescription: `Mensagens excedentes do canal ${
                                        ConvertChannelName[channelSpecification.channelId]
                                    }`,
                                    quantity: excededMessageLimit,
                                    type: PaymentItemTypes.exceeded_message,
                                    unitPrice: channelSpecification.messageExcededPrice,
                                    totalPrice: total,
                                });
                            }
                        }

                        if (excededConversationLimit > 0) {
                            const total = channelSpecification.conversationExcededPrice * excededConversationLimit;
                            const conversationChannelType = await this.getConversationItemType(
                                channelSpecification.channelId,
                            );
                            if (total) {
                                items.push({
                                    itemDescription: `Atendimentos excedentes iniciados pelo canal ${
                                        ConvertChannelName[channelSpecification.channelId]
                                    }`,
                                    quantity: excededConversationLimit,
                                    type: conversationChannelType,
                                    unitPrice: channelSpecification.conversationExcededPrice,
                                    totalPrice: total,
                                });
                            }
                        }
                    }
                }
            }
        }
        return items;
    }

    private async getConversationItemType(channelType: WorkspaceChannels): Promise<PaymentItemTypes> {
        switch (channelType) {
            case WorkspaceChannels.api:
                return PaymentItemTypes.conversation_api;
            case WorkspaceChannels.campaign:
                return PaymentItemTypes.conversation_campaign;
            case WorkspaceChannels.gupshup:
                return PaymentItemTypes.conversation_gupshup;
            case WorkspaceChannels.liveagent:
                return PaymentItemTypes.conversation_liveagent;
            case WorkspaceChannels.webchat:
                return PaymentItemTypes.conversation_webchat;
            default:
                return PaymentItemTypes.conversation;
        }
    }

    getItemPlanPrice(workspace: Workspace, startDate: moment.Moment, endDate: moment.Moment) {
        // Calculo do preço do plano é variavel, o preço do plano é para 30 dias.
        // A cobrança pode ter mais ou menos de 30 dias entre o BillingStartDate e BillingEndDate
        // o calculo deve ser baseado no preço por dia que é workspace.planPrice / 30; logo se a
        // cobrança tem 28 dias por exemplo em fevereiro o preço do plano será calculado
        // da seguinte maneira: (workspace.planPrice / 30) * 28
        const startToEndDuration = moment.duration(endDate.diff(startDate));
        let billingDaysDuration = startToEndDuration.asDays();

        const startOfPaymentMonth = moment(startDate.valueOf()).startOf('month');
        const endOfPaymentMonth = moment(startDate.valueOf()).endOf('month');

        const isFirstDayOfMonth = startOfPaymentMonth.valueOf() === startDate.valueOf();
        const isLastDayOfMonth = endOfPaymentMonth.valueOf() === endDate.valueOf();

        if (isFirstDayOfMonth && isLastDayOfMonth) {
            billingDaysDuration = 30;
        }

        const planPricePerDay = workspace.planPrice / 30;

        const planPrice = billingDaysDuration * planPricePerDay;

        let description = `Plano mensal: ${workspace.planConversationLimit} Atendimentos, ${workspace.planUserLimit} Usuários`;

        if (workspace?.billingType === BillingType.channel) {
            description = `Plano mensal`;
        }

        return {
            itemDescription: description,
            quantity: 1,
            type: PaymentItemTypes.plan,
            unitPrice: planPrice,
            totalPrice: planPrice,
        };
    }

    @CatchError()
    async getVirtualItems(workspace: Workspace, startDate: moment.Moment, endDate: moment.Moment) {
        if (workspace.billingType === BillingType.channel) {
            return await this.getItensByChannels(workspace, startDate, endDate);
        }

        const items: Partial<PaymentItem>[] = [];
        // Garante que a data de inicio do periodo esteja setada para o inicio do dia, ou seja, as 00:00:00:000
        // e que a data final do periodo esteja setada para o final do dia, ou seja, 23:59:59:999
        // Isso é necessario para verificar se a data de inicio corresponde ao primeiro dia do mes
        // e a data de final corresponde ao ultimo dia do mês; se corresponder a variavel billingDaysDuration será de 30;
        // Caso contrario a variavel billingDaysDuration será a diferença de dias entre o startDate e o endDate
        startDate = startDate.startOf('day');
        endDate = endDate.endOf('day');

        const itemPlanPrice = this.getItemPlanPrice(workspace, startDate, endDate);
        items.push({ ...itemPlanPrice });

        const planExceededMessagePrice = parseFloat(String(workspace.planExceededMessagePrice));
        const planHsmExceededMessagePrice = parseFloat(String(workspace.planHsmExceedMessagePrice));
        const planConversationExceededPrice = parseFloat(String(workspace.planConversationExceedPrice));
        const planUserExceededPrice = parseFloat(String(workspace.planUserExceedPrice));

        if (typeof planExceededMessagePrice != 'number') {
            throw Exceptions.PLAN_EXCEEDED_MESSAGE_PRICE_EMPTY;
        }

        let totalMessages = 0;
        if (Number(workspace.planMessageLimit)) {
            totalMessages = await this.paymentGetDataService.getMsgCount(workspace.id, startDate, endDate);
        }

        let totalHsmMessages = 0;
        if (Number(workspace.planHsmMessageLimit)) {
            totalHsmMessages = await this.paymentGetDataService.getHsmCount(workspace.id, startDate, endDate);
        }

        const totalConversations = await this.workspaceChannelResumeService.getChannelsSumByWorkspace(
            workspace.id,
            startDate.toDate(),
        );

        // const totalConversations = await this.paymentGetDataService.getConversationCount(
        //     workspace.id,
        //     startDate,
        //     endDate,
        // );

        const totalUsers = (await this.usersService.checkUserCount(workspace.id)).userCount;

        const planMessageCount = workspace.planMessageLimit || Number.MAX_VALUE;
        if (totalMessages > planMessageCount) {
            const exceededMessages = totalMessages - planMessageCount;
            const exceededItem: Partial<PaymentItem> = {
                itemDescription: 'Mensagens excedentes',
                quantity: exceededMessages,
                type: PaymentItemTypes.exceeded_message,
                unitPrice: planExceededMessagePrice,
                totalPrice: planExceededMessagePrice * exceededMessages,
            };
            items.push(exceededItem);
        }

        const planMessageHsmCount = workspace.planHsmMessageLimit || 0;
        if (totalHsmMessages > planMessageHsmCount) {
            const exceededHsmMessages = totalHsmMessages - planMessageHsmCount;
            const exceededHsmItem: Partial<PaymentItem> = {
                itemDescription: 'Mensagens template excedentes',
                quantity: exceededHsmMessages,
                type: PaymentItemTypes.exceeded_message,
                unitPrice: planHsmExceededMessagePrice,
                totalPrice: exceededHsmMessages * planHsmExceededMessagePrice,
            };
            items.push(exceededHsmItem);
        }

        //Se não estiver preenchido não deve ser levado em conta. Maior valor possível
        const planConversationCount = workspace.planConversationLimit || Number.MAX_VALUE;
        if (totalConversations > planConversationCount) {
            const exceededConversations = totalConversations - planConversationCount;
            const exceededConversationItem: Partial<PaymentItem> = {
                itemDescription: 'Atendimentos excedentes',
                quantity: exceededConversations,
                type: PaymentItemTypes.conversation,
                unitPrice: planConversationExceededPrice,
                totalPrice: exceededConversations * planConversationExceededPrice,
            };
            items.push(exceededConversationItem);
        }

        const planUserCount = workspace.planUserLimit;
        if (totalUsers > planUserCount) {
            const exceededUsers = totalUsers - planUserCount;
            const exceededUsersItem: Partial<PaymentItem> = {
                itemDescription: 'Usuários excedentes',
                quantity: exceededUsers,
                type: PaymentItemTypes.user,
                unitPrice: planUserExceededPrice,
                totalPrice: exceededUsers * planUserExceededPrice,
            };
            items.push(exceededUsersItem);
        }

        try {
            const dinamycPaymentItems = await this.paymentSpecificationService.getWorkspaceItems(
                workspace,
                startDate,
                endDate,
            );
            dinamycPaymentItems.forEach((paymentItem) => {
                items.push(paymentItem);
            });
        } catch (e) {
            console.log(e);
            Sentry.captureEvent({
                message: `${PaymentService.name}.getVirtualItems - dinamycPaymentItems`,
                extra: {
                    error: e,
                },
            });
        }

        return items;
    }
}
