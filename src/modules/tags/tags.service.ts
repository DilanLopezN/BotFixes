import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { MongooseAbstractionService } from '../../common/abstractions/mongooseAbstractionService.service';
import { Tags } from './interface/tags.interface';
import { Model } from 'mongoose';
import { TagDto } from './dto/tags.dto';
import { Exceptions } from '../../modules/auth/exceptions';
import { TagsModel } from './schema/tags.schema';
import { CacheService } from '../_core/cache/cache.service';

@Injectable()
export class TagsService extends MongooseAbstractionService<Tags> {
    constructor(@InjectModel('Tags') protected readonly model: Model<Tags>, readonly cacheService: CacheService) {
        super(model, cacheService, null);
    }

    getSearchFilter(search: any) {
        if (
            String(search)
                .split('')
                .every((char: string) => char === '.')
        ) {
            search = `[${search}]`;
        }

        return {
            $or: [{ name: { $regex: `.*${search}.*`, $options: 'i' } }],
        };
    }
    getEventsData() {}

    public async _create(workspaceId: string, tagDto: TagDto) {
        const existTag = !!(await this.findOne({
            workspaceId,
            name: tagDto.name,
            deletedAt: null,
        }));

        if (existTag) throw Exceptions.DUPLICATED_TAG;

        const tagModel = new TagsModel({
            ...tagDto,
            workspaceId,
        });

        return await this.create(tagModel);
    }

    public async _update(tagDto: TagDto, tagId: string, workspaceId: string) {
        const tagsModel = new TagsModel({
            ...tagDto,
            workspaceId,
        });
        return await this.update(tagId, tagsModel);
    }

    public async _queryPaginate(workspaceId: string, query?: any) {
        if (!query.filter.$and) {
            query.filter.$and = [];
        }

        query.filter.$and.push({ workspaceId });
        return await this.queryPaginate(query);
    }

    async getWorkspaceTags(workspaceId: string) {
        return await this.model.find({ workspaceId });
    }
}
