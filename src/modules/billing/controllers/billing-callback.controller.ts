import { Body, Controller, Post } from "@nestjs/common";
import { PaymentCallbackService } from "../services/payment-callback.service";

@Controller('billing')
export class BillingCallbackController {
    constructor(
        private readonly paymentCBService: PaymentCallbackService,
    ) {}
    @Post('/callback/payment')
    async createAccount(
        @Body() body: any
    ) {
        return await this.paymentCBService.paymentEvent(body)
    }
}