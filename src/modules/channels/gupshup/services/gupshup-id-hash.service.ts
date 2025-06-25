import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { CatchError } from '../../../auth/exceptions';
import { CreateGupshupIdHash } from '../interfaces/create-supshup-id-hash.interface';
import { GupshupIdHash } from '../models/gupshup-id-hash.entity';
import { GUPSHUP_CONNECTION } from '../ormconfig';

@Injectable()
export class GupshupIdHashService {
    constructor(
        @InjectRepository(GupshupIdHash, GUPSHUP_CONNECTION)
        private gupshupIdHashRepository: Repository<GupshupIdHash>,
    ) {}

    @CatchError()
    async create(data: CreateGupshupIdHash) {
        try {
            await this.gupshupIdHashRepository.insert({
                ...data,
                createdAt: moment().valueOf(),
            });
        } catch (e) {
            if (typeof e?.message == 'string' && String(e?.message).indexOf('null value in column "id"') > 0) {
                return;
            }
            throw e;
        }
    }

    @CatchError()
    async findHashByGsId(gsId: string): Promise<undefined | string> {
        const idHash = await this.gupshupIdHashRepository.findOne({
            gsId,
        });
        return idHash?.hash;
    }

    @CatchError()
    async findGsIdByHash(hash: string): Promise<undefined | string> {
        const idHash = await this.gupshupIdHashRepository.findOne({
            hash,
        });
        return idHash?.gsId;
    }

    @CatchError()
    async findByHash(hash: string): Promise<GupshupIdHash> {
        const idHash = await this.gupshupIdHashRepository.findOne({
            hash,
        });
        return idHash;
    }
}
