import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RUNNER_MANAGER_CONNECTION_NAME } from '../connName';
import { ServiceStatus } from '../models/service-status.entity';
import { EnvTypes } from '../models/service.entity';

@Injectable()
export class ServiceStatusService {
    constructor(
        @InjectRepository(ServiceStatus, RUNNER_MANAGER_CONNECTION_NAME)
        private repo: Repository<ServiceStatus>,
    ) {}

    async createServiceStatus(data: Partial<ServiceStatus>) {
        let allStatus = await this.repo.count({
            where: {
                integrationId: data.integrationId,
            },
        });

        let olderStatus: ServiceStatus;

        if (allStatus >= 1500) {
            olderStatus = await this.repo.findOne({
                where: {
                    integrationId: data.integrationId,
                },
                order: {
                    createdAt: 'ASC',
                },
            });
        }
        const createdStatus = await this.repo.save(data);

        if (createdStatus.id > olderStatus?.id) {
            await this.repo.delete({
                id: olderStatus.id,
            });
        }
    }

    async getStatusByRunnerIdAndEnv(runnerId: number, env: EnvTypes) {
        const resultWitchVersion = await this.repo
            .createQueryBuilder('status')
            .select('status.ok', 'ok')
            .addSelect('status.version', 'version')
            .addSelect('status.created_at', 'createdAt')
            .where('status.env = :env', { env: env })
            .andWhere(`status.runner_id = :id`, {
                id: runnerId,
            })
            .andWhere(`status.version IS NOT NULL`)
            .orderBy('status.created_at', 'DESC')
            .getRawOne();

        const lastStatus = await this.repo
            .createQueryBuilder('status')
            .select('status.ok', 'ok')
            .addSelect('status.version', 'version')
            .addSelect('status.created_at', 'createdAt')
            .where('status.env = :env', { env: env })
            .andWhere(`status.runner_id = :id`, {
                id: runnerId,
            })
            .orderBy('status.created_at', 'DESC')
            .getRawOne();

        return {
            ...lastStatus,
            version: resultWitchVersion?.version,

        };
    }
}
