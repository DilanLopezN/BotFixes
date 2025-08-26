import { ModuleRef } from '@nestjs/core';
import {
    GetPaymentItemsData,
    IPaymentItemSpecificationService,
} from '../../interfaces/payment-item-specification-service.interface';
import { PaymentItemSpecification } from '../../interfaces/payment-item-specification.interface';
import { PaymentItem, PaymentItemTypes } from '../../models/payment-item.entity';
import { ChannelConfigDiscountService } from './channelConfig-discount.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GetPaymentItemService implements IPaymentItemSpecificationService {
    private readonly logger = new Logger(GetPaymentItemService.name);
    constructor(private readonly moduleRef: ModuleRef) {}

    async getPaymentItems(data: GetPaymentItemsData): Promise<Partial<PaymentItem>[]> {
        try {
            const { specification, workspace } = data;
            const implementation = this.getImplementation(specification);
            return (await implementation?.getPaymentItems(data)) || [];
        } catch (e) {
            this.logger.error(e);
            console.log(e);
        }
    }

    private getImplementation(specification: PaymentItemSpecification): IPaymentItemSpecificationService {
        switch (specification.type) {
            case PaymentItemTypes.reminder_discount:
            case PaymentItemTypes.campaign_discount:
            case PaymentItemTypes.confirmation_discount:
            case PaymentItemTypes.api_discount:
            case PaymentItemTypes.api_ivr_discount:
            case PaymentItemTypes.medical_report_discount:
            case PaymentItemTypes.nps_discount:
            case PaymentItemTypes.schedule_notification_discount:
            case PaymentItemTypes.documents_request_discount:
            case PaymentItemTypes.active_mkt_discount:
            case PaymentItemTypes.recover_lost_schedule_discount: {
                return this.moduleRef.get<ChannelConfigDiscountService>(ChannelConfigDiscountService);
            }
        }
    }
}
