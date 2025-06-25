import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Controller, Post, Body, Put, ValidationPipe, Get, Req, UseGuards } from '@nestjs/common';
import { OrganizationSettingsService } from './organization-settings.service';
import { OrganizationSettingsDto } from './dto/organization-settings.dto';
import { Request } from 'express';
import { AuthGuard } from './../auth/guard/auth.guard';
import { RolesGuard } from '../../modules/users/guards/roles.guard';
import { RolesDecorator } from '../../modules/users/decorators/roles.decorator';
import { PredefinedRoles } from './../../common/utils/utils';

@Controller('organization-settings')
@ApiBearerAuth()
@ApiTags('OrganizationSettings')
export class OrganizationSettingsController {
    constructor(private organizationSettings: OrganizationSettingsService) {}

    @Post()
    @UseGuards(AuthGuard, RolesGuard)
    @ApiResponse({ type: OrganizationSettingsDto, isArray: false, status: 200 })
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async createSettings(@Body(new ValidationPipe()) settingsDto: OrganizationSettingsDto) {
        return await this.organizationSettings._create(settingsDto);
    }

    @Get()
    @ApiResponse({ type: OrganizationSettingsDto, isArray: false, status: 200 })
    async settings(@Req() req: Request) {
        return await this.organizationSettings.getSettings(req.hostname);
    }

    @Put()
    @ApiResponse({ type: OrganizationSettingsDto, isArray: false, status: 200 })
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    async update(@Req() req: Request, @Body(new ValidationPipe()) settingsDto: OrganizationSettingsDto) {
        return await this.organizationSettings._update(settingsDto, req.hostname);
    }
}
