import { Injectable } from '@nestjs/common';
import { ActivityType, GupshupContact, GupshupMessage, IdentityType } from 'kissbot-core';
import { ActivityDto } from './../../../conversation/dto/activities.dto';
import { Conversation, Identity } from './../../../conversation/interfaces/conversation.interface';
import * as moment from 'moment';
import { CacheService } from './../../../_core/cache/cache.service';
import axios, { AxiosInstance } from 'axios';
import { MismatchWaidService } from './mismatch-waid.service';
import { getWithAndWithout9PhoneNumber } from 'kissbot-core';
import { MismatchWaid } from '../models/mismatch-waid.entity';
const axiosRetry = require('axios-retry');

@Injectable()
export class GupshupUtilService {
    constructor(public cacheService: CacheService, private readonly mismatchWaidService: MismatchWaidService) {}

    async getActivityDto(message: GupshupMessage, conversation: Conversation) {
        const possibilities = await this.getAllPossibleBrIds(this.getMemberId(message));
        const from: Identity = conversation.members.find((member) => possibilities.includes(member.id));
        const to: Identity = conversation.members.find((member) => member.type == IdentityType.bot);
        const activity: ActivityDto = {
            from,
            type: ActivityType.message,
            to,
            hash: message.payload.id,
            text: message?.payload?.payload?.text || message?.payload?.payload?.emoji || '',
        };

        activity.timestamp = moment().valueOf();

        const gsId = message.payload?.context?.gsId || message?.payload?.payload?.gsId || message?.payload?.payload?.id;
        if (gsId) {
            activity.quoted = gsId || message.payload.context.id;
        }

        if (message.payload.type === 'reaction' && (message?.payload?.payload?.gsId || message?.payload?.payload?.id)) {
            activity.data = {
                reactionHash: message?.payload?.payload?.gsId || message?.payload?.payload?.id,
            };
        }

        try {
            if (
                ['button_reply', 'quick_reply', 'list_reply'].includes(message?.payload?.type) &&
                message?.payload?.payload?.title
            ) {
                activity.data = {
                    ...(activity?.data || {}),
                    replyTitle: message.payload.payload.title,
                };
            }
        } catch (error) {
            console.error('ERROR process to add replyTitle in activity.data: ', error);
        }

        return activity;
    }

    getMemberId(message: GupshupMessage): string {
        return `${message.payload.source}`;
    }

    convertContactToAttachment(contact: GupshupContact) {
        return {
            contentType: 'application/contact',
            content: contact,
        };
    }

    getActivtyGupshupIdHashCacheKey(id: string) {
        return `GSID:${id}`;
    }

    getActivtyHashGupshupIdCacheKey(id: string) {
        return `AHASH:${id}`;
    }

    async setGupshupIdHash(id: string, hash: string, isHsm = false) {
        const client = await this.cacheService.getClient();
        let key = this.getActivtyGupshupIdHashCacheKey(id);
        await client.set(key, hash, 'EX', 86400);

        //GUARDA O ID DA MENSAGEM DO GUPSHUP A PARTIR DO HASH DA ACTIVITY PARA PODERMOS DEPURAR OS ACKS
        //const gskey = this.getActivtyHashGupshupIdCacheKey(hash);
        //await client.set(gskey, id, 'EX', 86400 * 3);
    }

    getAxiosInstance(): AxiosInstance {
        const instance = axios.create({
            timeout: 10 * 1000,
        });

        axiosRetry(instance, {
            retries: 2,
            retryCondition: (err) => {
                return true; //err?.response?.status >= 400;
            },
            retryDelay: () => 500,
        });
        return instance;
    }

    async getAllPossibleBrIds(memberId: string): Promise<string[]> {
        let mismatch: MismatchWaid = await this.mismatchWaidService.getMismatchWaidAndPhoneNumber(memberId);
        let option1 = mismatch?.phoneNumber;
        let option2 = mismatch?.waid;
        if (!option1 || !option2) {
            return getWithAndWithout9PhoneNumber(memberId);
        }

        return [option1, option2];
    }
}
