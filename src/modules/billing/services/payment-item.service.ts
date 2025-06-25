import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';
import { PaymentItem, PaymentItemTypes } from '../models/payment-item.entity';
import { Payment, PaymentStatus } from '../models/payment.entity';
import * as moment from 'moment';
import { BILLING_CONNECTION } from '../ormconfig';
import { PaymentService } from './payment.service';
import { CreatePaymentItemDto, UpdatePaymentItemDto } from '../dto/payment-item.dto';

@Injectable()
export class PaymentItemService {
    constructor(
        @InjectRepository(PaymentItem, BILLING_CONNECTION)
        private paymentItemRepository: Repository<PaymentItem>,
        private readonly paymentService: PaymentService,
    ) {}

    @CatchError()
    async getCurrentMonthTotalValue(): Promise<number> {
        const result: { sum: string } = await this.paymentItemRepository
            .createQueryBuilder('item')
            .select('sum(item.total_price)')
            .innerJoin(
                Payment,
                'payment',
                `payment.id = item.payment_id AND payment.billing_month = '${moment().format('MM/YY')}'`,
            )
            .getRawOne();
        return parseFloat(result.sum);
    }

    @CatchError()
    async createPaymentItem(workspaceId: string, paymentId: number, item: CreatePaymentItemDto): Promise<PaymentItem> {
        const payment = await this.paymentService.getPaymentByWorkspaceIdAndId(workspaceId, paymentId);

        if (!payment) {
            throw Exceptions.ERROR_NOT_FOUND_PAYMENT;
        }

        if (payment.status !== PaymentStatus.opened) {
            throw Exceptions.CANNOT_CREATE_PAYMENT_ITEM_INVALID_STATUS;
        }

        const totalPrice = item.quantity * item.unitPrice;

        const paymentItem = await this.paymentItemRepository.save({
            itemDescription: item.itemDescription,
            payment: { id: Number(paymentId) },
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: totalPrice,
            type: item.type,
        });

        return paymentItem;
    }

    @CatchError()
    async updatePaymentItem(
        workspaceId: string,
        paymentId: number,
        paymentItemId: number,
        item: UpdatePaymentItemDto,
    ): Promise<UpdateResult> {
        const payment = await this.paymentService.getPaymentByWorkspaceIdAndId(workspaceId, paymentId);

        if (!payment) {
            throw Exceptions.ERROR_NOT_FOUND_PAYMENT;
        }

        if (payment.status !== PaymentStatus.opened) {
            throw Exceptions.CANNOT_UPDATE_PAYMENT_ITEM_INVALID_STATUS;
        }

        const totalPrice = item.quantity * item.unitPrice;

        const paymentItem = await this.paymentItemRepository.update(
            { id: paymentItemId },
            {
                itemDescription: item.itemDescription,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice,
            },
        );

        return paymentItem;
    }

    @CatchError()
    async deletePaymentItem(workspaceId: string, paymentId: number, paymentItemId: number): Promise<DeleteResult> {
        const payment = await this.paymentService.getPaymentByWorkspaceIdAndId(workspaceId, paymentId);

        if (!payment) {
            throw Exceptions.ERROR_NOT_FOUND_PAYMENT;
        }

        if (payment.status !== PaymentStatus.opened) {
            throw Exceptions.CANNOT_DELETE_PAYMENT_ITEM_INVALID_STATUS;
        }

        return await this.paymentItemRepository.delete({ id: paymentItemId, payment: { id: paymentId } });
    }
}
