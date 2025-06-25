import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { getNumberWithout9 } from "kissbot-core";
import { Repository } from "typeorm";
import { MismatchWaid } from "../models/mismatch-waid.entity";
import { GUPSHUP_CONNECTION } from "../ormconfig";
import { CacheService } from './../../../_core/cache/cache.service';

@Injectable()
export class MismatchWaidService {
    private readonly logger = new Logger(MismatchWaidService.name);
    constructor(
        @InjectRepository(MismatchWaid, GUPSHUP_CONNECTION)
        private mismatchWaidRepository: Repository<MismatchWaid>,
        private readonly cacheService: CacheService,
    ) {}

    private getMismatchWaidCacheKey(waidOrPhoneNumber: string){
        const prefix = 'MISMATCH_WAID';
        if (waidOrPhoneNumber.startsWith('55')) {
            return `${prefix}:${getNumberWithout9(waidOrPhoneNumber)}`
        }
        return `${prefix}:${waidOrPhoneNumber}`
    }

    private getMismatchPhoneNumberCacheKey(waidOrPhoneNumber: string){
        const prefix = 'MISMATCH_PHONE_NUMBER';
        if (waidOrPhoneNumber.startsWith('55')) {
            return `${prefix}:${getNumberWithout9(waidOrPhoneNumber)}`
        }
        return `${prefix}:${waidOrPhoneNumber}`
    }

    async saveMismatch(phoneNumber: string, waid: string) {
        try {
            const mismatchPhoneNumberCacheKey = this.getMismatchPhoneNumberCacheKey(phoneNumber);
            const mismatchWaidCacheKey = this.getMismatchWaidCacheKey(waid);
            await this.cacheService.set(waid, mismatchPhoneNumberCacheKey, 86400 * 2);
            await this.cacheService.set(phoneNumber, mismatchWaidCacheKey, 86400 * 2);
        } catch (e) {
            this.logger.debug(e);
        }
        await this.mismatchWaidRepository.save({
            phoneNumber,
            waid,
        });
    }

    async getMismatchWaidAndPhoneNumber(waidOrPhoneNumber: string): Promise<MismatchWaid> {
        const mismatchPhoneNumberCacheKey = this.getMismatchPhoneNumberCacheKey(waidOrPhoneNumber);
        const mismatchWaidCacheKey = this.getMismatchWaidCacheKey(waidOrPhoneNumber);
        const phoneNumber = await this.cacheService.get(mismatchPhoneNumberCacheKey);
        const waid = await this.cacheService.get(mismatchWaidCacheKey);
        return { phoneNumber, waid };
    }

}