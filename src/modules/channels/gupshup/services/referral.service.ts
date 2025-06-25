import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatchError } from '../../../auth/exceptions';
import { GUPSHUP_CONNECTION } from '../ormconfig';
import { Referral } from '../models/referral.entity';
import { CreateReferral } from '../interfaces/referral.interface';

@Injectable()
export class ReferralService {
    constructor(
        @InjectRepository(Referral, GUPSHUP_CONNECTION)
        private referralRepository: Repository<Referral>,
    ) {}

    @CatchError()
    async create(data: CreateReferral) {
        await this.referralRepository.insert({
            ...data,
        });
    }

    @CatchError()
    async referralListByWorkspaceId(workspaceId: string) {
        let query = this.referralRepository
            .createQueryBuilder('referral')
            .select(['referral.source_id'])
            .where('referral.workspace_id = :workspaceId', { workspaceId })
            .groupBy('referral.source_id');

        return await query.execute();
    }
}
