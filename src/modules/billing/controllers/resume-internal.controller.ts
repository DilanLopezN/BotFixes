import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { AuthGuard } from "./../../auth/guard/auth.guard";
import { RolesGuard } from "./../../users/guards/roles.guard";
import { PaymentCallbackService } from "../services/payment-callback.service";
import { ResumeService } from "../services/resume.service";
import { RolesDecorator } from "./../../users/decorators/roles.decorator";
import { PredefinedRoles } from "./../../../common/utils/utils";
import { WorkspaceChannelResumeService } from "../services/workspace-channel-resume.service";

@Controller('billing')
export class ResumeInternalontroller {
    constructor(
        private readonly resumeService: ResumeService,
        private readonly workspaceChannelResumeService: WorkspaceChannelResumeService,
    ) {}
    @Get('/resume/internal/workspaces')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
    ])
    async getAccountsResume() {
        return await this.resumeService.workspacesResume();
    }

    @Post('/resume/internal/syncMonth')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
    ])
    async syncMonth() {
        return await this.workspaceChannelResumeService.syncMonth()
    }

    @Get('/resume/internal/workspaces/:id')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
    ])
    async getAccountResume(
        @Param('id') id: string
    ) {
        return await this.resumeService.workspaceResume(id);
    }
}