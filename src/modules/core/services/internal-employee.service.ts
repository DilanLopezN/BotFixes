import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatchError } from '../../auth/exceptions';
import { InternalEmployee } from '../models/internal-employee.entity';
import { CORE_CONNECTION } from '../ormconfig';

@Injectable()
export class InternalEmployeeService {
    constructor(
        @InjectRepository(InternalEmployee, CORE_CONNECTION)
        private internalEmployeeRepository: Repository<InternalEmployee>,
    ) {}

    @CatchError()
    async listInternalEmployee(): Promise<InternalEmployee[]> {
        return await this.internalEmployeeRepository.createQueryBuilder().getMany();
    }
}
