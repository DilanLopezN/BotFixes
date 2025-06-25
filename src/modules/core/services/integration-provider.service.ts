import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatchError } from '../../auth/exceptions';
import { IntegrationProvider } from '../models/integration-provider.entity';
import { CORE_CONNECTION } from '../ormconfig';

@Injectable()
export class IntegrationProviderService {
    constructor(
        @InjectRepository(IntegrationProvider, CORE_CONNECTION)
        private integrationProviderRepository: Repository<IntegrationProvider>,
    ) {}

    @CatchError()
    async listIntegrationProvider(): Promise<IntegrationProvider[]> {
        return await this.integrationProviderRepository.createQueryBuilder().getMany();
    }
}
