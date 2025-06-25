import { Controller, Body, Post, Get, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { FlowCategoryService } from '../services/flow-category.service';
import { FlowCategoryDto } from '../dto/flow-category.dto';

@Controller('/channels/whatsapp/flow-category')
@UseGuards(AuthGuard)
export class FlowCategoryController {
    constructor(private readonly flowCategoryService: FlowCategoryService) {}

    @Post('/create')
    @UseGuards(RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    async createFlow(
        @Body(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        )
        body: FlowCategoryDto,
    ) {
        return await this.flowCategoryService.create(body.category);
    }

    @Post('/create-all')
    @UseGuards(RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    async createAllFlowCategory() {
        return await this.flowCategoryService.createAllFlowCategory();
    }

    @Get('')
    @UseGuards(RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    async getAll() {
        return await this.flowCategoryService.getAll();
    }
}
