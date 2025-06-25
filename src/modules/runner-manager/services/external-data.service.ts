import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HealthIntegrationService } from '../../integrations/services/health/health-integration.service';
import { castObjectId } from '../../../common/utils/utils';
import { Exceptions } from '../../../modules/auth/exceptions';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ExternalDataService {
    private dockerHubApi: AxiosInstance;
    private healthIntegrationService: HealthIntegrationService;
    constructor(private readonly moduleRef: ModuleRef) {
        this.dockerHubApi = axios.create({
            baseURL: 'https://hub.docker.com/v2',
        });
    }

    async onApplicationBootstrap() {
        this.healthIntegrationService = this.moduleRef.get<HealthIntegrationService>(HealthIntegrationService, {
            strict: false,
        });
    }

    async getIntegrationById(integrationId: string) {
        return await this.healthIntegrationService.findOne({
            _id: castObjectId(integrationId),
        });
    }

    async listRepositoryTagsOnDockerHub(): Promise<{ id: string; name: string; lastUpdated: string }[]> {
        try {
            let result = [];

            const loginResult = await this.dockerHubApi.post('/users/login', {
                username: process.env.DOCKER_HUB_USERNAME,
                password: process.env.DOCKER_HUB_PASSWORD,
            });

            if (loginResult.data.token) {
                const responseList = await this.dockerHubApi.get(
                    `/namespaces/botdesigner/repositories/health-integrator/tags?page=1&page_size=30`,
                    {
                        headers: {
                            Authorization: `Bearer ${loginResult.data.token}`,
                        },
                    },
                );

                if (responseList.data) {
                    result = responseList.data?.results?.map((tag) => {
                        return {
                            id: tag.id,
                            name: tag.name,
                            lastUpdated: tag.last_updated,
                        };
                    });
                }
            }

            return result;
        } catch (e) {
            console.log('Runner_manager external-data.service.listRepositoryTagsOnDockerHub', e);
            throw Exceptions.BAD_REQUEST;
        }
    }
}
