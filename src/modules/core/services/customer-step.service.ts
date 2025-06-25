import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatchError } from '../../auth/exceptions';
import { CustomerStep } from '../models/customer-step.entity';
import { CORE_CONNECTION } from '../ormconfig';

@Injectable()
export class CustomerStepService {
    constructor(
        @InjectRepository(CustomerStep, CORE_CONNECTION)
        private customerStepRepository: Repository<CustomerStep>,
    ) {}

    @CatchError()
    async listCustomerStep(): Promise<CustomerStep[]> {
        return await this.customerStepRepository.createQueryBuilder().getMany();
    }
}
