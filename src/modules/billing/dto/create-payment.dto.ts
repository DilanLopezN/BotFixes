export class CreatePaymentDto {
    workspaceId: string;
    accountId: number;
    billingMonth?: string;
}

export class ClosePaymentDto extends CreatePaymentDto {}