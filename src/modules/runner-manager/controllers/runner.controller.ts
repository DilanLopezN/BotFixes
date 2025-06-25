import { Body, Controller, Get, Param, Post, Put, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { UserDecorator } from '../../../decorators/user.decorator';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { User } from 'kissbot-core';
import { RunnerService } from '../services/runner.service';
import { CreateRunnerDto, UpdateRunnerDto } from '../dto/runner.dto';
import { ServiceRunnerService } from '../services/service-runner.service';
import { CreateServiceDto, UpdateServiceDto } from '../dto/service.dto';
import { ExternalDataService } from '../services/external-data.service';

@Controller('runner')
export class RunnerController {
    constructor(
        private readonly runnerService: RunnerService,
        private readonly serviceRunnerService: ServiceRunnerService,
        private readonly externalDataService: ExternalDataService,
    ) {}

    @Get(':runnerId/service/:serviceId/getContainerLogs')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async getContainerLogs(
        @UserDecorator() user: User,
        @Param('runnerId') runnerId: number,
        @Param('serviceId') serviceId: number,
        @Query('logSize') logSize: number,
    ) {
        return await this.runnerService.getContainerLogs(runnerId, serviceId, logSize);
    }

    @Post(':runnerId/service/:serviceId/doSql')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async doSql(
        @Body(new ValidationPipe()) body: { sql: string },
        @UserDecorator() user: User,
        @Param('runnerId') runnerId: number,
        @Param('serviceId') serviceId: number,
    ) {
        return await this.runnerService.doSql(runnerId, serviceId, body.sql);
    }

    @Post(':runnerId/service/:serviceId/doDeploy')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async doDeploy(
        @Body(new ValidationPipe()) body: { tag: string },
        @UserDecorator() user: User,
        @Param('runnerId') runnerId: number,
        @Param('serviceId') serviceId: number,
    ) {
        return await this.runnerService.doDeploy(runnerId, serviceId, body.tag);
    }

    @Post('workspaces/:workspaceId/create-runner')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async createRunner(
        @Body(new ValidationPipe()) body: CreateRunnerDto & { services: CreateServiceDto[] },
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.runnerService.create({ name: body.name, workspaceId, services: body.services });
    }

    @Put('workspaces/:workspaceId/runner/:runnerId/update-runner')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async updateRunner(
        @Body(new ValidationPipe()) body: UpdateRunnerDto,
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Param('runnerId') runnerId: number,
    ) {
        return await this.runnerService.update(runnerId, {
            ...body,
            id: runnerId,
            workspaceId,
        });
    }

    @Post('workspaces/:workspaceId/runner/:runnerId/create-service')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async createService(
        @Body(new ValidationPipe()) body: CreateServiceDto,
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Param('runnerId') runnerId: number,
    ) {
        return await this.serviceRunnerService.create({
            workspaceId,
            runnerId,
            env: body.env,
            integrationId: body.integrationId,
        });
    }

    @Put('workspaces/:workspaceId/runner/:runnerId/service/:serviceId/update-service')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async updateService(
        @Body(new ValidationPipe()) body: UpdateServiceDto,
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Param('runnerId') runnerId: number,
        @Param('serviceId') serviceId: number,
    ) {
        return await this.serviceRunnerService.update(runnerId, serviceId, body.env);
    }

    @Get('list-runners')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async listRunners(@Query('search') search?: string) {
        return await this.runnerService.listRunners(search);
    }

    @Get(':runnerId/get-runner')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async getRunnerById(@Param('runnerId') runnerId: number) {
        return await this.runnerService.getRunnerById(runnerId);
    }

    @Get('/list-tags')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async listRepositoryTags() {
        return await this.externalDataService.listRepositoryTagsOnDockerHub();
    }

    @Get(':runnerId/service/:serviceId/ping-runner')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async runnerPing(@Param('runnerId') runnerId: number, @Param('serviceId') serviceId: number) {
        return await this.runnerService.runnerPing(runnerId, serviceId);
    }
}
