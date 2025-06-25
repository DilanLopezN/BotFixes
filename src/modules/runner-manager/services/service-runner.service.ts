import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RUNNER_MANAGER_CONNECTION_NAME } from '../connName';
import { EnvTypes, Service } from '../models/service.entity';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { CreateService } from '../interfaces/service.interface';
import { RunnerService } from './runner.service';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class ServiceRunnerService {
    private readonly logger = new Logger(ServiceRunnerService.name);
    constructor(
        @InjectRepository(Service, RUNNER_MANAGER_CONNECTION_NAME)
        private serviceRepository: Repository<Service>,
        private readonly moduleRef: ModuleRef,
    ) {}

    @CatchError()
    private async getOneRunner(runnerId: number): Promise<any> {
        const runnerService = this.moduleRef.get<RunnerService>(RunnerService, { strict: false });
        return await runnerService.getOne(runnerId);
    }

    @CatchError()
    async create(data: CreateService) {
        const runner = await this.getOneRunner(data.runnerId);

        if (!runner) {
            throw Exceptions.ERROR_RUNNER_NOT_FOUND;
        }

        const existEnvService = await this.serviceRepository.find({
            where: {
                runner: { id: runner.id },
                env: data.env,
            },
        });

        if (existEnvService.length) {
            throw Exceptions.ERROR_RUNNER_SERVICE_FIELD_ENV_IN_USE;
        }

        return await this.serviceRepository.save({ ...data, workspaceId: runner.workspaceId, runner: runner });
    }

    @CatchError()
    async update(runnerId: number, serviceId: number, env: EnvTypes) {
        const runner = await this.getOneRunner(runnerId);

        if (!runner) {
            throw Exceptions.ERROR_RUNNER_NOT_FOUND;
        }
        const service = await this.serviceRepository.find({
            where: {
                runner: { id: runner.id },
                env: env,
            },
        });

        if (service.length) {
            throw Exceptions.ERROR_RUNNER_SERVICE_FIELD_ENV_IN_USE;
        }
        return await this.serviceRepository.update({ id: serviceId }, { env: env });
    }

    @CatchError()
    async getAll() {
        return await this.serviceRepository
            .createQueryBuilder('service')
            .innerJoinAndSelect('service.runner', 'runner')
            .getMany();
    }
}
