import { Body, Controller, Get, Param, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import { CreateRatingSettingDto } from '../dto/rating-setting.dto';
import { feedbackEnum } from '../interfaces/rating.interface';
import { RatingSetting } from '../models/rating-setting.entity';
import { RatingSettingService } from '../services/rating-setting.service';
import { RatingService } from '../services/rating.service';
import { RolesDecorator } from './../../users/decorators/roles.decorator';
import { PredefinedRoles } from './../../../common/utils/utils';
import { AuthGuard } from './../../auth/guard/auth.guard';
import { RolesGuard } from './../../users/guards/roles.guard';
import { downloadFileType, typeDownloadEnum } from '../../../common/utils/downloadFileType';

@Controller('rating')
export class RatingController {
    constructor(
        private readonly ratingSettingService: RatingSettingService,
        private readonly ratingService: RatingService,
    ) {}
    @Post('workspaces/:workspaceId/settings')
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createRatingSetting(
        @Body() body: CreateRatingSettingDto,
        @Param('workspaceId') workspaceId: string,
    ): Promise<void> {
        return await this.ratingSettingService.create({
            ...body,
            workspaceId,
        });
    }

    @Get('workspaces/:workspaceId/settings')
    async getWorkspaceRatingSetting(@Param('workspaceId') workspaceId: string): Promise<RatingSetting> {
        return await this.ratingSettingService.findOneByWorkspaceId(workspaceId);
    }

    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @Put('workspaces/:workspaceId/settings/:settingsId')
    async updateRatingSetting(
        @Body() dto: CreateRatingSettingDto,
        @Param('workspaceId') workspaceId: string,
        @Param('settingsId') settingsId: number,
    ): Promise<void> {
        return await this.ratingSettingService.updateRatingAndFeedbackText(
            {
                feedbackText: dto.feedbackText,
                ratingText: dto.ratingText,
                linkText: dto.linkText,
                workspaceId,
                disableLinkAfterRating: dto.disableLinkAfterRating,
                expiresIn: dto.expiresIn,
                channelCriteria: dto.channelCriteria,
                tagCriteria: dto.tagCriteria,
                teamCriteria: dto.teamCriteria,
                ctaButtonText: dto.ctaButtonText,
                ctaButtonUrl: dto.ctaButtonUrl,
                messageAfterRating: dto.messageAfterRating,
            },
            settingsId,
        );
    }

    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @Get('workspaces/:workspaceId/ratings')
    async getRatings(
        @Param('workspaceId') workspaceId: string,
        @Query('offset') offset: string,
        @Query('limit') limit: string,
        @Query('teamIds') teamIds: string,
        @Query('memberId') memberId: string,
        @Query('endDate') endDate: string,
        @Query('startDate') startDate: string,
        @Query('timezone') timezone: string,
        @Query('value') value: string,
        @Query('tags') tags: string,
        @Query('feedback') feedback: feedbackEnum,
    ): Promise<any> {
        return this.ratingService.getRatingsByWorkspace(workspaceId, {
            endDate,
            startDate,
            timezone,
            limit: parseInt(String(limit)),
            offset: parseInt(String(offset)),
            teamIds: teamIds ? teamIds.split(',') : [],
            memberId: memberId,
            value: parseInt(String(value)),
            tags: tags ? tags.split(',') : [],
            feedback: feedback,
        });
    }

    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.DASHBOARD_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    @Get('/workspaces/:workspaceId/ratings/exportCSV')
    async getRatingCSV(
        @Param('workspaceId') workspaceId: string,
        @Query('teamIds') teamIds: string,
        @Query('memberId') memberId: string,
        @Query('endDate') endDate: string,
        @Query('startDate') startDate: string,
        @Query('timezone') timezone: string,
        @Query('value') value: string,
        @Query('tags') tags: string,
        @Query('feedback') feedback: feedbackEnum,
        @Query('downloadType') downloadType: typeDownloadEnum,
        @Res() response,
    ) {
        const result = await this.ratingService.getRatingCsv(workspaceId, {
            endDate: endDate,
            startDate: startDate,
            timezone,
            teamIds: teamIds ? teamIds.split(',') : [],
            memberId: memberId,
            value: parseInt(String(value)),
            tags: tags ? tags.split(',') : [],
            feedback: feedback,
        });

        return downloadFileType(downloadType, result, response, 'relatorio-avaliacao');
    }
}
