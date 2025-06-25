import { Delete, Get, UseGuards } from '@nestjs/common';
import { Body, Controller, Param, Post, Put, Query } from '@nestjs/common';
import { AuthGuard } from './../../auth/guard/auth.guard';
import { RolesGuard } from './../../users/guards/roles.guard';
import { CreateAccountDto } from '../dto/create-account.dto';
import { CreatePaymentDto, ClosePaymentDto } from '../dto/create-payment.dto';
import { CreateWorkspaceDto } from '../dto/create-workspace.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { AccountService } from '../services/account.service';
import { PaymentService } from '../services/payment.service';
import { WorkspaceService } from '../services/workspace.service';
import { RolesDecorator } from './../../users/decorators/roles.decorator';
import { PredefinedRoles } from './../../../common/utils/utils';
import { SyncPaymentInvoiceDto } from '../dto/sync-payment-invoice.dto';
import {
    CreateWorkspaceChannelSpecification,
    WorkspaceChannelSpecification,
} from '../dto/workspace-channel-specification.dto';
import { PaymentItemService } from '../services/payment-item.service';
import { CreatePaymentItemDto, UpdatePaymentItemDto } from '../dto/payment-item.dto';

@Controller('billing')
export class BillingController {
    constructor(
        private readonly accountService: AccountService,
        private readonly paymentService: PaymentService,
        private readonly paymentItemService: PaymentItemService,
        private readonly workspaceService: WorkspaceService,
    ) {}

    @Post('sync-payments')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async syncPayments() {
        return await this.paymentService.syncPayments();
    }

    @Post('sync-payment/:paymentId')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async syncPayment(@Param('paymentId') paymentId: number) {
        return await this.paymentService.syncPayment(paymentId);
    }

    @Post('sync-payments/:workspaceId')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async syncWorkspacePayments(@Param('workspaceId') workspaceId: string) {
        return await this.paymentService.syncPayments(workspaceId);
    }

    @Get('gateway/account/:cnpj')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async getGatewayAccount(@Param('cnpj') cnpj: string) {
        return await this.accountService.getAccountGateway(cnpj);
    }

    @Post('account')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async createAccount(@Body() body: CreateAccountDto) {
        const workspaceIds = body.vinculeToWorkspaceIds;
        delete body.vinculeToWorkspaceIds;
        return await this.accountService.create(body, workspaceIds);
    }

    @Put('account/:id')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async updateAccount(@Body() body: UpdateAccountDto, @Param('id') id: string) {
        const workspaceIds = body.vinculeToWorkspaceIds;
        delete body.vinculeToWorkspaceIds;
        return await this.accountService.udpate(body, parseInt(id), workspaceIds);
    }

    @Get('account')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN])
    async listAccounts(@Query('simpleView') simpleView: string) {
        const showSimpleView: boolean = simpleView === 'true';
        return await this.accountService.getAccounts(showSimpleView);
    }

    @Post('payment')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async createPayment(@Body() body: CreatePaymentDto) {
        return await this.paymentService.createPayment(body);
    }

    @Post('all-payment')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async createPaymentAll(@Query('billingMonth') billingMonth: string) {
        return await this.paymentService.createPaymentAll(billingMonth);
    }

    @Post('all-gateway-payment')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async createGatewayPaymentAll(@Query('competencyMonth') competencyMonth: string) {
        return await this.paymentService.createGatewayPaymentAll(competencyMonth);
    }

    @Delete('payment/:paymentId')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async deletePayment(@Param('paymentId') paymentId: string) {
        return await this.paymentService.deletePayment(parseInt(String(paymentId)));
    }

    @Get('payment')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async getPayments(
        @Query('workspaceId') workspaceId: string,
        @Query('limit') limit: string,
        @Query('skip') skip: string,
    ) {
        return await this.paymentService.getPayments(workspaceId, limit, skip);
    }

    @Post('payment/:paymentId/create-payment')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async closePayment(@Body() body: ClosePaymentDto, @Param('paymentId') paymentId: string) {
        return await this.paymentService.createGatewayPayment({
            ...body,
            paymentId: parseInt(paymentId),
        });
    }

    @Get('workspace')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async getWorkspaces(@Query('active') active: string) {
        const isActive: boolean = active === 'false' ? false : true;

        return await this.paymentService.getWorkspacesWithLastPayment({ active: isActive });
    }

    @Post('workspace')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async createWorkspace(
        @Body() body: { workspace: CreateWorkspaceDto; channelSpecifications?: CreateWorkspaceChannelSpecification[] },
    ) {
        return await this.workspaceService.createWorkspaceBillingSpecification(
            { ...body.workspace },
            body.channelSpecifications,
        );
    }

    @Put('workspace/:workspaceId')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async updateWorkspace(
        @Body() body: { workspace: CreateWorkspaceDto; channelSpecifications?: WorkspaceChannelSpecification[] },
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.workspaceService.updateWorkspaceBillingSpecification(
            { ...body.workspace, id: workspaceId },
            workspaceId,
            body.channelSpecifications,
        );
    }

    @Get('workspace/:workspaceId')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN])
    async getWorkspaceById(@Param('workspaceId') workspaceId: string) {
        return await this.workspaceService.getWorkspaceById(workspaceId);
    }

    @Post('sync-payment-invoices')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async syncPaymentInvoices(@Body() body: SyncPaymentInvoiceDto) {
        return await this.paymentService.syncPaymentsInvoices(body.billingMonth);
    }

    @Post('payment/:paymentId/create-invoice')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async createPaymentInvoice(@Param('paymentId') paymentId: string) {
        return await this.paymentService.createPaymentInvoice(parseInt(paymentId));
    }

    @Post('payment/create-invoice-batch')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async createInvoiceBatch(@Body() body: { billingMonth: string }) {
        return await this.paymentService.createInvoiceBatch(body.billingMonth);
    }

    @Post('/workspace/:workspaceId/payment/:paymentId/create-payment-item')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async createPaymentItem(
        @Param('workspaceId') workspaceId: string,
        @Param('paymentId') paymentId: number,
        @Body() body: CreatePaymentItemDto,
    ) {
        return await this.paymentItemService.createPaymentItem(workspaceId, Number(paymentId), body);
    }

    @Put('/workspace/:workspaceId/payment/:paymentId/payment-item/:paymentItemId')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async updatePaymentItem(
        @Param('workspaceId') workspaceId: string,
        @Param('paymentId') paymentId: number,
        @Param('paymentItemId') paymentItemId: number,
        @Body() body: UpdatePaymentItemDto,
    ) {
        return await this.paymentItemService.updatePaymentItem(
            workspaceId,
            Number(paymentId),
            Number(paymentItemId),
            body,
        );
    }

    @Delete('/workspace/:workspaceId/payment/:paymentId/payment-item/:paymentItemId')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async deletePaymentItem(
        @Param('workspaceId') workspaceId: string,
        @Param('paymentId') paymentId: number,
        @Param('paymentItemId') paymentItemId: number,
    ) {
        return await this.paymentItemService.deletePaymentItem(workspaceId, Number(paymentId), Number(paymentItemId));
    }
}
