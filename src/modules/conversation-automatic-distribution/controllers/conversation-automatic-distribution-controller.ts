import { Controller, Get, Post, Put, Delete, Param, Body, Query, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiParam, ApiBody, ApiResponse } from '@nestjs/swagger';
import { ConversationAutomaticDistributionService } from '../services/conversation-automatic-distribution.service';
import { DistributionRuleService } from '../services/distribution-rule.service';
import {
    CreateDistributionRuleDto,
    UpdateDistributionRuleDto,
    DistributionRuleResponseDto,
    PaginationQueryDto,
    PaginatedDistributionRulesResponseDto,
} from '../dto/distribution-rule.dto';
import { IDistributionRule } from '../interfaces/distribution-rule.interface';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from './../../../common/utils/utils';

@ApiTags('Conversation Automatic Distribution')
@ApiBearerAuth()
@Controller('conversation-automatic-distribution')
export class ConversationAutomaticDistributionController {
    constructor(
        private readonly conversationAutomaticDistributionService: ConversationAutomaticDistributionService,
        private readonly distributionRuleService: DistributionRuleService,
    ) {}

    // Distribution Rules endpoints
    @Get(':workspaceId/distribution-rule')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiResponse({ type: DistributionRuleResponseDto, status: 200 })
    async getDistributionRule(@Param('workspaceId') workspaceId: string): Promise<IDistributionRule> {
        return await this.distributionRuleService.getDistributionRuleByWorkspace(workspaceId);
    }

    @Get('distribution-rule')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiResponse({ type: PaginatedDistributionRulesResponseDto, status: 200 })
    async getAllDistributionRules(
        @Query(new ValidationPipe()) query: PaginationQueryDto,
    ): Promise<PaginatedDistributionRulesResponseDto> {
        const { skip = 0, limit = 10 } = query;
        const { data, total } = await this.distributionRuleService.getAllDistributionRules(skip, limit);

        return {
            data,
            total,
            skip,
            limit,
        };
    }

    @Post(':workspaceId/distribution-rule')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiBody({ type: CreateDistributionRuleDto })
    @ApiResponse({ type: DistributionRuleResponseDto, status: 201 })
    async createDistributionRule(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) createDto: CreateDistributionRuleDto,
    ): Promise<IDistributionRule> {
        return await this.distributionRuleService.createDistributionRule(workspaceId, createDto);
    }

    @Put(':workspaceId/distribution-rule/:id')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'id', description: 'distribution rule id', type: String, required: true })
    @ApiBody({ type: UpdateDistributionRuleDto })
    @ApiResponse({ type: DistributionRuleResponseDto, status: 200 })
    async updateDistributionRule(
        @Param('workspaceId') workspaceId: string,
        @Param('id') id: string,
        @Body(new ValidationPipe()) updateDto: UpdateDistributionRuleDto,
    ): Promise<IDistributionRule> {
        return await this.distributionRuleService.updateDistributionRule(workspaceId, id, updateDto);
    }

    @Delete(':workspaceId/distribution-rule/:id')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @ApiParam({ name: 'workspaceId', description: 'workspace id', type: String, required: true })
    @ApiParam({ name: 'id', description: 'distribution rule id', type: String, required: true })
    @ApiResponse({ status: 200, description: 'Distribution rule deleted successfully' })
    async deleteDistributionRule(
        @Param('workspaceId') workspaceId: string,
        @Param('id') id: string,
    ): Promise<{ deleted: boolean }> {
        return await this.distributionRuleService.deleteDistributionRule(workspaceId, id);
    }
}
