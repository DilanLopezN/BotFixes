import { Controller, Post, Body, Put, Param, ValidationPipe, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { UserDecorator } from '../../../decorators/user.decorator';
import { User, ChannelIdConfig } from 'kissbot-core';
import { ContactService } from '../services/contact.service';
import { PredefinedRoles } from '../../../common/utils/utils';
import { User as UserInterface } from '../../../modules/users/interfaces/user.interface';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ImportContactDto } from './dto/import-contact.dto';

@Controller('workspaces/contact-v2')
@UseGuards(AuthGuard)
@ApiTags('Contact')
export class ContactController {
    constructor(private contactService: ContactService) {}

    @ApiParam({ type: String, required: true, name: 'contactId' })
    @Get(':workspaceId/contact/:contactId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(RolesGuard)
    async getContact(@Param('contactId') contactId: string) {
        return await this.contactService.getOne(contactId);
    }

    @ApiParam({ type: String, required: true, name: 'contactId' })
    @Put(':workspaceId/contact/:contactId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(RolesGuard)
    async updateContact(
        @Param('contactId') contactId: string,
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) dto: UpdateContactDto,
        @UserDecorator() authUser: UserInterface,
    ) {
        const updateData = {
            name: dto.name,
            email: dto.email,
            ddi: dto.ddi,
            phone: dto.phone,
        };

        return await this.contactService._update(contactId, updateData, workspaceId, authUser);
    }

    @ApiParam({ type: String, required: true, name: 'workspaceId' })
    @Post(':workspaceId/contact')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(RolesGuard)
    async createContact(@Body(new ValidationPipe()) dto: CreateContactDto, @Param('workspaceId') workspaceId: string) {
        const contactData = {
            createdByChannel: dto.createdByChannel,
            name: dto.name,
            phone: dto.phone,
            ddi: dto.ddi,
            workspaceId,
            email: dto.email,
            whatsapp: dto.whatsapp,
        };

        return await this.contactService._create(contactData, workspaceId);
    }

    @ApiParam({ type: String, required: true, name: 'workspaceId' })
    @ApiBody({ type: [ImportContactDto] })
    @Post(':workspaceId/contact/import')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(RolesGuard)
    async importContacts(
        @Body(new ValidationPipe()) dto: ImportContactDto[],
        @Param('workspaceId') workspaceId: string,
    ) {
        const contacts = dto.map((dto) => ({
            name: dto.name,
            phone: dto.phone,
        }));

        return await this.contactService.importContacts(contacts, workspaceId, ChannelIdConfig.liveagent);
    }

    @ApiParam({ type: String, required: true, name: 'workspaceId' })
    @Post(':workspaceId/contact/:contactId/block')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(RolesGuard)
    async block(
        @Param('workspaceId') workspaceId: string,
        @Param('contactId') contactId: string,
        @UserDecorator() user: User,
    ) {
        return await this.contactService.block(workspaceId, contactId, user._id);
    }
}
