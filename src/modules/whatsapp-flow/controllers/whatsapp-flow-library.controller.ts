import { Controller, Body, Post, Param, Get, UseGuards, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { WhatsappFlowLibraryService } from '../services/whatsapp-flow-library.service';
import { WhatsappFlowLibraryDto } from '../dto/whatsapp-flow-library.dto';
import { DefaultResponse } from '../../../common/interfaces/default';
import { WhatsappFlowLibrary } from '../models/whatsapp-flow-library.entity';
import { FilterWhatsappFlowLibraryDto } from '../dto/filter-whatsapp-flow-library.dto';

@Controller('/channels/whatsapp/flow-library')
@UseGuards(AuthGuard)
export class WhatsappFlowLibraryController {
    constructor(private readonly whatsappFlowLibraryService: WhatsappFlowLibraryService) {}

    @Post('/create')
    @UseGuards(RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    async createFlowLibrary(
        @Body(
            new ValidationPipe({
                transform: true,
            }),
        )
        body: WhatsappFlowLibraryDto,
    ) {
        return await this.whatsappFlowLibraryService.create(body);
    }

    @Post('/update/:flowLibraryId')
    @UseGuards(RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    async updateFlowLibrary(
        @Param('flowLibraryId', ParseIntPipe) id: number,
        @Body(
            new ValidationPipe({
                transform: true,
            }),
        )
        body: WhatsappFlowLibraryDto,
    ) {
        return await this.whatsappFlowLibraryService.update(id, body);
    }

    @Get('')
    @UseGuards(RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    async getFlowLibrarys() {
        return await this.whatsappFlowLibraryService.getAll();
    }

    @Get('/:flowLibraryId')
    @UseGuards(RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    async getFlowLibraryById(@Param('flowLibraryId', ParseIntPipe) id: number) {
        return await this.whatsappFlowLibraryService.getWhatsappFlowLibraryById(id);
    }

    @Post('workspaces/:workspaceId')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getAllFlowLibraryWithVinculedFlows(
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) filter?: FilterWhatsappFlowLibraryDto,
    ): Promise<DefaultResponse<WhatsappFlowLibrary[]>> {
        return await this.whatsappFlowLibraryService.getAllFlowLibraryWithVinculedFlows(workspaceId, filter);
    }

    @Get('workspaces/:workspaceId/id/:flowLibraryId')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getWhatsappFlowLibraryByIdAndworkspaceId(
        @Param('workspaceId') workspaceId: string,
        @Param('flowLibraryId', ParseIntPipe) id: number,
    ): Promise<DefaultResponse<WhatsappFlowLibrary>> {
        return await this.whatsappFlowLibraryService.getWhatsappFlowLibraryByIdAndworkspaceId(workspaceId, id);
    }
}
