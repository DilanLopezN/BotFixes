import { AuthGuard } from './../auth/guard/auth.guard';
import { ContactService } from './services/contact.service';
import { Controller, Get, Param, Put, Body, UseGuards, Post, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ImportContactDto } from './dto/import-contact-dto';
import { ChannelIdConfig, User } from 'kissbot-core';
import { RolesGuard } from '../users/guards/roles.guard';
import { PredefinedRoles } from './../../common/utils/utils';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { UserDecorator } from '../../decorators/user.decorator';
import { User as UserInterface } from '../../modules/users/interfaces/user.interface';
import * as Sentry from '@sentry/node';

@Controller('workspaces')
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
    async getContact(@Param('contactId') contactId: string, @Param('workspaceId') workspaceId: string) {
        try {
            return await this.contactService.getContact(workspaceId, contactId);
        } catch (error) {
            Sentry.captureEvent({
                message: 'CONTACT-V2-getContact()',
                extra: { error, workspaceId },
            });
        }
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
        try {
            const updateData = {
                name: dto.name,
                email: dto.email,
                ddi: dto.ddi,
                phone: dto.phone,
            };

            return await this.contactService._update(contactId, updateData, workspaceId, authUser);
        } catch (error) {
            Sentry.captureEvent({
                message: 'CONTACT-V2-updateContact()',
                extra: { error, workspaceId },
            });
        }
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
        try {
            const contactData = {
                createdByChannel: dto.createdByChannel,
                name: dto.name,
                phone: dto.phone,
                workspaceId,
                email: dto.email,
                whatsapp: dto.whatsapp,
                ddi: dto?.ddi,
            };

            return await this.contactService._create(contactData, workspaceId);
        } catch (error) {
            Sentry.captureEvent({
                message: 'CONTACT-V2-createContact()',
                extra: { error, workspaceId },
            });
        }
    }

    @ApiParam({ type: String, required: true, name: 'workspaceId' })
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
        try {
            const contacts = dto.map((dto) => ({
                name: dto.name,
                phone: dto.phone,
            }));

            return await this.contactService.importContacts(contacts, workspaceId, ChannelIdConfig.liveagent);
        } catch (error) {
            Sentry.captureEvent({
                message: 'CONTACT-V2-importContacts()',
                extra: { error, workspaceId },
            });
        }
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
        try {
            return await this.contactService.block(workspaceId, contactId, user._id);
        } catch (error) {
            Sentry.captureEvent({
                message: 'CONTACT-V2-block()',
                extra: { error, workspaceId },
            });
        }
    }
}
