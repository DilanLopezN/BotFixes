import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    Query,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiQuery } from '@nestjs/swagger';
import { PredefinedRoles } from '../../../common/utils/utils';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../../users/decorators/roles.decorator';
import { UpdateCampaignAttributeDto } from '../dto/update-campaign-attribute.dto';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { CampaignFeatureFlagGuard } from '../../active-message/guards/campaign-feature-flag.guard';
import { CampaignAttributeService } from '../services/campaign-attribute.service';
import { CampaignService } from '../services/campaign.service';
import { ContactService } from '../services/contact.service';
import { CampaignContactService } from '../services/campaign-contact.service';
import { ContactAttribute } from '../models/contact-attribute.entity';
import { ContactAttributeService } from '../services/contact-attribute.service';
import { Contact } from '../models/contact.entity';
import * as XLSX from 'xlsx';
import { pick } from 'lodash';
import { fileMimetypeFilter } from '../../../common/file-uploader/file-mimetype-filter';
import * as csv from 'csvtojson';
import { DeleteCampaignContactBatch } from '../dto/delete-campaign-contact-batch.dto';
import { CreateCampaignDto } from '../dto/create-campaign.dto';
import { CreateCampaignAttributeDto } from '../dto/create-campaign-attribute.dto';
import { RolesGuard } from '../../users/guards/roles.guard';

@Controller('workspaces')
export class CampaignController {
    constructor(
        private readonly campaignService: CampaignService,
        private readonly campaignAttributeService: CampaignAttributeService,
        private readonly campaignContactService: CampaignContactService,
        private readonly contactService: ContactService,
        private readonly contactAttributeService: ContactAttributeService,
    ) {}

    @Post('/:workspaceId/campaign')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async createCampaign(@Body() body: CreateCampaignDto, @Param('workspaceId') workspaceId: string) {
        return await this.campaignService.createCampaign({
            ...body,
            workspaceId,
        });
    }

    @Post('/:workspaceId/campaign/:campaignId/clone')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async cloneCampaign(
        @Body() body: CreateCampaignDto,
        @Param('workspaceId') workspaceId: string,
        @Param('campaignId') campaignId: number,
    ) {
        return await this.campaignService.cloneCampaign({
            ...body,
            workspaceId,
            clonedFrom: campaignId,
        });
    }

    @Get('/:workspaceId/campaign')
    @ApiQuery({ name: 'skip', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async getCampaigns(
        @Param('workspaceId') workspaceId: string,
        @Query('limit') limit: string,
        @Query('skip') skip: string,
        @Query('isTest') isTest: boolean,
    ) {
        const isTestBoolean = typeof isTest == 'string' ? (isTest === 'true' ? true : false) : isTest;
        return await this.campaignService.getCampaignByWorkspace(workspaceId, {
            skip: Number(skip || 0),
            limit: Number(limit || 4),
            isTest: isTestBoolean,
        });
    }

    @Get('/:workspaceId/campaign/:campaignId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async getOneCampaign(@Param('workspaceId') workspaceId: string, @Param('campaignId') campaignId: number) {
        return await this.campaignService.getCampaignById(campaignId);
    }

    @Post('/:workspaceId/campaign/:campaignId/reprocces-contact')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async reprocessContacts(@Param('campaignId') campaignId: number) {
        return await this.campaignContactService.processCampaignContact(campaignId);
    }

    @Put('/:workspaceId/campaign/:campaignId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async updateCampaign(
        @Body() body: UpdateCampaignDto,
        @Param('campaignId') campaignId: number,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.campaignService.updateCampaign({
            ...body,
            id: campaignId,
            workspaceId,
        });
    }

    @Delete(':workspaceId/campaign/:campaignId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async deleteCampaign(@Param('campaignId') campaignId: number, @Param('workspaceId') workspaceId: string) {
        return await this.campaignService.deleteCampaign(workspaceId, campaignId);
    }

    @Post('/:workspaceId/campaign/:campaignId/attribute')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async createCampaignAttribute(@Body() body: CreateCampaignAttributeDto, @Param('campaignId') campaignId: number) {
        return await this.campaignAttributeService.createAttribute({
            ...body,
            campaignId,
        });
    }

    @Put('/:workspaceId/campaign/:campaignId/attribute/:attributeId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async updateCampaignAttribute(
        @Body() body: UpdateCampaignAttributeDto,
        @Param('campaignId') campaignId: number,
        @Param('workspaceId') workspaceId: string,
        @Param('attributeId') attributeId: number,
    ) {
        await this.campaignService.canUpdateCampaign(campaignId);
        return await this.campaignAttributeService.updateCampaignAttribute({
            ...body,
            id: attributeId,
            campaignId,
        });
    }

    @Delete(':workspaceId/campaign/:campaignId/attribute/:attributeId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async deleteCampaignAttribute(
        @Param('campaignId') campaignId: number,
        @Param('workspaceId') workspaceId: string,
        @Param('attributeId') attributeId: number,
    ) {
        await this.campaignService.canUpdateCampaign(campaignId);
        return await this.campaignAttributeService.deleteCampaignAttribute(campaignId, attributeId);
    }

    @Post('/:workspaceId/campaign/:campaignId/start')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async startCampaign(@Param('campaignId') campaignId: number) {
        return await this.campaignService.startCampaign(campaignId);
    }

    @Post('/:workspaceId/campaign/:campaignId/pause')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async pauseCampaign(@Param('campaignId') campaignId: number, @Param('workspaceId') workspaceId: string) {
        return await this.campaignService.pauseCampaign(workspaceId, campaignId);
    }

    @Post(':workspaceId/campaign/:campaignId/contact-batch')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            fileFilter: fileMimetypeFilter(['csv', 'xlsx']),
            limits: {
                fileSize: 1000000,
            },
        }),
    )
    async createCampaignContactBatch(
        @UploadedFile() file: any,
        @Param('campaignId') campaignId: number,
        @Param('workspaceId') workspaceId: string,
    ) {
        await this.campaignService.canUpdateCampaign(campaignId);

        const readedData = XLSX.read(file.buffer, { type: 'buffer' });
        const wsname = readedData.SheetNames[0];
        const ws = readedData.Sheets[wsname];

        const dataParse: string = XLSX.utils.sheet_to_csv(ws);

        let defaultColumns = ['name', 'phone'];

        const attr = await this.campaignAttributeService.getAttributesByCampaign(campaignId);

        const columnsToValidate = [...attr.map((item) => item.name), ...defaultColumns];

        let count = 0;

        const headers = dataParse.split('\n')?.[0]?.split(',');

        for (const column of columnsToValidate) {
            const finded = (headers || []).find((header) => header == column);
            if (!finded) {
                throw new BadRequestException(
                    { error: 'CREATE_CAMPAIGN_CONTACT_BATCH_INVALID_FIELD', column: column },
                    `Invalid CSV header. missing field ${column}`,
                );
            }
        }

        csv({ delimiter: 'auto', flatKeys: true })
            .fromString(dataParse)
            .subscribe(
                (item) => {
                    return new Promise((resolve, reject) => {
                        if (count > 200) {
                            resolve();
                        } else {
                            if (item.name && item.phone) {
                                const sanitizedItem = {
                                    ...(pick(item, columnsToValidate) as any),
                                    phone: item.phone?.replace ? item.phone?.replace(/\D/g, '') : item.phone,
                                };
                                this.campaignContactService.saveContactToProcessing({
                                    ...sanitizedItem,
                                    workspaceId,
                                    campaignId,
                                });
                            }
                            count++;
                            resolve();
                        }
                    });
                },
                (e) => console.log(e),
                () => {
                    this.campaignContactService.processCampaignContact(campaignId);
                },
            );
    }

    @Get('/:workspaceId/campaign/:campaignId/attribute')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getCampaignAttributes(@Param('campaignId') campaignId: number) {
        return await this.campaignAttributeService.getAttributesByCampaign(campaignId);
    }

    @Get('/:workspaceId/campaign/:campaignId/contact')
    @ApiQuery({ name: 'skip', required: false })
    @ApiQuery({ name: 'limit', required: false })
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async getContacts(
        @Param('workspaceId') workspaceId: string,
        @Param('campaignId') campaignId: number,
        @Query('limit') limit: string,
        @Query('skip') skip: string,
    ) {
        return await this.campaignContactService.getCampaignContacts(
            campaignId,
            Number(skip || 0),
            Number(limit || 10),
        );
    }

    @Delete(':workspaceId/campaign/:campaignId/contact/:contactId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async deleteCampaignContact(
        @Param('campaignId') campaignId: number,
        @Param('workspaceId') workspaceId: string,
        @Param('contactId') contactId: number,
    ) {
        await this.campaignService.canUpdateCampaign(campaignId);

        return await this.campaignContactService.deleteCampaignContact(workspaceId, campaignId, contactId);
    }

    @Post(':workspaceId/campaign/:campaignId/contact/delete-batch')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async deleteCampaignContactBatch(
        @Param('campaignId') campaignId: number,
        @Param('workspaceId') workspaceId: string,
        @Body() body: DeleteCampaignContactBatch,
    ) {
        await this.campaignService.canUpdateCampaign(campaignId);

        return await this.campaignContactService.deleteCampaignContactBatch(
            workspaceId,
            campaignId,
            body.contactIds,
            body.deleteAll,
        );
    }

    @Put('/:workspaceId/campaign/:campaignId/contact/:contactId/contact_attribute/:contactAttributeId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async updateContactAttribute(
        @Body() body: ContactAttribute,
        @Param('campaignId') campaignId: number,
        @Param('workspaceId') workspaceId: string,
        @Param('contactId') contactId: number,
        @Param('contactAttributeId') contacAttributetId: number,
    ) {
        await this.campaignService.canUpdateCampaign(campaignId);

        return await this.contactAttributeService.updateContactAttribute(workspaceId, campaignId, {
            ...body,
            contactId: contactId,
            id: contacAttributetId,
        });
    }

    @Post('/:workspaceId/campaign/:campaignId/contact/:contactId/contact_attribute')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async createContactAttribute(
        @Body() body: ContactAttribute,
        @Param('campaignId') campaignId: number,
        @Param('workspaceId') workspaceId: string,
        @Param('contactId') contactId: number,
    ) {
        return await this.contactAttributeService.createContactAttribute(workspaceId, campaignId, {
            ...body,
            contactId: contactId,
        });
    }

    @Put('/:workspaceId/campaign/:campaignId/contact_name/:contactId')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @UseGuards(AuthGuard, RolesGuard, CampaignFeatureFlagGuard)
    async updateContactName(
        @Body() body: Contact,
        @Param('campaignId') campaignId: number,
        @Param('workspaceId') workspaceId: string,
        @Param('contactId') contactId: number,
    ) {
        await this.campaignService.canUpdateCampaign(campaignId);

        return await this.contactService.updateContactName(workspaceId, campaignId, {
            ...body,
            id: contactId,
            workspaceId: workspaceId,
        });
    }

    @Post('/:workspaceId/campaign/:campaignId/update-isTest')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    @UseGuards(AuthGuard, RolesGuard)
    async updateCampaignIstest(
        @Body() body: { isTest: boolean },
        @Param('campaignId') campaignId: number,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.campaignService.updateCampaignIsTest(workspaceId, campaignId, body.isTest);
    }
}
