import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatchError } from '../../auth/exceptions';
import { CountryState } from '../models/country-state.entity';
import { CORE_CONNECTION } from '../ormconfig';

@Injectable()
export class CountryStateService {
    constructor(
        @InjectRepository(CountryState, CORE_CONNECTION)
        private countryStateRepository: Repository<CountryState>,
    ) {}

    @CatchError()
    async listCountryState(): Promise<CountryState[]> {
        return await this.countryStateRepository.createQueryBuilder().getMany();
    }
}
