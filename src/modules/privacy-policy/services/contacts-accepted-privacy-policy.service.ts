import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../_core/cache/cache.service';
import * as moment from 'moment';
import { ExternalDataService } from './external-data.service';
import { Exceptions } from '../../auth/exceptions';
import { castObjectIdToString, getCompletePhone } from '../../../common/utils/utils';
import { ChannelIdConfig, getWithAndWithout9PhoneNumber } from 'kissbot-core';

@Injectable()
export class ContactsAcceptedPrivacyPolicyService {
    private readonly logger = new Logger(ContactsAcceptedPrivacyPolicyService.name);
    constructor(public cacheService: CacheService, private readonly externalDataService: ExternalDataService) {}

    private getContactsAcceptedPrivacyPolicyPrefixCacheKey(workspaceId: string, channelConfigId: string): string {
        // C_ACPT_PP = CONTACTS_ACCEPTED_PRIVACY_POLICY
        return `C_ACPT_P_P:${workspaceId}:${channelConfigId}`;
    }

    private getContactsAcceptedPrivacyPolicyByWorkspaceIdPrefixCacheKey(workspaceId: string): string {
        return `API:C_ACPT_P_P:${workspaceId}:*`;
    }

    public async setContactAcceptedByPhoneCacheKey(workspaceId: string, channelConfigId: string, phone: string) {
        const channelConfig = await this.externalDataService.getChannelConfigByIdOrToken(channelConfigId);

        if (!channelConfig) {
            throw Exceptions.INVALID_CHANNELCONFIG;
        }

        if (channelConfig.channelId === ChannelIdConfig.gupshup) {
            const client = await this.cacheService.getClient();
            const key = this.getContactsAcceptedPrivacyPolicyPrefixCacheKey(
                workspaceId,
                castObjectIdToString(channelConfig._id),
            );
            const date = moment().valueOf();
            await client.hset(key, {
                [phone]: date,
            });
        }
    }

    public async getContactAcceptedByPhoneFromCache(
        workspaceId: string,
        channelConfigId: string,
        phone: string,
    ): Promise<{ acceptanceAt: string }> {
        const channelConfig = await this.externalDataService.getChannelConfigByIdOrToken(channelConfigId);

        if (!channelConfig) {
            throw Exceptions.INVALID_CHANNELCONFIG;
        }
        const client = await this.cacheService.getClient();
        const key = this.getContactsAcceptedPrivacyPolicyPrefixCacheKey(
            workspaceId,
            castObjectIdToString(channelConfig._id),
        );
        phone = getCompletePhone(phone);
        const [opt1, opt2] = getWithAndWithout9PhoneNumber(phone);
        let contactAccepted = await client.hget(key, opt1);
        if (!contactAccepted) {
            contactAccepted = await client.hget(key, opt2);
        }
        return { acceptanceAt: contactAccepted };
    }

    public async deleteContactsAcceptedByWorkspaceIdFromCache(workspaceId: string): Promise<void> {
        const client = await this.cacheService.getClient();
        // essa chave precisa ter o prefixo API: pq não é aplicado por default pelo client
        const keysContactsAccepted = await client.keys(
            this.getContactsAcceptedPrivacyPolicyByWorkspaceIdPrefixCacheKey(workspaceId),
        );
        // slice ira remover os 4 primeiros caracteres (API:), para entao fazer o delete da chave
        for (const key of keysContactsAccepted) {
            await client.del(key.slice(4));
        }
    }

    public async deleteContactsAcceptedByWorkspaceIdAndChannelConfigIdFromCache(
        workspaceId: string,
        channelConfigId: string,
    ): Promise<void> {
        const client = await this.cacheService.getClient();
        const keysContactsAccepted = this.getContactsAcceptedPrivacyPolicyPrefixCacheKey(workspaceId, channelConfigId);
        await client.del(keysContactsAccepted);
    }
}
