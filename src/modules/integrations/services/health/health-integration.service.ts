import { CreateHealthIntegrationDto, UpdateHealthIntegrationDto } from './../../dto/health/health-integration.dto';
import { Injectable, BadGatewayException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MongooseAbstractionService } from './../../../../common/abstractions/mongooseAbstractionService.service';
import { HealthIntegration } from '../../interfaces/health/health-integration.interface';
import { ExternalHealthEntity } from '../../interfaces/health/health-entity.interface';
import { HealthIntegrationModel } from '../../schemas/health/health-integration.schema';
import { HttpService } from '@nestjs/axios';
import { CatchError, Exceptions } from '../../../auth/exceptions';
import { lastValueFrom } from 'rxjs';
import { HealthEntityService } from './health-entity.service';
import { isAnySystemAdmin } from '../../../../common/utils/roles';
import { User } from '../../../users/interfaces/user.interface';
import { ExternalDataService } from './external-data.service';
import { castObjectIdToString } from '../../../../common/utils/utils';

@Injectable()
export class HealthIntegrationService extends MongooseAbstractionService<HealthIntegration> {
    constructor(
        @InjectModel('HealthIntegration') protected readonly model: Model<HealthIntegration>,
        private readonly httpService: HttpService,
        @Inject(forwardRef(() => HealthEntityService))
        private readonly healthEntityService: HealthEntityService,
        private readonly externalDataService: ExternalDataService,
    ) {
        super(model);
    }

    getSearchFilter() {}
    getEventsData() {}

    @CatchError()
    async updateSyncStatus(integrationId: string, body: any, workspaceId: string) {
        return await this.update(integrationId, { ...body, workspaceId });
    }

    private async createIntegration(integration: HealthIntegration) {
        const response = await lastValueFrom(this.httpService.post(`/health/integration`, integration));
        return response?.data;
    }

    private async updateIntegration(integration: HealthIntegration, integrationId: string) {
        const response = await lastValueFrom(this.httpService.put(`/health/integration/${integrationId}`, integration));
        return response?.data;
    }

    public async _create(body: CreateHealthIntegrationDto) {
        const integrationModel = new HealthIntegrationModel({
            ...body,
            enabled: true,
            _id: new Types.ObjectId(),
        });

        try {
            await this.createIntegration(integrationModel);
            return await this.create(integrationModel);
        } catch (error) {
            return new BadGatewayException(`Error when creating integration in integrations: ${error}`);
        }
    }

    public async _getAll(user: User, query: any, workspaceId: string) {
        const systemAnyAdmin = isAnySystemAdmin(user);

        if (!systemAnyAdmin) {
            const integration = await this.model
                .find({ ...query.filter, workspaceId, deletedAt: { $eq: null } })
                .select('-apiToken -apiUrl -apiPassword -enabled -apiUsername -codeIntegration -debug -auditRequests')
                .exec();

            return { data: integration };
        }

        query.projection = '-apiToken -apiUrl -apiPassword -apiUsername -codeIntegration';
        const response = await this.queryPaginate(query);

        if (systemAnyAdmin && response?.data?.length) {
            try {
                const data = await this.externalDataService.appendIntegrationStatus(
                    response?.data,
                    response.data[0].workspaceId as unknown as string,
                );

                response.data = data;

                const dataMessages = await this.externalDataService.appendIntegrationMessages(
                    response?.data,
                    response.data[0].workspaceId as unknown as string,
                );

                response.data = dataMessages;

                return response;
            } catch (error) {}
        }

        return response;
    }

    public async _update(integrationId: string, body: UpdateHealthIntegrationDto, workspaceId: string) {
        const integrationModel = new HealthIntegrationModel({
            ...body,
            workspaceId,
        });

        try {
            await this.updateIntegration(integrationModel, integrationId);
            return await this.update(integrationId, integrationModel);
        } catch (error) {
            return new BadGatewayException(`Error when update integration in integrations: ${error}`);
        }
    }

    public async clearCache(integrationId: string, workspaceId: string): Promise<Array<ExternalHealthEntity>> {
        const integration = await this.findOne({
            _id: integrationId,
            workspaceId,
        });

        try {
            return await this.clearCacheIntegration(castObjectIdToString(integration._id));
        } catch (error) {
            throw new BadGatewayException(`Error clearing integration cache: ${error}`);
        }
    }

    private async clearCacheIntegration(integrationId: string) {
        const response = await lastValueFrom(this.httpService.post(`/integration/${integrationId}/health/clear-cache`));
        return response?.data ?? [];
    }

    public async syncAllDone(integrationId: string) {
        const integration = await this.findOne({
            _id: integrationId,
        });

        return await this.healthEntityService.syncEntitiesFromRedis(integration);
    }

    async ping(integration: HealthIntegration) {
        try {
            const response = await lastValueFrom(
                this.httpService.get<{ ok: boolean }>(`/integration/${integration._id}/health/status`, {}),
            );
            return response?.data?.ok || false;
        } catch (error) {
            return false;
        }
    }

    async generateAccessToken(workspaceId: string, integrationId: string): Promise<{ token: string }> {
        const integration = await this.findOne({
            _id: integrationId,
            workspaceId,
        });

        if (!integration) {
            throw Exceptions.NOT_FOUND;
        }
        try {
            const response = await lastValueFrom(
                this.httpService.post<{ token: string }>(
                    `/integration/${integration._id}/token-management/generateAccessToken`,
                    null,
                ),
            );
            return response?.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
