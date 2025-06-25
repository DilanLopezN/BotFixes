import { Body, Controller, Param, Post, Res, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { ActivityQueryFilter, ConversationQueryFilter } from './interfaces/analytics.interface';
import { ActivityService } from './services/activity.service';
import { ConversationService } from './services/conversation.service';
import { PredefinedRoles } from './../../../common/utils/utils';
import { RolesDecorator } from './../../users/decorators/roles.decorator';
import { RolesGuard } from './../../users/guards/roles.guard';
import { downloadFileType, typeDownloadEnum } from '../../../common/utils/downloadFileType';
import { TimeoutInterceptor } from '../../../common/interceptors/timeout.interceptor';
import { Exceptions } from '../../../modules/auth/exceptions';

@ApiTags('Analytics')
@Controller('workspaces')
@UseGuards(AuthGuard)
export class AnalyticsController {
    constructor(
        private readonly activityV2Service: ActivityService,
        private readonly conversationV2Service: ConversationService,
    ) {}
    @Post(':workspaceId/analytics/activities')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    @UseGuards(RolesGuard)
    @UseInterceptors(new TimeoutInterceptor(120000))
    async getActivities(@Param('workspaceId') workspaceId: string, @Body() queryFilterDto: ActivityQueryFilter) {
        const queryFilter: ActivityQueryFilter = {
            ...queryFilterDto,
            workspaceId,
        };
        return await this.activityV2Service.getActivitiesData(queryFilter);
    }

    @Post(':workspaceId/analytics/conversations')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    @UseGuards(RolesGuard)
    @UseInterceptors(new TimeoutInterceptor(120000))
    async getConversations(@Param('workspaceId') workspaceId: string, @Body() queryFilterDto: ConversationQueryFilter) {
        let queryFilter: ConversationQueryFilter = {
            ...queryFilterDto,
            workspaceId,
        };
        if (queryFilter.dashboardConversationTemplate) {
            queryFilter.dashboardConversationTemplate.workspaceId = workspaceId;
        }
        if (queryFilter.omitInvalidNumber === undefined) {
            queryFilter.omitInvalidNumber = true;
        }
        return await this.conversationV2Service.getConversationData(queryFilter);
    }

    @Post('/:workspaceId/analytics/conversations/user-resume-avg/exportCSV')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @UseInterceptors(new TimeoutInterceptor(120000))
    async getGroupedByUserAvgCsv(
        @Param('workspaceId') workspaceId: string,
        @Body('query') queryFilterDto: ConversationQueryFilter,
        @Body('downloadType') downloadType: typeDownloadEnum,
        @Res() response,
    ) {
        if (queryFilterDto.conversationsWith === 'not_closed') {
            return Exceptions.CANNOT_DOWNLOAD_THE_FILE_WHEN_CONVERSATION_IS_NOT_CLOSED;
        }
        const queryFilter: ConversationQueryFilter = {
            ...queryFilterDto,
            workspaceId,
        };
        if (queryFilter.dashboardConversationTemplate) {
            queryFilter.dashboardConversationTemplate.workspaceId = workspaceId;
        }
        if (queryFilter.omitInvalidNumber === undefined) {
            queryFilter.omitInvalidNumber = true;
        }
        const result = await this.conversationV2Service.getGroupedByUserAvgCsv({
            ...queryFilter,
            workspaceId,
        });

        return downloadFileType(downloadType, result, response, 'relatorio-performance-agentes');
    }
}
