import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { SmtReAnalyticsService } from '../services/smt-re-analytics.service';
import { SmtReAnalyticsDto } from '../dto/smt-re-analytics.dto';

@ApiTags('SMT-RE Analytics')
@Controller('workspaces')
@UseGuards(AuthGuard, RolesGuard)
export class SmtReAnalyticsController {
    constructor(private readonly smtReAnalyticsService: SmtReAnalyticsService) {}

    @Get('/:workspaceId/smt-re-analytics/funnel')
    @ApiOperation({ summary: 'Obter analytics de funil SMT-RE' })
    @ApiParam({
        name: 'workspaceId',
        description: 'ID do workspace',
        type: 'string',
    })
    @ApiResponse({
        status: 200,
        description: 'Analytics de funil SMT-RE',
        schema: {
            type: 'object',
            properties: {
                countConversation: { type: 'number' },
                smtReAssumedCount: { type: 'number' },
                smtReConvertedInitialMessage: { type: 'number' },
                smtReConvertedAutomaticMessage: { type: 'number' },
                smtReFinalized: { type: 'number' },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Não autorizado',
    })
    @RolesDecorator([PredefinedRoles.WORKSPACE_ADMIN, PredefinedRoles.SYSTEM_ADMIN])
    async getFunnelAnalytics(@Param('workspaceId') workspaceId: string, @Query() query: SmtReAnalyticsDto) {
        const filter = {
            workspaceId,
            startDate: query.startDate ? new Date(query.startDate) : undefined,
            endDate: query.endDate ? new Date(query.endDate) : undefined,
        };

        return this.smtReAnalyticsService.getFunnelAnalytics(filter);
    }
}
