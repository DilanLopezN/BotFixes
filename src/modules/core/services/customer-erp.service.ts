import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatchError } from '../../auth/exceptions';
import { CustomerErp } from '../models/customer-erp.entity';
import { CORE_CONNECTION } from '../ormconfig';

@Injectable()
export class CustomerErpService {
    constructor(
        @InjectRepository(CustomerErp, CORE_CONNECTION)
        private customerErpRepository: Repository<CustomerErp>,
    ) {}

    @CatchError()
    async listCustomerErp(): Promise<CustomerErp[]> {
        return await this.customerErpRepository.createQueryBuilder().getMany();
    }
}
