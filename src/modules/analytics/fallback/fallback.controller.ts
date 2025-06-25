import { Controller, Post, Body, Get, Param, Put, UseGuards, Query, Res } from '@nestjs/common';
import { FallbackService } from './services/fallback.service';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from './../../users/guards/roles.guard';
import { AuthGuard } from './../../auth/guard/auth.guard';
import { RolesDecorator } from './../../users/decorators/roles.decorator';
import { PredefinedRoles } from './../../../common/utils/utils';
import { QueryStringDecorator } from './../../../decorators/queryString.decorator';
import { FallbackDto } from './dto/fallback.dto';
import { downloadFileType, typeDownloadEnum } from '../../../common/utils/downloadFileType';

@ApiTags('Fallback')
@Controller('workspaces')
@ApiBearerAuth()
@UseGuards(AuthGuard, RolesGuard)
export class FallbackController {
    constructor(private fallbackService: FallbackService) {}

    @Get(':workspaceId/fallbacks')
    @ApiQuery({ name: 'skip', type: String, description: 'skip=5', required: false })
    @ApiQuery({ name: 'projection', type: String, description: 'fields=id,url', required: false })
    @ApiQuery({ name: 'sort', type: String, description: 'sort=-points,createdAt', required: false })
    @ApiQuery({ name: 'limit', type: String, description: 'limit=10', required: false })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    getQuery(
        @QueryStringDecorator({
            filters: [{ workspaceId: 'workspaceId' }],
        })
        query: any,
        @Param('workspaceId') workspaceId: string,
    ) {
        return this.fallbackService.queryPaginate({ ...query, workspaceId });
    }

    @Post(':workspaceId/fallbacks')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    create(@Body() body: FallbackDto, @Param('workspaceId') workspaceId: string) {
        return this.fallbackService._create({ ...body, workspaceId });
    }

    @Put(':workspaceId/fallbacks/:fallbackId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    update(
        @Body() body: FallbackDto,
        @Param('fallbackId') fallbackId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return this.fallbackService._update(parseInt(fallbackId), body, workspaceId);
    }

    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    @Get(':workspaceId/fallbacks/exportCSV')
    async getFallbackCSV(
        @Param('workspaceId') workspaceId: string,
        @Query('endDate') endDate: string,
        @Query('startDate') startDate: string,
        @Query('downloadType') downloadType: typeDownloadEnum,
        @Res() response,
    ) {
        const result = await this.fallbackService.getFallbackCsv(workspaceId, {
            endDate: parseInt(String(endDate)),
            startDate: parseInt(String(startDate)),
        });

        return downloadFileType(downloadType || typeDownloadEnum.CSV, result, response, 'relatorio-fallback');
    }

    // @Delete(':workspaceId/fallbacks/:fallbackId')
    // @RolesDecorator([
    //     PredefinedRoles.SYSTEM_ADMIN,
    //     PredefinedRoles.SYSTEM_CS_ADMIN,
    //     PredefinedRoles.SYSTEM_UX_ADMIN,
    //     PredefinedRoles.WORKSPACE_ADMIN,
    // ])
    // async delete(
    //     @Param('fallbackId') fallbackId: string,
    //     @Param('workspaceId') workspaceId: string,
    // ) {
    //     return await this.fallbackService.delete(parseInt(fallbackId), workspaceId);
    // }
}
