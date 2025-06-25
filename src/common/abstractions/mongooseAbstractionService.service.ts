import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Model, Document, ObjectId } from 'mongoose';
import { AbstractionServiceInterface } from './abstractionService.interface';
import { castObjectId } from '../utils/utils';
import { omit } from 'lodash';
import { CacheService } from './../../modules/_core/cache/cache.service';
import { QueryStringFilter } from './queryStringFilter.interface';
import { EventsService } from './../../modules/events/events.service';
import { KissbotEventDataType, KissbotEventType, KissbotEventSource } from 'kissbot-core';

export enum OrderEnum {
    DESC = 'DESC',
    ASC = 'ASC',
}

export interface AbstractEventData {
    dataType: KissbotEventDataType;
    update?: KissbotEventType;
    create?: KissbotEventType;
    delete?: KissbotEventType;
}

@Injectable()
export abstract class MongooseAbstractionService<T extends Document> implements AbstractionServiceInterface<T> {
    constructor(
        protected readonly model: Model<T>,
        protected readonly cacheService?: CacheService,
        protected readonly eventsService?: EventsService,
        protected readonly defaultCacheExpirationTime?: number,
    ) {}

    abstract getSearchFilter(search: string): any;

    abstract getEventsData(): AbstractEventData | void;

    public getModel() {
        return this.model;
    }

    private async sendEvent(data: T, operation: 'update' | 'create' | 'delete') {
        if (this.eventsService) {
            const eventsData = this.getEventsData();
            if (eventsData && eventsData[operation]) {
                this.eventsService.sendEvent({
                    data,
                    dataType: eventsData.dataType,
                    source: KissbotEventSource.KISSBOT_API,
                    type: eventsData[operation],
                });
            }
        }
    }

    public async save(entity: any): Promise<T & {_id: ObjectId}> {
        if (!entity || typeof entity !== 'object') {
            throw new BadRequestException();
        }
        try {
            const newItem: any = new this.model(entity);
            return await newItem.save();
        } catch (err) {
            console.log('ERROR', err);
            throw new BadRequestException(err.message);
        }
    }

    public async create(entity: any): Promise<T & {_id: ObjectId}> {
        const savedEntity = await this.save(entity);
        this.sendEvent(savedEntity, 'create');
        return savedEntity;
    }

    public async getOne(paramId: any): Promise<T> {
        let result: T = null;

        if (this.cacheService && paramId) {
            result = await this.cacheService.get(paramId.toString());

            if (result) {
                return result;
            }
        }

        if (typeof paramId === 'string') {
            paramId = castObjectId(paramId);
        }

        result = await this.model
            .findOne({
                _id: paramId,
                deletedAt: undefined,
            })
            .exec();

        if (this.cacheService && result) {
            this.cacheService.set(result, null, this.defaultCacheExpirationTime || parseInt(process.env.REDIS_CACHE_EXPIRATION)).then().catch(console.log);
        }

        return result;
    }

    public findOne(params: any): Promise<T> {
        return this.model.findOne({ ...params }).exec();
    }

    public async getAll(objectParams = {}): Promise<T[]> {
        return await this.model.find({ ...objectParams, deletedAt: { $eq: null } } as any).exec();
    }

    public async updateRaw(conditions: any, doc: any, options?: any) {
        if (conditions?._id && this.cacheService) await this.cacheService.remove(conditions?._id);

        return await this.model.updateOne(conditions, doc, options).exec();
    }

    public async updateMany(conditions: any, doc: any) {
        if (conditions?._id && this.cacheService) await this.cacheService.remove(conditions?._id);

        return await this.model.updateMany(conditions, doc);
    }

    public async update(paramId: string, entity: any): Promise<T> {
        if (this.cacheService) {
            this.cacheService.remove(paramId).then().catch(console.log);
        }
        const exists = await this.model.findOne({ _id: castObjectId(paramId) });
        if (!exists) {
            // @TODO: create new exception for entity not found
            throw new NotFoundException();
        }
        const parsedEntity = entity.toJSON ? entity.toJSON() : entity;
        const newObj = Object.assign(exists.toJSON(), parsedEntity);
        await this.model.updateOne({ _id: castObjectId(paramId) }, { $set: omit(newObj, ['_id']) } as any);
        this.sendEvent(newObj, 'update');
        return newObj;
    }

    public async delete(
        paramId: string,
        userCanDeleteCB?: (...params) => Promise<any>,
        forceDelete?: boolean,
    ): Promise<any> {
        const entity = await this.getOne(paramId);
        if (!entity) {
            throw new NotFoundException();
        }

        if (this.cacheService) {
            this.cacheService.remove(paramId).then().catch(console.log);
        }

        if (userCanDeleteCB) {
            await userCanDeleteCB(entity);
        }
        this.sendEvent(entity, 'delete');

        if (forceDelete) {
            await this.model.findOneAndDelete({ _id: paramId } as any);
        } else {
            await this.model.updateOne({ _id: castObjectId(paramId) }, { $set: { deletedAt: new Date() } } as any);
        }

        return { deleted: true };
    }

    async queryPaginate(query: QueryStringFilter, _?: string, omitCount?: boolean, omitDeletedAt?: boolean) {
        const { filter, skip, limit, sort, projection } = query;
        let searchFilter = {};

        const hasSearch = JSON.stringify(filter.search) !== JSON.stringify({ $exists: true });
        if (filter.search && hasSearch) {
            searchFilter = this.getSearchFilter(filter.search.toString());
            delete filter.search;
        }

        const filterWithSearch = { ...filter, ...searchFilter };

        let count = null;
        if (!omitCount) {
            count = await this.model.countDocuments({ ...filterWithSearch, deletedAt: { $eq: null } }).exec();
        }

        const data = await this.model
            .find(omitDeletedAt ? filterWithSearch : { ...filterWithSearch, deletedAt: { $eq: null } })
            .skip(skip)
            .limit(limit)
            .sort(sort)
            .select(projection);

        const currentPage = skip / limit + 1;

        const nextPage = currentPage + 1 > Math.ceil(count / limit) ? undefined : currentPage + 1;

        return {
            count,
            currentPage,
            nextPage,
            data,
        };
    }
}
