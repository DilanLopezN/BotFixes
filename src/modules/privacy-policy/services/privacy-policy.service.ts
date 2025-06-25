import { Injectable, Logger } from '@nestjs/common';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { CacheService } from '../../_core/cache/cache.service';
import { PrivacyPolicy } from '../models/privacy-policy.entity';
import { PRIVACY_POLICY } from '../ormconfig';
import { CreatePrivacyPolicy, UpdatePrivacyPolicy } from '../interfaces/privacy-policy.interface';
import * as moment from 'moment';
import { ContactsAcceptedPrivacyPolicyService } from './contacts-accepted-privacy-policy.service';
import { ExternalDataService } from './external-data.service';

@Injectable()
export class PrivacyPolicyService {
    private readonly logger = new Logger(PrivacyPolicyService.name);
    constructor(
        @InjectRepository(PrivacyPolicy, PRIVACY_POLICY)
        public privacyPolicyRepository: Repository<PrivacyPolicy>,
        @InjectConnection(PRIVACY_POLICY)
        private connection: Connection,
        public cacheService: CacheService,
        private readonly contactsAcceptedPrivacyPolicyService: ContactsAcceptedPrivacyPolicyService,
        private readonly externalDataService: ExternalDataService,
    ) {}

    private getPrivacyPolicyPrefixCacheKey(workspaceId: string, channelConfigId: string): string {
        return `PRIVACY_POLICY:${workspaceId}:${channelConfigId}`;
    }

    private async setPrivacyPolicyCacheKey(workspaceId: string, channelConfigId: string, data: PrivacyPolicy) {
        const client = await this.cacheService.getClient();
        const key = this.getPrivacyPolicyPrefixCacheKey(workspaceId, channelConfigId);
        await client.set(key, JSON.stringify(data));
    }

    private async getPrivacyPolicyFromCache(workspaceId: string, channelConfigId: string): Promise<PrivacyPolicy> {
        const client = await this.cacheService.getClient();
        const key = this.getPrivacyPolicyPrefixCacheKey(workspaceId, channelConfigId);
        const privacyPolicy = await client.get(key);
        return JSON.parse(privacyPolicy);
    }

    private async deletePrivacyPolicyByWorkspaceIdAndChannelConfigIdFromCache(
        workspaceId: string,
        channelConfigId: string,
    ): Promise<void> {
        const client = await this.cacheService.getClient();
        const key = this.getPrivacyPolicyPrefixCacheKey(workspaceId, channelConfigId);
        await client.del(key);
    }

    @CatchError()
    async getOne(id: number, workspaceId: string): Promise<PrivacyPolicy> {
        return await this.privacyPolicyRepository
            .createQueryBuilder('privacy_policy')
            .select('privacy_policy')
            .where('privacy_policy.workspace_id = :workspaceId', {
                workspaceId: workspaceId,
            })
            .andWhere('privacy_policy.id = :id', {
                id: id,
            })
            .getOne();
    }

    @CatchError()
    async getPrivacyPolicyByChannelConfigId(workspaceId: string, channelConfigToken: string): Promise<PrivacyPolicy> {
        const channelConfig = await this.externalDataService.getChannelConfigByIdOrToken(channelConfigToken);

        if (!channelConfig) {
            throw Exceptions.INVALID_CHANNELCONFIG;
        }

        let privacyPolicy = await this.getPrivacyPolicyFromCache(workspaceId, String(channelConfig._id));

        if (privacyPolicy) {
            return privacyPolicy;
        }

        privacyPolicy = await this.privacyPolicyRepository
            .createQueryBuilder('privacy_policy')
            .select('privacy_policy')
            .where('privacy_policy.workspace_id = :workspaceId', {
                workspaceId: workspaceId,
            })
            .andWhere(
                `privacy_policy.channel_config_ids && CAST(ARRAY ['${String(
                    channelConfig._id,
                )}'] as character varying[])`,
            )
            .getOne();

        if (privacyPolicy && privacyPolicy.channelConfigIds.length) {
            for (const channelConfigId of privacyPolicy.channelConfigIds) {
                await this.setPrivacyPolicyCacheKey(workspaceId, channelConfigId, privacyPolicy);
            }
        }

        return privacyPolicy;
    }

    @CatchError()
    async listByWorkspaceId(workspaceId: string): Promise<PrivacyPolicy[]> {
        let qb = this.privacyPolicyRepository
            .createQueryBuilder('privacy_policy')
            .andWhere('privacy_policy.workspace_id = :workspaceId', {
                workspaceId: workspaceId,
            });

        const result = await qb.getMany();
        return result;
    }

    // Função verifica se possui algum privacy policy com algum channelConfig já cadastrado em outro privacy policy
    // Caso possuir retorna erro
    async checkDuplicatedChannelConfig(workspaceId: string, channelConfigIds: string[], privacyPolicyId?: number) {
        if (channelConfigIds.length) {
            const channelsToString = channelConfigIds.reduce((total, curr, index) => {
                if (index == 0) {
                    return `'${curr}'`;
                }
                return `${total},'${curr}'`;
            }, '');
            let queryBuilder = this.privacyPolicyRepository
                .createQueryBuilder('privacy_policy')
                .andWhere('privacy_policy.workspace_id = :workspaceId', {
                    workspaceId: workspaceId,
                })
                .andWhere(
                    `privacy_policy.channel_config_ids && CAST(ARRAY [${channelsToString}] as character varying[])`,
                );

            if (privacyPolicyId) {
                queryBuilder = queryBuilder.andWhere('privacy_policy.id <> :privacyPolicyId', {
                    privacyPolicyId: privacyPolicyId,
                });
            }

            const result = await queryBuilder.getOne();

            if (result) {
                throw Exceptions.ERROR_DUPLICATED_CHANNEL_CONFIG_PRIVACY_POLICY;
            }
        }
    }

    // Função verifica se o channelConfigId é válido
    async verifyChannelConfig(channelConfigIds: string[]) {
        for (const channelConfigId of channelConfigIds) {
            const channelConfig = await this.externalDataService.getChannelConfigByIdOrToken(channelConfigId);

            if (!channelConfig) {
                throw Exceptions.INVALID_CHANNELCONFIG;
            }
        }
    }

    @CatchError()
    async create(data: CreatePrivacyPolicy) {
        const channelConfigIds = data.channelConfigIds?.map((channelConfigId) => String(channelConfigId));

        await this.verifyChannelConfig(data.channelConfigIds);
        await this.checkDuplicatedChannelConfig(data.workspaceId, channelConfigIds);

        const result = await this.privacyPolicyRepository.save({ ...data, channelConfigIds });

        // falta a response de privacy policy para implementar
        await this.externalDataService.updateInteractionWelcome(data.workspaceId);

        return result;
    }

    // Update vai deletar os aceites no redis caso o texto mude
    @CatchError()
    async update(id: number, workspaceId: string, userId: string, data: UpdatePrivacyPolicy) {
        const privacyPolicy = await this.getOne(id, workspaceId);
        let deleteContactsAccepted = false;

        if (!privacyPolicy) {
            throw Exceptions.NOT_FOUND;
        }

        const channelConfigIds = data.channelConfigIds?.map((channelConfigId) => String(channelConfigId));
        await this.verifyChannelConfig(data.channelConfigIds);
        await this.checkDuplicatedChannelConfig(data.workspaceId, channelConfigIds, id);

        if (privacyPolicy.text !== data.text) {
            deleteContactsAccepted = true;
            data.updateAcceptanceAt = moment().toDate();
        }

        const result = await this.privacyPolicyRepository.update(
            { id: privacyPolicy.id },
            {
                ...privacyPolicy,
                text: data.text,
                acceptButtonText: data.acceptButtonText,
                rejectButtonText: data.rejectButtonText,
                channelConfigIds: data.channelConfigIds,
                updateAcceptanceAt: data.updateAcceptanceAt || privacyPolicy.updateAcceptanceAt,
            },
        );

        for (const channelConfigId of privacyPolicy.channelConfigIds) {
            await this.deletePrivacyPolicyByWorkspaceIdAndChannelConfigIdFromCache(workspaceId, channelConfigId);
            if (deleteContactsAccepted) {
                await this.contactsAcceptedPrivacyPolicyService.deleteContactsAcceptedByWorkspaceIdAndChannelConfigIdFromCache(
                    workspaceId,
                    channelConfigId,
                );
            }
        }

        return { ok: result.affected > 0 };
    }

    @CatchError()
    async softDeletePrivacyPolicy(id: number, workspaceId: string) {
        const privacyPolicy = await this.getOne(id, workspaceId);

        if (!privacyPolicy) {
            throw Exceptions.NOT_FOUND;
        }
        const result = await this.privacyPolicyRepository.softDelete({
            workspaceId,
            id,
        });

        if (result.affected > 0) {
            for (const channelConfigId of privacyPolicy.channelConfigIds) {
                await this.deletePrivacyPolicyByWorkspaceIdAndChannelConfigIdFromCache(workspaceId, channelConfigId);
                await this.contactsAcceptedPrivacyPolicyService.deleteContactsAcceptedByWorkspaceIdAndChannelConfigIdFromCache(
                    workspaceId,
                    channelConfigId,
                );
            }
        }

        return result;
    }

    @CatchError()
    async restartPrivacyPolicyAcceptance(privacyPolicyId: number, workspaceId: string): Promise<{ ok: boolean }> {
        const privacyPolicy = await this.getOne(privacyPolicyId, workspaceId);

        if (!privacyPolicy) {
            throw Exceptions.NOT_FOUND;
        }

        await this.privacyPolicyRepository.update(
            { id: privacyPolicy.id },
            {
                updateAcceptanceAt: moment().toDate(),
            },
        );

        for (const channelConfigId of privacyPolicy.channelConfigIds) {
            await this.contactsAcceptedPrivacyPolicyService.deleteContactsAcceptedByWorkspaceIdAndChannelConfigIdFromCache(
                workspaceId,
                channelConfigId,
            );
        }

        return { ok: true };
    }
}
