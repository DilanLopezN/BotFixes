import { Body, Controller, HttpCode, Param, Post, Query, Res, UseGuards, ValidationPipe } from '@nestjs/common';
import { HealthAnalyticsService } from './services/health-analytics.service';
import { Appointment } from 'kissbot-entities';
import { HealthAnalyticsFiltersDto } from './dto/health-analytics-filters.dto';
import { AuthGuard } from './../../auth/guard/auth.guard';
import { RolesGuard } from './../../users/guards/roles.guard';
import { RolesDecorator } from './../../users/decorators/roles.decorator';
import { PredefinedRoles } from './../../../common/utils/utils';
import { UserDecorator } from '../../../decorators/user.decorator';
import { User } from '../../../modules/users/interfaces/user.interface';
import { downloadFileType, typeDownloadEnum } from '../../../common/utils/downloadFileType';

@Controller('HA')
@UseGuards(AuthGuard)
export class HealthAnalyticsController {
    constructor(private readonly healthAnalyticsService: HealthAnalyticsService) {}

    @HttpCode(200)
    @Post('/workspaces/:workspaceId/health-analytics')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getAll(
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() user: User,
        @Body(new ValidationPipe()) dto: HealthAnalyticsFiltersDto,
    ): Promise<Appointment[]> {
        return await this.healthAnalyticsService.getAll(
            {
                tags: dto.tags,
                workspaceId,
                botId: dto.botId,
                channelIds: dto.channelIds,
                endDate: dto.endDate,
                startDate: dto.startDate,
                teamIds: dto.teamIds,
                ommitFields: dto.ommitFields,
            },
            user,
        );
    }

    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @Post('/workspaces/:workspaceId/health-analytics/export')
    async getExportHealthAnalytics(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) dto: HealthAnalyticsFiltersDto,
        @UserDecorator() user: User,
        @Query('downloadType') downloadType: typeDownloadEnum,
        @Res() response,
    ) {
        const data = await this.healthAnalyticsService.exportData(
            {
                tags: dto.tags,
                workspaceId,
                botId: dto.botId,
                channelIds: dto.channelIds,
                endDate: dto.endDate,
                startDate: dto.startDate,
                teamIds: dto.teamIds,
                ommitFields: dto.ommitFields,
                pivotConfig: dto.pivotConfig,
            },
            user,
        );

        return downloadFileType(downloadType, data, response, 'relatorio-agendamentos');
    }
}
