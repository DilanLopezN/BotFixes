import { Body, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Controller, Query } from '@nestjs/common';
import { AuthGuard } from './../../auth/guard/auth.guard';
import { RolesGuard } from './../../users/guards/roles.guard';
import { PaymentService } from '../services/payment.service';
import { RolesDecorator } from './../../users/decorators/roles.decorator';
import { PredefinedRoles } from './../../../common/utils/utils';
import { WorkspaceChannelResumeService } from '../services/workspace-channel-resume.service';
import { ChannelIdConfig } from 'kissbot-core';

@Controller('workspaces')
export class CustomerBillingController {
    constructor(
        private readonly paymentService: PaymentService,
        private readonly workspaceChannelResumeService: WorkspaceChannelResumeService,
    ) {}

    @Get(':workspaceId/payments')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_FARMER_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
    ])
    async getPayments(@Param('workspaceId') workspaceId: string) {
        return await this.paymentService.getCustomerPayments(workspaceId);
    }

    @Post(':workspaceId/generateChannelResume')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.WORKSPACE_ADMIN])
    async generateChannelResume(
        @Param('workspaceId') workspaceId: string,
        @Body('month') month: string,
        @Body('channel') channel: string,
    ) {
        return await this.workspaceChannelResumeService.generateChannelResume(
            workspaceId,
            new Date(month),
            channel as ChannelIdConfig,
        );
    }
}
