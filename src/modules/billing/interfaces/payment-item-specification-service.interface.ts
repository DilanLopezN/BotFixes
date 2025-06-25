import * as moment from 'moment';
import { PaymentItem } from '../models/payment-item.entity';
import { Workspace } from '../models/workspace.entity';
import { PaymentItemSpecification } from './payment-item-specification.interface';

export interface GetPaymentItemsData {
    workspace: Workspace;
    specification: PaymentItemSpecification;
    startDate: moment.Moment;
    endDate: moment.Moment;
}

export interface IPaymentItemSpecificationService {
    getPaymentItems(data: GetPaymentItemsData): Promise<Partial<PaymentItem>[]>;
}
