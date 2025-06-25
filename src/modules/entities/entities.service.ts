import { Injectable, forwardRef, Inject, BadGatewayException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Entity } from './interfaces/entity.interface';
import { MongooseAbstractionService } from '../../common/abstractions/mongooseAbstractionService.service';
import { Model } from 'mongoose';
import { WorkspacesService } from '../workspaces/services/workspaces.service';
import { Exceptions } from '../auth/exceptions';

@Injectable()
export class EntitiesService extends MongooseAbstractionService<Entity> {
    constructor(
        @InjectModel('Entity') protected readonly model: Model<Entity>,
        @Inject(forwardRef(() => WorkspacesService))
        private readonly workspacesService: WorkspacesService,
    ) {
        super(model);
    }

    getSearchFilter(search: string): any {}
    getEventsData() {}

    public async createEntity(entity: Entity, workspaceId: string): Promise<Entity> {
        const dialogFlowInstance = await this.workspacesService.dialogFlowInstance(workspaceId);

        if (!dialogFlowInstance) {
            const newEntity = await this.create(entity);
            return newEntity;
        }

        try {
            const dialogFlowEntity = await dialogFlowInstance.newEntity(entity);
            entity.params = { dialogFlow: { entity: dialogFlowEntity[0] } };
            const newEntity = await this.create(entity);
            return newEntity;
        } catch (error) {
            throw new BadGatewayException('ERROR_DIALOGFLOW', error);
        }
    }

    public async updateEntity(entityId: string, entity: Entity): Promise<Entity> {
        const updatedEntity = await this.update(entityId, entity);
        entity.params = updatedEntity.params;
        const dialogFlowInstance = await this.workspacesService.dialogFlowInstance(entity.workspaceId);
        if (dialogFlowInstance) {
            const dialogFlowEntity = await dialogFlowInstance.updateEntity(entity);
            if (dialogFlowEntity) {
                entity.params = { dialogFlow: { entity: dialogFlowEntity[0] } };
                await this.update(entityId, entity);
            }
        }
        return entity;
    }

    public async deleteEntity(entityId: string) {
        const entity = await this.getOne(entityId);
        const dialogFlowInstance = await this.workspacesService.dialogFlowInstance(entity.workspaceId);
        if (dialogFlowInstance && entity.params && entity.params.dialogFlow) {
            try {
                await dialogFlowInstance.deleteEntity(entity);
            } catch (err) {
                // TODO implements log
                if (
                    err.details &&
                    typeof err.details == 'string' &&
                    err.details.startsWith('Some entity names are in use')
                ) {
                    throw Exceptions.ENTITY_IN_USE;
                }
            }
        }
        return await this.delete(entityId);
    }
}
