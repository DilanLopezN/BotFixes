import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { CatchError } from '../../../../modules/auth/exceptions';
import { WppIdHash } from '../models/wpp-id-hash.entity';
import { CreateWppIdHash } from '../interfaces/create-wpp-id-hash.interface';
import { WHATSAPP_CONNECTION } from '../ormconfig';
import { castObjectIdToString } from '../../../../common/utils/utils';
import { CacheService } from '../../../../modules/_core/cache/cache.service';

@Injectable()
export class WhatsappIdHashService {
    constructor(
        @InjectRepository(WppIdHash, WHATSAPP_CONNECTION)
        private wppIdHashRepository: Repository<WppIdHash>,
    ) {}

    @CatchError()
    async create(data: CreateWppIdHash) {
        try {
            await this.wppIdHashRepository.insert({
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
    async findHashByWppId(wppId: string): Promise<undefined | string> {
        const idHash = await this.wppIdHashRepository.findOne({
            wppId,
        });
        return idHash?.hash;
    }

    @CatchError()
    async findWppIdByHash(hash: string): Promise<undefined | string> {
        const idHash = await this.wppIdHashRepository.findOne({
            hash,
        });
        return idHash?.wppId;
    }

    @CatchError()
    async findByHash(hash: string): Promise<WppIdHash> {
        const idHash = await this.wppIdHashRepository.findOne({
            hash,
        });
        return idHash;
    }

    getActivtyWppIdHashCacheKey(id: string) {
        return `WPPID:${id}`;
    }


    @CatchError()
    async createAndSetWppIdHash(response, channelConfig, activity, conversation) {
        await this.create({
            channelConfigToken: channelConfig.token,
            wppId: response.msg_id,
            hash: activity.hash,
            conversationId: castObjectIdToString(conversation._id),
            workspaceId: conversation.workspace?._id,
        });
    }
}
