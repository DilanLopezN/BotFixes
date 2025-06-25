import { Injectable } from '@nestjs/common';
import { Workspace } from '../models/workspace.entity';
import { PaymentItemSpecification } from '../interfaces/payment-item-specification.interface';
import { ModuleRef } from '@nestjs/core';
import { GetPaymentItemService } from './payment-item-specification-services/get-payment-item.service';
import { PaymentItem, PaymentItemTypes } from '../models/payment-item.entity';
import * as moment from 'moment';
import { retry } from 'rxjs';

@Injectable()
export class PaymentSpecificationService {
    constructor(private readonly getPaymentItemService: GetPaymentItemService) {}

    async getWorkspaceItems(
        workspace: Workspace,
        startDate: moment.Moment,
        endDate: moment.Moment,
    ): Promise<Partial<PaymentItem>[]> {
        const specList = await this.getWorkspaceSpecifications(workspace);
        const paymentItems = [];
        for (const spec of specList) {
            const newItems = await this.getPaymentItemService.getPaymentItems({
                workspace,
                specification: spec,
                startDate,
                endDate,
            });
            newItems.forEach((newItem) => paymentItems.push(newItem));
        }
        return paymentItems;
    }

    private async getWorkspaceSpecifications(workspace: Workspace): Promise<PaymentItemSpecification[]> {
        // Por enquanto estes itens estao hardcode entao deve ser adicionado conforme necessário o desconto em alguma fatura
        // As datas de inicio e fim não estão sendo levadas em conta fica como @todo
        let specList: PaymentItemSpecification[] = [];
        if (
            workspace.id == '600052d8a0772a00087967da' ||
            workspace.id == '64762d5fb5f93cf24bde9fdd' ||
            workspace.id == '6095aa93970d92000b524e26' ||
            workspace.id == '61fd78b909b57e00074d541d'
        ) {
            specList = [
                {
                    type: PaymentItemTypes.reminder_discount,
                    unitPrice: -1,
                    validityStarts: new Date('2024-03-31'),
                    validityEnds: new Date('2024-03-31'),
                    workspaceId: workspace.id,
                },
            ];
        }
        return specList;
    }
}
