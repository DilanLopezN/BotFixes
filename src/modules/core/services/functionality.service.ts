import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatchError } from '../../auth/exceptions';
import { Functionality } from '../models/functionality.entity';
import { CORE_CONNECTION } from '../ormconfig';

@Injectable()
export class FunctionalityService {
    constructor(
        @InjectRepository(Functionality, CORE_CONNECTION)
        private functionalityRepository: Repository<Functionality>,
    ) {}

    @CatchError()
    async listFunctionality(): Promise<Functionality[]> {
        return await this.functionalityRepository.createQueryBuilder().getMany();
    }
}
