import { Injectable, Logger } from '@nestjs/common';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { AutoAssignConversation } from '../models/auto-assign-conversation.entity';
import {
    CreateAutoAssignConversation,
    UpdateAutoAssignConversation,
} from '../interfaces/auto-assign-conversation.interface';
import { PaginatedModel } from '../../../common/interfaces/paginated';
import { AutoAssignConversationFilterInterface } from '../interfaces/auto-assign-conversation-filter.interface';
import { ContactAutoAssignService } from './contact-auto-assign.service';
import { ContactAutoAssign } from '../models/contact-auto-assign.entity';
import { CacheService } from '../../_core/cache/cache.service';
import { CustomConflictException } from '../../auth/exceptions';
import { getWithAndWithout9PhoneNumber } from 'kissbot-core';
import { getCompletePhone } from '../../../common/utils/utils';
import { AUTO_ASSIGN_CONNECTION } from '../ormconfig';

@Injectable()
export class AutoAssignConversationService {
    private readonly logger = new Logger(AutoAssignConversationService.name);
    constructor(
        @InjectRepository(AutoAssignConversation, AUTO_ASSIGN_CONNECTION)
        public AutoAssignConversationRepository: Repository<AutoAssignConversation>,
        private readonly ContactAutoAssignService: ContactAutoAssignService,
        @InjectConnection(AUTO_ASSIGN_CONNECTION)
        private connection: Connection,
        public cacheService: CacheService,
    ) {}

    private getContactAutoAssignPrefixCacheKey(workspaceId: string, channelConfigId: string, phone: string): string {
        return `AUTO_ASSIGN_CONTACT_PHONE:${workspaceId}:${channelConfigId}:${phone}`;
    }

    private getContactAutoAssignByWorkspaceIdPrefixCacheKey(workspaceId: string): string {
        return `API:AUTO_ASSIGN_CONTACT_PHONE:${workspaceId}:*`;
    }

    private getAutoAssignPrefixCacheKey(workspaceId: string, autoAssignConversationId: string): string {
        return `AUTO_ASSIGN:${workspaceId}:${autoAssignConversationId}`;
    }

    private getAutoAssignByWorkspaceIdPrefixCacheKey(workspaceId: string): string {
        return `API:AUTO_ASSIGN:${workspaceId}:*`;
    }

    private async setContactAutoAssignCacheKey(
        workspaceId: string,
        channelConfigId: string,
        phone: string,
        autoAssignConversationId: string,
    ) {
        let sanitizePhone = phone;
        if (phone.startsWith('+')) {
            sanitizePhone = phone.substring(1);
        }
        const client = await this.cacheService.getClient();
        const key = this.getContactAutoAssignPrefixCacheKey(workspaceId, channelConfigId, sanitizePhone);
        await client.set(key, autoAssignConversationId);
    }

    private async getContactAutoAssignCacheKey(
        workspaceId: string,
        channelConfigId: string,
        phone: string,
    ): Promise<string> {
        const client = await this.cacheService.getClient();
        const key = this.getContactAutoAssignPrefixCacheKey(workspaceId, channelConfigId, phone);
        return await client.get(key);
    }

    private async setAutoAssignCacheKey(
        workspaceId: string,
        autoAssignConversationId: string,
        autoAssignConversation: AutoAssignConversation,
    ) {
        const client = await this.cacheService.getClient();
        const key = this.getAutoAssignPrefixCacheKey(workspaceId, autoAssignConversationId);
        await client.set(key, JSON.stringify(autoAssignConversation));
    }

    private async getAutoAssignFromCache(
        workspaceId: string,
        autoAssignConversationId: string,
    ): Promise<AutoAssignConversation> {
        const client = await this.cacheService.getClient();
        const key = this.getAutoAssignPrefixCacheKey(workspaceId, autoAssignConversationId);
        const autoAssignConversation = await client.get(key);
        return JSON.parse(autoAssignConversation);
    }

    @CatchError()
    async getOne(id: number, workspaceId: string) {
        const autoAssignConversationAndContactAutoAssign =
            await this.AutoAssignConversationRepository.createQueryBuilder('auto_assign_conversation')
                .select('auto_assign_conversation')
                .where('auto_assign_conversation.workspace_id = :workspaceId', {
                    workspaceId: workspaceId,
                })
                .andWhere('auto_assign_conversation.id = :id', {
                    id: id,
                })
                .leftJoinAndMapMany(
                    'auto_assign_conversation.contacts',
                    ContactAutoAssign,
                    'contactAutoAssign',
                    `contactAutoAssign.workspace_id = auto_assign_conversation.workspace_id AND ${id} = ANY(contactAutoAssign.auto_assign_conversation_ids)`,
                )
                .getOne();

        return autoAssignConversationAndContactAutoAssign;
    }

    // Função executa uma busca no Redis por um contato com a chave workspaceId:channelConfigId:phone
    // Caso exista este contato guarda o número id do autoAssign
    // Fazendo então uma nova consulta no Redis buscando o AutoAssign pelo workspaceId:AutoAssignId
    @CatchError()
    async getAutoAssignConversationByContactPhone(workspaceId: string, channelConfigId: string, phone: string) {
        try {
            const phoneId = getCompletePhone(phone);
            const [opt1, opt2] = getWithAndWithout9PhoneNumber(phoneId);

            let autoAssignConversationId = await this.getContactAutoAssignCacheKey(workspaceId, channelConfigId, opt1);

            if (!autoAssignConversationId) {
                autoAssignConversationId = await this.getContactAutoAssignCacheKey(workspaceId, channelConfigId, opt2);
            }

            if (autoAssignConversationId) {
                return await this.getAutoAssignFromCache(workspaceId, autoAssignConversationId);
            }

            return undefined;
        } catch (e) {
            this.logger.error('getAutoAssignConversationByContactPhone');
            this.logger.error(e);
            return undefined;
        }
    }

    @CatchError()
    async listByWorkspaceIdAndQuery(
        workspaceId: string,
        query?: {
            skip?: number;
            limit?: number;
            search?: string;
            filter?: AutoAssignConversationFilterInterface;
        },
    ): Promise<PaginatedModel<AutoAssignConversation>> {
        const skip = query?.skip || 0;
        const limit = query?.limit || 10;

        try {
            let qb = this.AutoAssignConversationRepository.createQueryBuilder('auto_assign_conversation');

            qb = qb.andWhere('auto_assign_conversation.workspace_id = :workspaceId', {
                workspaceId: workspaceId,
            });

            if (query?.search) {
                qb = qb.andWhere(`unaccent(auto_assign_conversation.name) ILIKE unaccent(:query)`, {
                    query: `%${query.search}%`,
                });
            }

            if (query?.filter) {
                if (query.filter?.phone) {
                    qb = qb.andWhere('auto_assign_conversation.phone = :phone', {
                        phone: query.filter.phone,
                    });
                }

                if (query.filter?.teamId) {
                    qb = qb.andWhere('auto_assign_conversation.team_id = :teamId', {
                        teamId: query.filter.teamId,
                    });
                }

                if (query.filter?.channelConfigIds && query.filter.channelConfigIds?.length) {
                    qb = qb.andWhere(`auto_assign_conversation.channel_config_id IN (:...channelConfigIdList)`, {
                        channelConfigIdList: query.filter.channelConfigIds,
                    });
                }
            }

            let qbCount = qb.clone();
            let qbData = qb.clone();

            if (query?.skip) {
                qbData = qbData.skip(skip);
            }
            if (query?.limit) {
                qbData = qbData.take(limit);
            }
            qbData = qbData
                .addOrderBy('id', 'DESC')
                .select('auto_assign_conversation.id', 'id')
                .addSelect('auto_assign_conversation.name', 'name')
                .addSelect('auto_assign_conversation.workspace_id', 'workspaceId')
                .addSelect('auto_assign_conversation.team_id', 'teamId')
                .addSelect('auto_assign_conversation.channel_config_ids', 'channelConfigIds')
                .addSelect('auto_assign_conversation.enable_rating', 'enableRating')
                .addSelect((qb) => {
                    qb.from(ContactAutoAssign, 'contact_auto_assign')
                        .select(`count(contact_auto_assign.id)`)
                        .where(`auto_assign_conversation.id = ANY(contact_auto_assign.auto_assign_conversation_ids)`);
                    return qb;
                }, 'contactCount');

            const data = await qbData.getRawMany();
            const count = await qbCount.getCount();

            const currentPage = query?.skip && query?.limit ? skip / limit + 1 : null;

            return {
                count: count,
                data: data,
                currentPage: currentPage,
                nextPage: null,
            };
        } catch (err) {
            console.log(err);
        }
    }

    // Função busca se determinados autoAssignIds possuem determinados canais cadastrados
    @CatchError()
    async getAutoAssignListByIdsAndChannelConfigIds(autoAssignIds: number[], channelConfigIds: string[]) {
        try {
            if (!autoAssignIds?.length) {
                return [];
            }
            const channelsToString = channelConfigIds.reduce((total, curr, index) => {
                if (index == 0) {
                    return `'${curr}'`;
                }
                return `${total},'${curr}'`;
            }, '');
            return await this.AutoAssignConversationRepository.createQueryBuilder('auto_assign_conversation')
                .andWhere(`auto_assign_conversation.id IN (${autoAssignIds.toString()})`)
                .andWhere(
                    `auto_assign_conversation.channel_config_ids && CAST(ARRAY [${channelsToString}] as character varying[])`,
                )
                .getMany();
        } catch (e) {
            console.log('getAutoAssignListByIdsAndChannelConfigIds ', e);
        }
    }

    // Função verifica se existe contatos já criados em outros autoAssign que cotenham algum canal igual
    // Caso exista retorna um erro com os telefones que estao em outro assign que o canal já esta sendo utilizado
    // Se não retorna os contatos que deram match no telefone que já existam em outro autoAssign
    async checkDuplicatedContactAutoAssign(
        workspaceId: string,
        channelConfigIds: string[],
        contacts: Partial<ContactAutoAssign>[],
        autoAssignId?: number,
    ) {
        const phones = contacts.filter((contact) => !!contact.phone).map((currContact) => currContact.phone);
        const arrayContactAutoAssign = await this.ContactAutoAssignService.getContactAutoAssignListByPhones(
            workspaceId,
            phones,
        );

        if (!arrayContactAutoAssign.length) {
            return arrayContactAutoAssign;
        }

        const autoAssignIds: { [autoAssignId: number]: string[] } = {};

        arrayContactAutoAssign.forEach((currContact) => {
            if (currContact?.autoAssignConversationIds?.length) {
                currContact.autoAssignConversationIds.forEach((id) => {
                    autoAssignIds[id] = [...(autoAssignIds?.[id] || []), currContact.phone];
                });
            }
        });

        const ids = Object.keys(autoAssignIds)
            .map((key) => Number(key))
            .filter((id) => id !== autoAssignId);

        const autoAssignList = await this.getAutoAssignListByIdsAndChannelConfigIds(ids, channelConfigIds);

        if (autoAssignList?.length) {
            const duplicateContactInAutoAssignWithEqualChannel = autoAssignList.map((currAutoAssign) => {
                return autoAssignIds[currAutoAssign.id];
            });

            throw new CustomConflictException({
                error: 'ERROR_CONTACT_AUTO_ASSIGN_CONVERSATION',
                message: Exceptions.ERROR_CONTACT_AUTO_ASSIGN_CONVERSATION.message,
                data: duplicateContactInAutoAssignWithEqualChannel.flat(),
            });
        }

        return arrayContactAutoAssign;
    }

    @CatchError()
    async create(data: CreateAutoAssignConversation) {
        let arrayContactAutoAssign: ContactAutoAssign[] = [];
        const channelConfigIds = data.channelConfigIds?.map((channelConfigId) => String(channelConfigId));

        if (data?.contacts?.length) {
            arrayContactAutoAssign = await this.checkDuplicatedContactAutoAssign(
                data.workspaceId,
                channelConfigIds,
                data.contacts,
            );
        }

        const result = await this.AutoAssignConversationRepository.save({
            name: data.name,
            workspaceId: data.workspaceId,
            teamId: data.teamId,
            channelConfigIds: channelConfigIds,
            enableRating: data.enableRating,
        });

        if (data?.contacts?.length) {
            try {
                await Promise.all(
                    data.contacts.map(async (contact) => {
                        if (!contact.phone) {
                            return;
                        }

                        if (contact.phone.startsWith('+')) {
                            contact.phone = contact.phone.substring(1);
                        }
                        const existContactAutoAssign = arrayContactAutoAssign.find(
                            (currContact) => currContact.phone === contact.phone,
                        );

                        let createdContact;

                        if (!existContactAutoAssign) {
                            createdContact = await this.ContactAutoAssignService.create({
                                name: contact.name,
                                phone: contact.phone,
                                contactId: contact.contactId,
                                autoAssignConversationIds: [result.id],
                                workspaceId: data.workspaceId,
                            });
                        } else {
                            createdContact = await this.ContactAutoAssignService.update(existContactAutoAssign.id, {
                                name: contact.name,
                                contactId: contact.contactId,
                                autoAssignConversationIds: [
                                    ...existContactAutoAssign.autoAssignConversationIds,
                                    result.id,
                                ],
                            });
                        }

                        result.channelConfigIds.forEach(async (channelConfigId) => {
                            await this.setContactAutoAssignCacheKey(
                                data.workspaceId,
                                channelConfigId,
                                contact.phone,
                                `${result.id}`,
                            );
                        });

                        return createdContact;
                    }),
                );
            } catch (erro) {
                console.log('ERRO CREATE CONTACT ON CREATE AUTOASSIGNCONVERSATION: ', erro);
            }
        }

        await this.updateAutoAssignByWorkspaceWithRedis(data.workspaceId);

        return result;
    }

    // Update com transaction para que tenha certeza que os dados serão criados/atualizados
    // tanto no ContactAutoAssignRepository quanto no AutoAssignRepository
    @CatchError()
    async update(id: number, workspaceId: string, data: UpdateAutoAssignConversation) {
        const autoAssignConversation = await this.getOne(id, workspaceId);
        const channelConfigIds = data.channelConfigIds?.map((channelConfigId) => String(channelConfigId));

        if (!autoAssignConversation) {
            throw Exceptions.NOT_FOUND;
        }

        let arrayContactAutoAssign: ContactAutoAssign[] = [];

        if (data?.contacts?.length) {
            arrayContactAutoAssign = await this.checkDuplicatedContactAutoAssign(
                workspaceId,
                channelConfigIds,
                data.contacts,
                id,
            );
        }

        const queryRunner = this.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            try {
                const contacts =
                    data?.contacts?.map((contact) => {
                        if (contact.phone.startsWith('+')) {
                            contact.phone = contact.phone.substring(1);
                        }
                        const existContactAutoAssign = arrayContactAutoAssign.find(
                            (currContact) => currContact.phone === contact.phone,
                        );

                        let createdContact;

                        if (!existContactAutoAssign) {
                            createdContact = {
                                name: contact.name,
                                phone: contact.phone,
                                contactId: contact.contactId,
                                autoAssignConversationIds: [id],
                                workspaceId: workspaceId,
                            };
                        } else {
                            const newAutoAssignConversationIds = [...existContactAutoAssign.autoAssignConversationIds];

                            if (
                                !newAutoAssignConversationIds.find(
                                    (autoAssignId) => Number(autoAssignId) === Number(id),
                                )
                            ) {
                                newAutoAssignConversationIds.push(id);
                            }
                            createdContact = {
                                id: existContactAutoAssign.id,
                                name: contact.name,
                                phone: contact.phone,
                                contactId: contact.contactId,
                                autoAssignConversationIds: newAutoAssignConversationIds,
                            };
                        }
                        return createdContact;
                    }) || [];
                await this.ContactAutoAssignService.onUpdateAutoAssignConversation(
                    id,
                    workspaceId,
                    queryRunner,
                    contacts,
                );
            } catch (erro) {
                console.log('ERRO CREATE CONTACT ON UPDATE AUTOASSIGNCONVERSATION: ', erro);
                await queryRunner.rollbackTransaction();
                throw erro;
            }

            const result = await queryRunner.manager.update(
                AutoAssignConversation,
                {
                    id: id,
                },
                {
                    name: data.name,
                    channelConfigIds: channelConfigIds,
                    teamId: data.teamId,
                    enableRating: data.enableRating,
                },
            );

            await queryRunner.commitTransaction();

            if (result.affected > 0) {
                await this.updateAutoAssignByWorkspaceWithRedis(workspaceId);
            }
            return {
                ok: result.affected > 0,
            };
        } catch (e) {
            await queryRunner.rollbackTransaction();
            throw e;
        } finally {
            await queryRunner.release();
        }
    }

    // Função que da um softDelete no autoAssign e remove do campo autoAssignConversationIds dos contatos o id deste autoAssign
    @CatchError()
    async softDelete(workspaceId: string, id: number) {
        await this.ContactAutoAssignService.softDeleteContactAutoAssignByAutoAssignId(workspaceId, id);

        const result = await this.AutoAssignConversationRepository.softDelete({
            id,
        });

        await this.updateAutoAssignByWorkspaceWithRedis(workspaceId);

        return result;
    }

    // Função que atualiza os dados de todos os autoAssign e ContactAutoAssign no Redis com base no workspaceId
    @CatchError()
    async updateAutoAssignByWorkspaceWithRedis(workspaceId: string) {
        const autoAssignList = await this.AutoAssignConversationRepository.createQueryBuilder(
            'auto_assign_conversation',
        )
            .select('auto_assign_conversation')
            .where('auto_assign_conversation.workspace_id = :workspaceId', {
                workspaceId: workspaceId,
            })
            .innerJoinAndMapMany(
                'auto_assign_conversation.contacts',
                ContactAutoAssign,
                'contactAutoAssign',
                `contactAutoAssign.workspace_id = auto_assign_conversation.workspace_id AND auto_assign_conversation.id = ANY(contactAutoAssign.auto_assign_conversation_ids)`,
            )
            .getMany();

        const client = await this.cacheService.getClient();
        // essa chave precisa ter o prefixo API: pq não é aplicado por default pelo client
        const keysContactAutoAssign = await client.keys(
            this.getContactAutoAssignByWorkspaceIdPrefixCacheKey(workspaceId),
        );
        // essa chave precisa ter o prefixo API: pq não é aplicado por default pelo client
        const keysAutoAssign = await client.keys(this.getAutoAssignByWorkspaceIdPrefixCacheKey(workspaceId));

        for (const key of keysContactAutoAssign) {
            await client.del(key.slice(4));
        }
        for (const key of keysAutoAssign) {
            await client.del(key.slice(4));
        }

        if (autoAssignList?.length) {
            autoAssignList.forEach(async (currAutoAssign) => {
                currAutoAssign.channelConfigIds.forEach(async (channelConfigId) => {
                    currAutoAssign.contacts.forEach(async (currContact) => {
                        await this.setContactAutoAssignCacheKey(
                            workspaceId,
                            channelConfigId,
                            currContact.phone,
                            String(currAutoAssign.id),
                        );
                    });
                });

                const newAutoAssign = { ...currAutoAssign };
                delete newAutoAssign.contacts;

                await this.setAutoAssignCacheKey(workspaceId, String(currAutoAssign.id), newAutoAssign);
            });
        }
    }
}
