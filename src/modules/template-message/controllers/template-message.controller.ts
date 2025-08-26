import { QueryStringDecorator } from '../../../decorators/queryString.decorator';
import { UserDecorator } from '../../../decorators/user.decorator';
import { castObjectIdToString, PredefinedRoles } from '../../../common/utils/utils';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Param,
    Delete,
    Put,
    ValidationPipe,
    UseInterceptors,
    UploadedFile,
    Query,
} from '@nestjs/common';
import { TemplateMessageService } from '../services/template-message.service';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesGuard } from '../../users/guards/roles.guard';
import { User } from '../../users/interfaces/user.interface';
import { TemplateMessage } from '../interface/template-message.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadingFile } from '../../../common/interfaces/uploading-file.interface';
import { ObjectId } from 'mongoose';
import { TemplateCategory } from '../../channels/gupshup/services/partner-api.service';
import { DefaultCreateTemplateMessageDto } from '../dto/create-default-templates-hsm.dto';

@Controller('workspaces')
@ApiTags('Template Messages')
export class TemplateMessageController {
    constructor(private readonly templateMessageService: TemplateMessageService) {}

    @Post(':workspaceId/template-message')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @UseInterceptors(
        FileInterceptor('attachment', {
            limits: { fileSize: 100000000 }, // 100 MB
        }),
    )
    async createMessageTemplate(
        @Body('template') body: string,
        @UserDecorator() authUser: User,
        @Param('workspaceId') workspaceId: string,
        @Query('allowTemplateCategoryChange') allowTemplateCategoryChange: boolean,
        @UploadedFile() file: UploadingFile,
    ): Promise<TemplateMessage | any> {
        if (typeof allowTemplateCategoryChange === 'string') {
            if (allowTemplateCategoryChange === 'true') {
                allowTemplateCategoryChange = true;
            } else {
                allowTemplateCategoryChange = false;
            }
        }
        const data = JSON.parse(body);
        return await this.templateMessageService._create(
            {
                ...data,
                user: authUser,
                workspaceId,
            },
            allowTemplateCategoryChange,
            file,
        );
    }

    @Get(':workspaceId/templates/:templateId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getTeam(
        @Param('templateId') templateId: string,
        @Param('workspaceId') workspaceId: string,
    ): Promise<TemplateMessage> {
        return await this.templateMessageService.findOne({
            workspaceId,
            _id: templateId,
        });
    }

    @Get(':workspaceId/template-message')
    @UseGuards(AuthGuard)
    @ApiQuery({
        name: 'filter',
        type: String,
        description: 'filter={"$or":[{"key1":"value1"},{"key2":"value2"}]}',
        required: false,
    })
    @ApiQuery({ name: 'skip', type: String, description: 'skip=5', required: false })
    @ApiQuery({ name: 'projection', type: String, description: 'fields=id,url', required: false })
    @ApiQuery({ name: 'sort', type: String, description: 'sort=-points,createdAt', required: false })
    @ApiQuery({ name: 'populate', type: String, description: 'populate=a,b&fields=foo,bar,a.baz', required: false })
    @ApiQuery({ name: 'limit', type: String, description: 'limit=10', required: false })
    getQuery(
        @QueryStringDecorator({
            filters: [],
        })
        query: any,
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
    ) {
        return this.templateMessageService._queryPaginate(query, user, workspaceId);
    }

    @Delete(':workspaceId/template-message/:templateId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async delete(@Param('templateId') templateId: string) {
        return await this.templateMessageService.deleteTemplate(templateId);
    }

    @Put(':workspaceId/template-message/:templateId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @UseInterceptors(
        FileInterceptor('attachment', {
            limits: { fileSize: 100000000 }, // 100 MB
        }),
    )
    async update(
        @UserDecorator() authUser: User,
        @Body('template') body: string,
        @Param('templateId') templateId: string,
        @UploadedFile() file: UploadingFile,
    ): Promise<any> {
        const data = JSON.parse(body);
        return await this.templateMessageService.updateTemplate(
            templateId,
            data,
            castObjectIdToString(authUser._id),
            file,
        );
    }

    @Post(':workspaceId/template-message/:templateId/upload-file')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @UseInterceptors(
        FileInterceptor('attachment', {
            // fileFilter: fileMimetypeFilter(['jpg', 'jpeg', 'png', 'mp4', 'ogg', 'pdf']),
            limits: { fileSize: 20000000 }, // 20 MB
        }),
    )
    async uploadTemplateFile(
        @Param('workspaceId') workspaceId: string,
        @Param('templateId') templateId: string,
        @UploadedFile() file: UploadingFile,
        @UserDecorator() authUser: User,
    ) {
        return await this.templateMessageService.uploadFileTemplate(
            workspaceId,
            castObjectIdToString(authUser._id),
            templateId,
            file,
        );
    }

    @Post(':workspaceId/template-message/:templateId/updateChannel')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateChannelTemplate(
        @Body(new ValidationPipe())
        body: {
            channelConfigId: string;
            category?: TemplateCategory;
        },
        @Param('workspaceId') workspaceId: string,
        @Param('templateId') templateId: string,
        @Query('allowTemplateCategoryChange') allowTemplateCategoryChange: boolean,
        @UserDecorator() authUser: User,
    ): Promise<
        TemplateMessage & {
            _id: ObjectId;
        } & any
    > {
        if (typeof allowTemplateCategoryChange === 'string') {
            if (allowTemplateCategoryChange === 'true') {
                allowTemplateCategoryChange = true;
            } else {
                allowTemplateCategoryChange = false;
            }
        }
        return await this.templateMessageService.createTemplateChannelGupshup(
            workspaceId,
            templateId,
            castObjectIdToString(authUser._id),
            body.channelConfigId,
            body.category,
            allowTemplateCategoryChange,
        );
    }

    @Post(':workspaceId/template-message/:templateId/deleteChannel')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async deleteChannelTemplate(
        @Body(new ValidationPipe())
        body: {
            channelConfigId: string;
        },
        @Param('workspaceId') workspaceId: string,
        @Param('templateId') templateId: string,
        @UserDecorator() authUser: User,
    ): Promise<{ ok: boolean }> {
        return await this.templateMessageService.deleteTemplateChannelGupshup(
            templateId,
            castObjectIdToString(authUser._id),
            body.channelConfigId,
        );
    }

    @Put(':workspaceId/template-message/:templateId/wabaResult')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateTemplateWabaResult(
        @Body() body: TemplateMessage,
        @Param('templateId') templateId: string,
        @UserDecorator() authUser: User,
    ): Promise<any> {
        return await this.templateMessageService.updateTemplateWabaResult(
            templateId,
            castObjectIdToString(authUser._id),
            body,
        );
    }

    @Get(':workspaceId/channel/:channelConfigId/template-message')
    @UseGuards(AuthGuard)
    getTemplateHsmWithoutVariablePersonalized(
        @UserDecorator() user: User,
        @Param('channelConfigId') channelConfigId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        return this.templateMessageService.findTemplateHsmWithoutVariablePersonalized(
            workspaceId,
            channelConfigId,
            user,
        );
    }

    @Post(':workspaceId/template-message/:templateId/change-status')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    changeStatus(
        @Param('workspaceId') workspaceId: string,
        @Param('templateId') templateId: string,
        @UserDecorator() authUser: User,
        @Query('channelConfigId') channelConfigId: string,
    ) {
        return this.templateMessageService.updateStatusToRejectedInWabaResultTemplate(
            workspaceId,
            templateId,
            castObjectIdToString(authUser._id),
            channelConfigId,
        );
    }

    @Post(':workspaceId/template-message/:templateId/sync-status')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_DEV_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    syncStatus(
        @Param('workspaceId') workspaceId: string,
        @Param('templateId') templateId: string,
        @UserDecorator() authUser: User,
        @Query('channelConfigId') channelConfigId: string,
    ) {
        return this.templateMessageService.syncWabaResultByGupshup(
            workspaceId,
            templateId,
            castObjectIdToString(authUser._id),
            channelConfigId,
        );
    }

    @Post(':workspaceId/template-message/create-default-templates')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_DEV_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    createDefaultTemplates(
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() authUser: User,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) data: DefaultCreateTemplateMessageDto,
    ) {
        return this.templateMessageService.createDefaultTemplateHsm(
            workspaceId,
            authUser,
            data.channelConfigId,
            data.clientName,
        );
    }
}
