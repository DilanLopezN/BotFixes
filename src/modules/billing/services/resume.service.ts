import { Injectable } from '@nestjs/common';
import { AccountService } from './account.service';
import { PaymentItemService } from './payment-item.service';
import { PaymentService } from './payment.service';

@Injectable()
export class ResumeService {
    constructor(
        private readonly accountService: AccountService,
        private readonly paymentItemService: PaymentItemService,
        private readonly paymentService: PaymentService,
    ) {}

    async workspacesResume() {
        const accountCount = await this.accountService.getAccountsCount();
        const openedAccountCount = await this.accountService.getOpenPaymentAccountsCount();
        const paidAccountCount = await this.accountService.getPaidPaymentAccountsCount();
        const notPaymentAccountCount = await this.accountService.getNotPaymentAccountsCount();
        const totalValue = await this.paymentItemService.getCurrentMonthTotalValue();
        return { totalValue, accountCount, openedAccountCount, paidAccountCount, notPaymentAccountCount };
    }

    async workspaceResume(workspaceId: string) {
        const currentPaymentResume = await this.paymentService.getCurrentPaymentResume(workspaceId);
        const lastPaymentResume = await this.paymentService.getLastPaymentResume(workspaceId);
        return {
            currentPaymentResume,
            lastPaymentResume,
        };
    }
}
