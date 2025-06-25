import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RUNNER_MANAGER_CONNECTION_NAME } from '../connName';
import { Deploy, DeployStatus } from '../models/deploy.entity';
import { CatchError } from '../../auth/exceptions';
import { CreateDeploy } from '../interfaces/deploy.interface';

@Injectable()
export class DeployService {
    private readonly logger = new Logger(DeployService.name);
    constructor(
        @InjectRepository(Deploy, RUNNER_MANAGER_CONNECTION_NAME)
        private deployRepository: Repository<Deploy>,
    ) {}

    @CatchError()
    async create(data: CreateDeploy) {
        return await this.deployRepository.save(data);
    }

    @CatchError()
    async update(deployId: number, status: DeployStatus) {
        return await this.deployRepository.update({ id: deployId }, { status: status });
    }

    @CatchError()
    async getLastDeployByService(runnerId: number, serviceId: number) {
        return await this.deployRepository
            .createQueryBuilder('deploy')
            .select('deploy.tag', 'tag')
            .addSelect('deploy.created_at', 'createdAt')
            .where('deploy.runner_id = :runnerId', { runnerId: runnerId })
            .andWhere(`deploy.service_id = :serviceId`, {
                serviceId: serviceId,
            })
            .orderBy('deploy.created_at', 'DESC')
            .getRawOne();
    }
}
