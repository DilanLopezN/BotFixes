import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConversationTraceService } from './services/conversation-trace.service';
import { ConversationTrace } from './interfaces/conversation-trace.interface';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator, RoleData } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { DefaultResponse } from '../../../common/interfaces/default';
import { GetTraceDto, GetTracesByContextDto, GetContextStatisticsDto } from './dto/conversation-trace.dto';

const defaultPermissionRoutes: RoleData[] = [
    PredefinedRoles.SYSTEM_ADMIN,
    PredefinedRoles.SYSTEM_CS_ADMIN,
    PredefinedRoles.SYSTEM_DEV_ADMIN,
    PredefinedRoles.SYSTEM_UX_ADMIN,
];

@ApiTags('Conversation Traces')
@Controller('workspaces/:workspaceId/conversation-traces')
export class ConversationTraceController {
    constructor(private readonly traceService: ConversationTraceService) {}

    @HttpCode(HttpStatus.OK)
    @Post('getTrace')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getTrace(
        @Body(new ValidationPipe()) dto: GetTraceDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<ConversationTrace>> {
        const trace = await this.traceService.getTrace(dto.traceId, workspaceId);

        return {
            data: trace,
        };
    }

    @HttpCode(HttpStatus.OK)
    @Post('getFormattedTrace')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getFormattedTrace(
        @Body(new ValidationPipe()) dto: GetTraceDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<{ formatted: string }>> {
        const trace = await this.traceService.getTrace(dto.traceId, workspaceId);

        return {
            data: {
                formatted: this.traceService.formatTraceForConsole(trace),
            },
        };
    }

    @HttpCode(HttpStatus.OK)
    @Post('getTracesByContext')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getTracesByContext(
        @Body(new ValidationPipe()) dto: GetTracesByContextDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<DefaultResponse<ConversationTrace[]>> {
        const traces = await this.traceService.getTracesByContext(dto.contextId, dto.limit, workspaceId);

        return {
            data: traces,
        };
    }

    @HttpCode(HttpStatus.OK)
    @Post('getContextStatistics')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getContextStatistics(
        @Body(new ValidationPipe()) dto: GetContextStatisticsDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<
        DefaultResponse<{
            totalTraces: number;
            averageDurationMs: number;
            mostUsedProcessor: string;
            errorRate: number;
            processorStats: Array<{
                processorName: string;
                count: number;
                percentage: number;
                averageDurationMs: number;
                errorCount: number;
            }>;
        }>
    > {
        const stats = await this.traceService.getContextStatistics(dto.contextId, workspaceId);

        return {
            data: stats,
        };
    }

    @HttpCode(HttpStatus.OK)
    @Post('getTimeline')
    @RolesDecorator(defaultPermissionRoutes)
    @UseGuards(AuthGuard, RolesGuard)
    async getTimeline(
        @Body(new ValidationPipe()) dto: GetTracesByContextDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<
        DefaultResponse<{
            contextId: string;
            totalConversations: number;
            timeline: Array<{
                timestamp: string;
                userMessage: string;
                response: string;
                responseSource: string;
                durationMs: number;
                hadErrors: boolean;
            }>;
        }>
    > {
        const traces = await this.traceService.getTracesByContext(dto.contextId, dto.limit, workspaceId);

        return {
            data: {
                contextId: dto.contextId,
                totalConversations: traces.length,
                timeline: traces.map((trace) => ({
                    timestamp: trace.startTime,
                    userMessage: trace.userMessage,
                    response: trace.finalResponse || '',
                    responseSource: trace.metadata.responseSource || 'unknown',
                    durationMs: trace.durationMs || 0,
                    hadErrors: trace.metadata.hasErrors,
                })),
            },
        };
    }
}
