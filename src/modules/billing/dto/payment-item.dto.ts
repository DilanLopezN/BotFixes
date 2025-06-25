import { PaymentItemTypes } from '../models/payment-item.entity';

export class CreatePaymentItemDto {
    paymentId: number;
    itemDescription: string;
    quantity: number;
    unitPrice: number;
    type: PaymentItemTypes;
}

export class UpdatePaymentItemDto {
    itemDescription: string;
    quantity: number;
    unitPrice: number;
}
