import { PaymentItemTypes } from "../models/payment-item.entity";

export interface PaymentItemSpecification {
  workspaceId: string;
  type: PaymentItemTypes;
  validityStarts: Date;
  validityEnds: Date;
  unitPrice: number;
}