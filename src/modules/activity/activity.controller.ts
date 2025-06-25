import { User } from './../users/interfaces/user.interface';
import { UserDecorator } from './../../decorators/user.decorator';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { ApiQuery } from '@nestjs/swagger';
import { RolesDecorator } from './../users/decorators/roles.decorator';
import { PredefinedRoles } from './../../common/utils/utils';
import { RolesGuard } from './../users/guards/roles.guard';
import { AuthGuard } from './../auth/guard/auth.guard';
import { ActivityService } from './services/activity.service';
import { Controller, Get, UseGuards, Param, Query, UseInterceptors, Post, ValidationPipe, Body } from '@nestjs/common';
import { ActivitySearchQueryDto } from './dto/activity-search.dto';
import { AudioTranscriptionFeatureFlagGuard } from './guards/audio-transcription-feature-flag.guard';

@Controller('workspaces')
export class ActivityController {
    constructor(
        private readonly activityService: ActivityService,
    ) {}

    @Get(':workspaceId/activities')
    @UseGuards(AuthGuard, RolesGuard)
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
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    getQuery(
        @QueryStringDecorator({
            filters: [],
            limit: 30,
        })
        query: any,
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
    ) {
        return this.activityService._queryPaginate(query, user, workspaceId);
    }

    @Get(':workspaceId/activities/search')
    @ApiQuery({ name: 'skip', type: String, description: 'skip=5', required: false })
    @ApiQuery({ name: 'limit', type: String, description: 'limit=5', required: false })
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    getSearch(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Query(new ValidationPipe()) query: ActivitySearchQueryDto,
    ) {
        const { limit = 25, q, skip = 0 } = query;
        return this.activityService.searchActivities(user, workspaceId, q, limit, skip);
    }

    @Post('/activities/process-redis-acks')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    processRedisSavedAcks() {
        // return this.activityService.processAcksOnRedis();
    }

    @Post('/:workspaceId/activities/audio-transcription')
    @UseGuards(AuthGuard, RolesGuard, AudioTranscriptionFeatureFlagGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    activityAudioTranscription(
        @UserDecorator() user: User,
        @Param('workspaceId') workspaceId: string,
        @Body() data: { activityId: string },
    ) {
        return this.activityService.transformActivityWithAudioTranscription(
            workspaceId,
            data.activityId,
            String(user._id),
        );
    }
}
