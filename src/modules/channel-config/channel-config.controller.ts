import { AuthGuard } from './../auth/guard/auth.guard';
import {
    Controller,
    Get,
    Param,
    Post,
    Body,
    Put,
    Delete,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ChannelConfigService } from './channel-config.service';
import { ChannelConfigDto, CreateEventRequest } from './dto/channel-config.dto';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { QueryStringFilter } from './../../common/abstractions/queryStringFilter.interface';
import { UserDecorator } from './../../decorators/user.decorator';
import { User } from '../users/interfaces/user.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadingFile } from '../../common/interfaces/uploading-file.interface';
import { RolesGuard } from '../users/guards/roles.guard';
import { RolesDecorator } from '../users/decorators/roles.decorator';
import { PredefinedRoles } from '../../common/utils/utils';
import { AuthApiGuard } from '../auth/guard/auth-api.guard';

@ApiTags('Channel')
@Controller('channel-configs')
export class ChannelConfigController {
    constructor(private readonly channelService: ChannelConfigService) {}

    @Get(':channelConfigId')
    @UseGuards(AuthGuard)
    @ApiParam({ name: 'channelConfigId', type: String, required: true })
    @ApiResponse({ status: 200, type: ChannelConfigDto, isArray: false })
    getChannelById(@Param('channelConfigId') channelConfigId: string) {
        return this.channelService.getOneBtIdOrToken(channelConfigId);
    }

    @Get(':channelConfigId/webchat')
    @ApiParam({ name: 'channelConfigId', type: String, required: true })
    @ApiResponse({ status: 200, type: ChannelConfigDto, isArray: false })
    getWebchatChannelById(@Param('channelConfigId') channelConfigId: string) {
        return this.channelService.getPublicWebchatChannelConfig(channelConfigId);
    }

    @Get('')
    @UseGuards(AuthGuard)
    @ApiQuery({ name: 'botId', type: String, required: true })
    @ApiResponse({ status: 200, isArray: true, type: ChannelConfigDto })
    async getChannel(
        @QueryStringDecorator({
            filters: [],
        })
        query: QueryStringFilter,
        @UserDecorator() user: User,
    ) {
        return await this.channelService._queryPaginate(query, user);
    }

    @Post('')
    @UseGuards(AuthGuard)
    @ApiResponse({ status: 200, type: ChannelConfigDto, isArray: false })
    async createChannel(@Body() channelConfig: ChannelConfigDto) {
        return await this.channelService._create(channelConfig);
    }

    @Post('/:channelConfigId/events')
    @UseGuards(AuthGuard)
    @ApiResponse({ status: 200, type: undefined })
    async createChannelEvent(@Body() body: CreateEventRequest, @Param('channelConfigId') channelConfigId: string) {
        return await this.channelService.sendEventFromController(channelConfigId, body);
    }

    @Put(':channelConfigId')
    @ApiParam({ name: 'channelConfigId', type: String, required: true })
    @ApiResponse({ status: 200, type: ChannelConfigDto, isArray: false })
    @UseGuards(AuthGuard)
    async updateChannel(@Body() channelConfig: ChannelConfigDto, @Param('channelConfigId') channelConfigId: string) {
        return await this.channelService._update(channelConfigId, channelConfig);
    }

    @Post('/:channelConfigId/avatar')
    @ApiParam({ name: 'channelConfigId', type: String })
    @UseInterceptors(FileInterceptor('attachment', { limits: { fileSize: 2000000 } }))
    create(@Param('channelConfigId') channelConfigId: string, @UploadedFile() file: UploadingFile) {
        this.validateFile(file);
        return this.channelService.updateAvatar(channelConfigId, file);
    }

    @Delete(':channelConfigId')
    @ApiParam({ name: 'channelConfigId', type: String, required: true })
    @UseGuards(AuthGuard)
    async deleteChannel(@Param('channelConfigId') channelConfigId: string, @UserDecorator() user: User) {
        return await this.channelService._delete(channelConfigId, user);
    }

    private validateFile(file: UploadingFile): void {
        if (!file) {
            throw new BadRequestException('Missing file!');
        }
    }

    @Post('/set-default-expiration-emulator')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(AuthApiGuard, RolesGuard)
    setDefaultExpirationInEmulator() {
        return this.channelService.setDefaultExpirationInEmulator();
    }
}
