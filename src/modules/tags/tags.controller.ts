import { ApiParam, ApiTags, ApiResponse } from '@nestjs/swagger';
import {
    Controller,
    Get,
    Param,
    Post,
    ValidationPipe,
    Body,
    Delete,
    Put,
    UseGuards,
    BadGatewayException,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagDto } from './dto/tags.dto';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { AuthGuard } from '../auth/guard/auth.guard';

@UseGuards(AuthGuard)
@Controller('workspaces')
@ApiTags('Workspaces')
export class TagsController {
    constructor(private readonly tagsService: TagsService) {}

    @ApiParam({ type: String, required: true, name: 'tagId' })
    @ApiParam({ type: String, required: true, name: 'workspaceId' })
    @Get(':workspaceId/tags/:tagId')
    async getTag(@Param('tagId') tagId: string, @Param('workspaceId') workspaceId: string) {
        return await this.tagsService.findOne({
            workspaceId,
            _id: tagId,
        });
    }

    @ApiParam({ type: String, required: true, name: 'contactagIdtId' })
    @ApiResponse({ status: 200, isArray: true, type: TagDto })
    @Get(':workspaceId/tags')
    getQuery(
        @QueryStringDecorator({
            filters: [],
        })
        query: any,
        @Param('workspaceId') workspaceId: string,
    ) {
        return this.tagsService._queryPaginate(workspaceId, query);
    }
    async getTags(@Param('workspaceId') workspaceId: string) {
        return await this.tagsService.getAll({
            workspaceId,
        });
    }

    @ApiParam({ type: String, required: true, name: 'tagId' })
    @ApiResponse({ status: 200, isArray: false, type: TagDto })
    @Post(':workspaceId/tags')
    async createTag(@Body(new ValidationPipe()) tagDto: TagDto, @Param('workspaceId') workspaceId: string) {
        if (tagDto.name.startsWith('@bot') || tagDto.name.startsWith('@sys')) {
            throw new BadGatewayException('Invalid tag name');
        }
        return await this.tagsService._create(workspaceId, tagDto);
    }

    @ApiParam({ type: String, required: true, name: 'tagId' })
    @ApiResponse({ status: 200, isArray: false, description: '{ deleted: true }' })
    @Delete(':workspaceId/tags/:tagId')
    async deleteTag(@Param('tagId') tagId: string) {
        return await this.tagsService.delete(tagId);
    }

    @ApiParam({ type: String, required: true, name: 'tagId' })
    @ApiResponse({ status: 200, isArray: false, description: '{ deleted: true }' })
    @Put(':workspaceId/tags/:tagId')
    async updateTag(
        @Body(new ValidationPipe()) tagDto: TagDto,
        @Param('tagId') tagId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        if (tagDto.name.startsWith('@bot') || tagDto.name.startsWith('@sys')) {
            throw new BadGatewayException('Invalid tag name');
        }
        return await this.tagsService._update(tagDto, tagId, workspaceId);
    }
}
