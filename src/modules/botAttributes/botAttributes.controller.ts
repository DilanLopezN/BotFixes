import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { BotAttributesModel } from './schemas/botAttribute.schema';
import { BotAttributesService } from './botAttributes.service';
import { BotAttributesDto } from './dtos/botAttributes.dto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { RolesGuard } from '../users/guards/roles.guard';
import { PredefinedRoles } from './../../common/utils/utils';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { QueryStringFilter } from './../../common/abstractions/queryStringFilter.interface';

@ApiTags('BotAttributes')
@Controller('workspaces')
export class BotAttributesController {
    constructor(private readonly botAttributesService: BotAttributesService) {}

    @ApiParam({ name: 'botId', type: String })
    @ApiParam({ name: 'workspaceId', type: String })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @Post(':workspaceId/bots/:botId/attributes')
    async save(@Body() botAttributeDto: BotAttributesDto, @Param('botId') botId) {
        Object.assign(botAttributeDto, { botId });
        const newBotAttribute = new BotAttributesModel(botAttributeDto as any);
        return await this.botAttributesService._create(newBotAttribute, botId);
    }

    @ApiParam({ name: 'botId', type: String })
    @ApiParam({ name: 'workspaceId', type: String })
    @ApiParam({ name: 'botAttributeId', type: String })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @Put(':workspaceId/bots/:botId/attributes/:botAttributeId')
    async update(
        @Body() botAttributeDto: BotAttributesDto,
        @Param('botId') botId: string,
        @Param('botAttributeId') botAttributeId: string,
    ) {
        Object.assign(botAttributeDto, { botId });
        const botAttributeUpdate = new BotAttributesModel(botAttributeDto as any);
        return await this.botAttributesService.update(botAttributeId, botAttributeUpdate);
    }

    @ApiParam({ name: 'workspaceId', type: String })
    @ApiParam({ name: 'botId', type: String })
    @ApiParam({ name: 'botAttributeId', type: String })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @Delete(':workspaceId/bots/:botId/attributes/:botAttributeId')
    async delete(@Param('botAttributeId') botAttributeId: string) {
        return await this.botAttributesService._delete(botAttributeId);
    }

    @ApiParam({ name: 'workspaceId', type: String })
    @ApiParam({ name: 'botId', type: String })
    @ApiParam({ name: 'botAttributeId', type: String })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @Get(':workspaceId/bots/:botId/attributes/:botAttributeId')
    async getOne(@Param('organizationId') organizationId: string) {
        return await this.botAttributesService.getOne(organizationId);
    }

    @ApiParam({ name: 'workspaceId', type: String })
    @ApiParam({ name: 'botId', type: String })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @Get(':workspaceId/bots/:botId/attributes')
    getAll(
        @QueryStringDecorator({
            filters: [{ botId: 'botId' }],
        })
        query: QueryStringFilter,
        @Param('botId') botId,
        @Param('workspaceId') workspaceId,
    ) {
        return this.botAttributesService._getAll(botId, query, workspaceId);
    }

    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @Post(':workspaceId/bots/:botId/attributes/transform')
    transform(@Param('botId') botId: string) {
        return this.botAttributesService.transform(botId);
    }
}
