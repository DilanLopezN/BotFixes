import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RUNNER_MANAGER_CONNECTION_NAME } from '../connName';
import { Runner } from '../models/runner.entity';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { EnvTypes, Service } from '../models/service.entity';
import { ModuleRef } from '@nestjs/core';
import { DeployService } from './deploy.service';
import { DeployStatus } from '../models/deploy.entity';
import { CreateRunner, UpdateRunner } from '../interfaces/runner.interface';
import { ServiceStatusService } from './service-status.service';
import { CreateService } from '../interfaces/service.interface';
import { ServiceRunnerService } from './service-runner.service';
import { omit } from 'lodash';
import { ExternalDataService } from './external-data.service';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class RunnerService {
    private readonly logger = new Logger(RunnerService.name);
    constructor(
        @InjectRepository(Runner, RUNNER_MANAGER_CONNECTION_NAME)
        private runnerRepository: Repository<Runner>,
        private readonly moduleRef: ModuleRef,
        private readonly serviceStatusService: ServiceStatusService,
        private readonly deployService: DeployService,
        private readonly externalDataService: ExternalDataService,
        private readonly httpService: HttpService,
    ) {}

    async getIntegrationAndValidationActive(integrationId: string) {
        const integration = await this.externalDataService.getIntegrationById(integrationId);

        if (!integration) {
            throw Exceptions.ERROR_INTEGRATION_NOT_FOUND;
        }
        if (!integration.enabled) {
            throw Exceptions.ERROR_DISABLED_INTEGRATION;
        }

        return integration;
    }

    @CatchError()
    async getContainerLogs(runnerId: number, serviceId: number, logsSize: number): Promise<any> {
        const runner = await this.runnerRepository
            .createQueryBuilder('runner')
            .select('runner')
            .where('runner.id = :id', {
                id: runnerId,
            })
            .leftJoinAndMapMany(
                'runner.services',
                Service,
                'service',
                `service.runner_id = runner.id AND service.id = ${Number(serviceId)}`,
            )
            .getOne();

        if (!runner) {
            throw Exceptions.ERROR_RUNNER_NOT_FOUND;
        }

        if (!runner.services.length) {
            throw Exceptions.ERROR_RUNNER_SERVICE_NOT_FOUND;
        }

        const integration = await this.getIntegrationAndValidationActive(runner.services[0].integrationId);

        const response = await lastValueFrom(
            this.httpService.post(`/private/integration/${integration.id}/getContainerLogs`, {
                runnerId: runner.id,
                env: runner.services[0].env,
                logsSize,
            }),
        );

        return response.data;
    }

    @CatchError()
    async doSql(runnerId: number, serviceId: number, sql: string): Promise<any> {
        const runner = await this.runnerRepository
            .createQueryBuilder('runner')
            .select('runner')
            .where('runner.id = :id', {
                id: runnerId,
            })
            .leftJoinAndMapMany(
                'runner.services',
                Service,
                'service',
                `service.runner_id = runner.id AND service.id = ${Number(serviceId)}`,
            )
            .getOne();

        if (!runner) {
            throw Exceptions.ERROR_RUNNER_NOT_FOUND;
        }
        if (!runner.services.length) {
            throw Exceptions.ERROR_RUNNER_SERVICE_NOT_FOUND;
        }

        const integration = await this.getIntegrationAndValidationActive(runner.services[0].integrationId);

        const response = await lastValueFrom(
            await this.httpService.post(`/private/integration/${integration.id}/doSql`, {
                sql,
            }),
        );

        return response.data;
    }

    async doSqlByIntegration(integrationId: string, sql: string): Promise<any> {
       try {
         const response = await lastValueFrom(
            this.httpService.post(`/private/integration/${integrationId}/doSql`, {
                sql,
            }),
        );
        return response.data;
       } catch (error) {
        console.error(error)
       }

    }

    @CatchError()
    async doDeploy(runnerId: number, serviceId: number, tag: string): Promise<any> {
        const runner = await this.runnerRepository
            .createQueryBuilder('runner')
            .select('runner')
            .where('runner.id = :id', {
                id: runnerId,
            })
            .leftJoinAndMapMany(
                'runner.services',
                Service,
                'service',
                `service.runner_id = runner.id AND service.id = ${Number(serviceId)}`,
            )
            .getOne();

        if (!runner) {
            throw Exceptions.ERROR_RUNNER_NOT_FOUND;
        }

        if (!runner.services.length) {
            throw Exceptions.ERROR_RUNNER_SERVICE_NOT_FOUND;
        }

        const integration = await this.getIntegrationAndValidationActive(runner.services[0].integrationId);

        const deploy = await this.createDeploy(runner.workspaceId, runner.id, runner.services[0].id, tag);
        const response = await lastValueFrom(
            await this.httpService.post(`/private/integration/${integration.id}/doDeploy`, {
                tag,
                env: runner.services[0].env,
                runnerId: runner.id,
            }),
        );

        let status = DeployStatus.error;
        if (response.status == 200) {
            status = DeployStatus.success;
        }
        await this.updateDeploy(deploy.id, status);

        return { ok: true };
    }

    async integratorPing(runnerId: number, serviceId: number): Promise<any> {
        const runner = await this.runnerRepository
            .createQueryBuilder('runner')
            .select('runner')
            .where('runner.id = :id', {
                id: runnerId,
            })
            .leftJoinAndMapMany(
                'runner.services',
                Service,
                'service',
                `service.runner_id = runner.id AND service.id = ${Number(serviceId)}`,
            )
            .getOne();

        if (!runner) {
            throw Exceptions.ERROR_RUNNER_NOT_FOUND;
        }
        if (!runner.services.length) {
            throw Exceptions.ERROR_RUNNER_SERVICE_NOT_FOUND;
        }

        const integration = await this.getIntegrationAndValidationActive(runner.services[0].integrationId);

        try {
            const response = await lastValueFrom(
                await this.httpService.post(`/private/integration/${integration.id}/integratorPing`),
            );
            return response.data;
        } catch (e) {
            return {
                ok: false,
                version: null,
            };
        }
    }

    async runnerPing(runnerId: number, serviceId: number): Promise<any> {
        const runner = await this.runnerRepository
            .createQueryBuilder('runner')
            .select('runner')
            .where('runner.id = :id', {
                id: runnerId,
            })
            .leftJoinAndMapMany(
                'runner.services',
                Service,
                'service',
                `service.runner_id = runner.id AND service.id = ${Number(serviceId)}`,
            )
            .getOne();

        if (!runner) {
            throw Exceptions.ERROR_RUNNER_NOT_FOUND;
        }
        if (!runner.services.length) {
            throw Exceptions.ERROR_RUNNER_SERVICE_NOT_FOUND;
        }

        const integration = await this.getIntegrationAndValidationActive(runner.services[0].integrationId);

        try {
            const response = await lastValueFrom(
                await this.httpService.post(`/private/integration/${integration.id}/runner/${runnerId}/ping`),
            );
            return response.data;
        } catch (e) {
            return {
                ok: false,
                data: null,
            };
        }
    }

    @CatchError()
    private async createDeploy(workspaceId: string, runnerId: number, serviceId: number, tag: string): Promise<any> {
        const deployService = this.moduleRef.get<DeployService>(DeployService, { strict: false });
        return await deployService.create({
            runnerId,
            service: { id: serviceId },
            workspaceId,
            tag,
        });
    }

    @CatchError()
    private async updateDeploy(deployId: number, status: DeployStatus): Promise<any> {
        const deployService = this.moduleRef.get<DeployService>(DeployService, { strict: false });
        return await deployService.update(deployId, status);
    }

    @CatchError()
    async getOne(runnerId: number) {
        return await this.runnerRepository.findOne(runnerId);
    }

    @CatchError()
    private async createService(
        workspaceId: string,
        runner: Runner,
        env: EnvTypes,
        integrationId: string,
    ): Promise<any> {
        const serviceRunnerService = this.moduleRef.get<ServiceRunnerService>(ServiceRunnerService, { strict: false });
        return await serviceRunnerService.create({
            workspaceId,
            runner,
            env,
            runnerId: runner.id,
            integrationId,
        });
    }

    @CatchError()
    async create(data: CreateRunner & { services: Partial<CreateService>[] }) {
        if (!data?.services?.length) {
            throw Exceptions.ERROR_CREATE_RUNNER_SERVICE_NOT_FOUND;
        }

        for (const service of data.services) {
            await this.getIntegrationAndValidationActive(service.integrationId);
        }
        const runner = await this.runnerRepository.save(omit(data, 'services'));
        const services = await Promise.all(
            data.services.map(async (service) => {
                return await this.createService(runner.workspaceId, runner, service.env, service.integrationId);
            }),
        );

        return {
            ...runner,
            services,
        };
    }

    @CatchError()
    async update(runnerId: number, data: UpdateRunner) {
        return await this.runnerRepository.update({ id: runnerId }, { name: data.name });
    }

    async listRunners(search?: string) {
        let results;
        try {
            const queryBuilder = this.runnerRepository
                .createQueryBuilder('runner')
                .leftJoinAndMapMany('runner.services', Service, 'service', `service.runner_id = runner.id`);

            if (search) {
                queryBuilder.where('LOWER(UNACCENT(runner.name)) LIKE LOWER(UNACCENT(:name))', { name: `%${search}%` });
            }

            const runners = await queryBuilder.getMany();

            results = await Promise.all(
                runners?.map(async (runner) => {
                    const services = await Promise.all(
                        runner.services.map(async (service) => {
                            const servStatus = await this.serviceStatusService.getStatusByRunnerIdAndEnv(
                                runner.id,
                                service.env,
                            );
                            return {
                                ...service,
                                status: servStatus || null,
                            };
                        }),
                    );
                    return {
                        id: runner.id,
                        name: runner.name,
                        runnerStatus: null,
                        services,
                    };
                }),
            );
        } catch (error) {
            console.error(error);
        }

        return results;
    }

    @CatchError()
    async getRunnerById(runnerId: number) {
        const runner = await this.runnerRepository
            .createQueryBuilder('runner')
            .leftJoinAndMapMany('runner.services', Service, 'service', `service.runner_id = runner.id`)
            .where('runner.id = :id', { id: runnerId })
            .getOne();

        if (!runner) {
            throw Exceptions.ERROR_RUNNER_NOT_FOUND;
        }

        const services = await Promise.all(
            runner.services.map(async (service) => {
                const servStatus = await this.serviceStatusService.getStatusByRunnerIdAndEnv(runner.id, service.env);
                const lastDeploy = await this.deployService.getLastDeployByService(runner.id, service.id);
                return {
                    ...service,
                    lastDeploy,
                    status: servStatus || null,
                };
            }),
        );
        const result = {
            id: runner.id,
            name: runner.name,
            runnerStatus: null,
            services,
        };

        return result;
    }
}
