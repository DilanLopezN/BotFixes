import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '../models/payment.entity';
import { PaymentService } from './payment.service';

@Injectable()
export class PaymentCallbackService {
    constructor(private readonly paymentService: PaymentService) {}

    async paymentEvent(event) {
        switch (event.event) {
            case 'PAYMENT_CONFIRMED': {
                await this.paymentService.updatePaymentStatus(event.payment.id, PaymentStatus.paid);
            }
            case 'PAYMENT_OVERDUE': {
                await this.paymentService.updatePaymentStatus(event.payment.id, PaymentStatus.overDue);
            }
            default: {
                console.log('Default callback asaas', JSON.stringify(event));
            }
        }
    }
}
