import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CacheService } from '../../core/cache/cache.service';
import { Integration, IntegrationDocument } from './schema/integration.schema';
import { HTTP_ERROR_THROWER } from '../../common/exceptions.service';
import { OkResponse } from '../../common/interfaces/ok-response.interface';
import { IIntegration } from './interfaces/integration.interface';
import { castObjectId } from '../../common/helpers/cast-objectid';
import { omit } from 'lodash';

@Injectable()
export class IntegrationService {
  constructor(
    @InjectModel(Integration.name) protected integrationModel: Model<IntegrationDocument>,
    protected readonly cacheService: CacheService,
  ) {}

  async create(integration: IIntegration & { _id: string }): Promise<IntegrationDocument> {
    try {
      return await this.integrationModel.create({
        ...integration,
        _id: castObjectId(integration._id),
      });
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, error);
    }
  }

  async update(integrationId: string, integration: IIntegration): Promise<OkResponse> {
    try {
      const result = await this.integrationModel.updateOne(
        {
          _id: castObjectId(integrationId),
        },
        omit(integration, '_id'),
      );
      await this.cacheService.remove(integrationId);
      return {
        ok: result.modifiedCount > 0,
      };
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, error);
    }
  }

  async getOne(integrationId: string): Promise<IntegrationDocument> {
    try {
      const cachedIntegration = await this.cacheService.get(integrationId);

      if (cachedIntegration) {
        return cachedIntegration;
      }

      const integration = await this.integrationModel.findOne({ _id: castObjectId(integrationId) });
      await this.cacheService.set(integration, integrationId);

      return integration;
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, error);
    }
  }

  async getAllIntegrationsWithScheduledSending(): Promise<IntegrationDocument[]> {
    return await this.integrationModel.find({ 'rules.useScheduledSending': true, enabled: true });
  }

  async getIntegrationsWithAllSchedulingNotification(): Promise<IntegrationDocument[]> {
    return await this.integrationModel.find({
      'scheduleNotification.createNotificationsFromImport': true,
      enabled: true,
    });
  }

  async getIntegrationsWithErpDocumentsUpload(): Promise<IntegrationDocument[]> {
    return await this.integrationModel.find({
      $or: [
        {
          'scheduling.config.documents.enableDocumentsUpload': true,
        },
        {
          'documents.enableDocumentsUpload': true,
        },
      ],
      enabled: true,
    });
  }

  async getByIdentifier(identifier: string): Promise<IntegrationDocument> {
    try {
      const cachedIntegration = await this.cacheService.get(identifier);

      if (cachedIntegration) {
        return cachedIntegration;
      }

      const integration = await this.integrationModel.findOne({ 'scheduling.identifier': identifier });
      await this.cacheService.set(integration, identifier);

      return integration;
    } catch (error) {
      throw HTTP_ERROR_THROWER(HttpStatus.INTERNAL_SERVER_ERROR, error);
    }
  }

  async list(filters: FilterQuery<IntegrationDocument>): Promise<IntegrationDocument[]> {
    return await this.integrationModel.find(filters);
  }

  getModel(): Model<IntegrationDocument> {
    return this.integrationModel;
  }
}
