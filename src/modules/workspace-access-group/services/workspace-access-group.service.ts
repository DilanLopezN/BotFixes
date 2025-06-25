import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, ObjectId, Types } from 'mongoose';
import { MongooseAbstractionService } from './../../../common/abstractions/mongooseAbstractionService.service';
import { CacheService } from './../../_core/cache/cache.service';
import { WorkspaceAccessControl } from '../interfaces/workspace-access-control.interface';

@Injectable()
export class WorkspaceAccessGroupService extends MongooseAbstractionService<WorkspaceAccessControl & Document> {
    constructor(
        @InjectModel('WorkspaceAccessControl') protected readonly model: Model<WorkspaceAccessControl & Document>,
        readonly cacheService: CacheService,
    ) {
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
    getEventsData() { }

    async createGroup(workspaceAccessControl: WorkspaceAccessControl) {
        try {
            return await this.model.create(workspaceAccessControl);
        } catch (e) {
            console.log('WorkspaceAccessGroupService.createGroup', e);
            throw e;
        }
    }

    async updateGroupByWorkspaceIdAndId(
        id: Types.ObjectId,
        workspaceId: Types.ObjectId,
        workspaceAccessControl: Partial<WorkspaceAccessControl>,
    ) {
        try {
            delete workspaceAccessControl.workspaceId;
            return await this.model.updateOne({ _id: id, workspaceId }, workspaceAccessControl);
        } catch (e) {
            console.log('WorkspaceAccessGroupService.updateGroupByWorkspaceIdAndId', e);
            throw e;
        }
    }

    public async _queryPaginate(workspaceId: string, query?: any) {
        if (!query.filter.$and) {
            query.filter.$and = [];
        }

        query.filter.$and.push({ workspaceId });
        return await this.queryPaginate(query);
    }

    async findByWorkspaceId(workspaceId: string) {
        try {
            return await this.model.find({
                deletedAt: { $eq: null },
                workspaceId,
            });
        } catch (e) {
            console.log('WorkspaceAccessGroupService.findByWorkspaceId', e);
            throw e;
        }
    }

    async findInWorkspaceListAndMatchUser(workspaceIds: string[], userId: string) {
        try {
            return await this.model.find({
                deletedAt: { $eq: null },
                workspaceId: { $in: workspaceIds },
                'accessSettings.userList': { $in: [userId] }
            });
        } catch (e) {
            console.log('WorkspaceAccessGroupService.findByWorkspaceId', e);
            throw e;
        }
    }

    async findByWorkspaceIdAndMatchUser(workspaceId: ObjectId, userId: ObjectId) {
        try {
            return await this.model.find({
                deletedAt: { $eq: null },
                workspaceId,
                'accessSettings.userList': { $in: [userId] }
            });
        } catch (e) {
            console.log('WorkspaceAccessGroupService.findByWorkspaceId', e);
            throw e;
        }
    }
}
