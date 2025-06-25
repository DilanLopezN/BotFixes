import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 } from 'uuid';
import { AUTO_ASSIGN_CONNECTION } from '../ormconfig';
import { CacheModule } from '../../_core/cache/cache.module';
import { AutoAssignConversationService } from '../services/auto-assign-conversation.service';
import { AutoAssignConversation } from '../models/auto-assign-conversation.entity';
import { ContactAutoAssign } from '../models/contact-auto-assign.entity';
import { ContactAutoAssignService } from '../services/contact-auto-assign.service';
import { ExternalDataService } from '../services/external-data.service';
import {
    CreateAutoAssignConversation,
    UpdateAutoAssignConversation,
} from '../interfaces/auto-assign-conversation.interface';
import { ExternalDataMockService } from './mocks/external-data-mock.service';

describe('MODULE: auto-assign', () => {
    let moduleRef: TestingModule;
    let autoAssignConversationService: AutoAssignConversationService;
    let contactAutoAssignService: ContactAutoAssignService;
    let externalDataMockService: ExternalDataMockService;

    const workspaceId = v4();
    const channelConfigId1 = v4();
    const channelConfigId2 = v4();
    const channelConfigId3 = v4();
    const teamId1 = v4();
    const teamId2 = v4();
    const contact1 = {
        name: 'contato1',
        phone: '5548987654321',
        workspaceId: workspaceId,
    };
    const contact2 = {
        name: 'contato2',
        phone: '5548912345678',
        workspaceId: workspaceId,
    };
    const contact3 = {
        name: 'contato3',
        phone: '5548900011122',
        workspaceId: workspaceId,
    };
    const contact4 = {
        name: 'contato4',
        phone: '5548988776655',
        workspaceId: workspaceId,
    };
    const contact5 = {
        name: 'contato5',
        phone: '5548944332211',
        workspaceId: workspaceId,
    };
    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    name: AUTO_ASSIGN_CONNECTION,
                    // Banco dados teste
                    url: process.env.POSTGRESQL_URI_TESTS || 'postgres://postgres:@localhost/tests',
                    entities: [AutoAssignConversation, ContactAutoAssign],
                    synchronize: true,
                    migrationsRun: false,
                    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
                    schema: AUTO_ASSIGN_CONNECTION,
                }),
                TypeOrmModule.forFeature([AutoAssignConversation, ContactAutoAssign], AUTO_ASSIGN_CONNECTION),
                CacheModule,
            ],
            providers: [
                AutoAssignConversationService,
                ContactAutoAssignService,
                {
                    useClass: ExternalDataMockService,
                    provide: ExternalDataService,
                },
            ],
        }).compile();
        autoAssignConversationService = moduleRef.get<AutoAssignConversationService>(AutoAssignConversationService);
        contactAutoAssignService = moduleRef.get<ContactAutoAssignService>(ContactAutoAssignService);
        externalDataMockService = moduleRef.get<ExternalDataMockService>(ExternalDataService);
    });

    describe('SERVICE: AutoAssignService', () => {
        // Está sendo testado todas as funções do service em apenas um teste pra não ter que repetir criação de dados em cada teste
        it('FUNCTION: create/listByWorkspaceIdAndQuery/update/delete/getOne/getAutoAssignConversationByContactPhone', async () => {
            jest.spyOn(externalDataMockService, 'getContactByPhone').mockImplementation(() =>
                Promise.resolve(undefined),
            );

            const data: CreateAutoAssignConversation = {
                workspaceId,
                channelConfigIds: [channelConfigId1, channelConfigId2],
                enableRating: true,
                name: 'teste',
                teamId: teamId1,
                contacts: [contact1, contact2, contact3],
            };

            const data2: CreateAutoAssignConversation = {
                ...data,
                teamId: teamId2,
                name: 'teste2',
                channelConfigIds: [channelConfigId3],
                enableRating: false,
                contacts: [contact4, contact5],
            };

            // Cria 2 registros um com dois canais e outro apenas com um
            const result = await autoAssignConversationService.create(data);
            const result2 = await autoAssignConversationService.create(data2);

            // Busca os registros criados
            let createdAutoAssignConversation: AutoAssignConversation = (await autoAssignConversationService.getOne(
                result?.id,
                workspaceId,
            )) as any;
            let createdAutoAssignConversation2: AutoAssignConversation = (await autoAssignConversationService.getOne(
                result2?.id,
                workspaceId,
            )) as any;

            // Valida se todos campos passados foram criados corretamente
            expect(createdAutoAssignConversation.name).toBe(data.name);
            expect(createdAutoAssignConversation.enableRating).toBe(data.enableRating);
            expect(createdAutoAssignConversation.teamId).toBe(data.teamId);
            expect(createdAutoAssignConversation.workspaceId).toBe(data.workspaceId);
            expect(createdAutoAssignConversation.channelConfigIds[0]).toBe(data.channelConfigIds[0]);
            expect(createdAutoAssignConversation.channelConfigIds[1]).toBe(data.channelConfigIds[1]);
            expect(createdAutoAssignConversation2.channelConfigIds[0]).toBe(data2.channelConfigIds[0]);
            expect(createdAutoAssignConversation2.contacts?.length).toBe(data2.contacts?.length);
            expect(!!createdAutoAssignConversation2.contacts?.find((contact) => contact.phone === contact4.phone)).toBe(
                true,
            );
            expect(!!createdAutoAssignConversation2.contacts?.find((contact) => contact.phone === contact5.phone)).toBe(
                true,
            );

            try {
                // Dados de canal e contato de um autoAssign já existente
                const createData2InvalidContactsByChannel: CreateAutoAssignConversation = {
                    ...result2,
                    channelConfigIds: result.channelConfigIds,
                    contacts: data.contacts,
                    workspaceId,
                };
                await autoAssignConversationService.create(createData2InvalidContactsByChannel);
            } catch (e) {
                // Valida se ocorreu o erro especifico ao criar um autoAssign com mesmos contatos para um canal que já esta sendo utilizado em outro autoAssign
                expect(e.response.error).toBe('ERROR_CONTACT_AUTO_ASSIGN_CONVERSATION');
                expect(e.response.message).toBe('auto sign already has a contact linked');
                expect(e.status).toBe(409);
            }

            // Busca a lista pelo workspace, deve retornar os 2 registros criados
            const list = (await autoAssignConversationService.listByWorkspaceIdAndQuery(workspaceId)) as any;

            // Valida se trouxe os 2 registros criados para o workspace
            expect(!!list?.data?.find((autoAssign) => autoAssign.id === result.id)).toBe(true);
            expect(!!list?.data?.find((autoAssign) => autoAssign.id === result2.id)).toBe(true);

            // Valida se a quantidade de contatos esta correta
            expect(list?.data?.find((autoAssign) => autoAssign.id === result.id)?.contactCount).toBe('3');
            expect(list?.data?.find((autoAssign) => autoAssign.id === result2.id)?.contactCount).toBe('2');

            // Atualiza o segundo registro criado
            const updateData2: UpdateAutoAssignConversation = {
                name: 'teste 02',
                teamId: result2.teamId,
                channelConfigIds: result2.channelConfigIds,
                enableRating: true,
                contacts: [contact4],
            };

            await autoAssignConversationService.update(result2.id, workspaceId, updateData2);

            let updatedAutoAssignResult2: AutoAssignConversation = (await autoAssignConversationService.getOne(
                result2?.id,
                workspaceId,
            )) as any;

            // Valida se todos campos foram atualizados corretamente
            // Campo workspaceId não pode ser atualizado
            expect(updatedAutoAssignResult2.enableRating).toBe(updateData2.enableRating);
            expect(updatedAutoAssignResult2.name).toBe(updateData2.name);
            expect(updatedAutoAssignResult2.teamId).toBe(updateData2.teamId);
            expect(updatedAutoAssignResult2.channelConfigIds).toStrictEqual(updateData2.channelConfigIds);
            expect(updatedAutoAssignResult2.contacts?.length).toBe(updateData2.contacts?.length);
            expect(updatedAutoAssignResult2.workspaceId).toBe(workspaceId);

            // Valida se encontra o segundo autoAssign (result2) no redis com base no contato4 e channel3 que haviam sido cadastrados, após ser atualizado
            const autoAssign2RedisUpdated = await autoAssignConversationService.getAutoAssignConversationByContactPhone(
                workspaceId,
                channelConfigId3,
                contact4.phone,
            );
            expect(autoAssign2RedisUpdated?.workspaceId).toBe(workspaceId);
            expect(autoAssign2RedisUpdated?.channelConfigIds).toStrictEqual(updateData2.channelConfigIds);
            expect(autoAssign2RedisUpdated?.enableRating).toBe(updateData2.enableRating);
            expect(autoAssign2RedisUpdated?.teamId).toBe(updateData2.teamId);
            expect(autoAssign2RedisUpdated?.id).toBe(result2.id);
            expect(autoAssign2RedisUpdated?.name).toBe(updateData2.name);

            // Valida se encontra o segundo autoAssign (result2) no redis com base no contato5 e channel3 com os contatos alterados após ser atualizado
            const autoAssign2RedisUpdated2 =
                await autoAssignConversationService.getAutoAssignConversationByContactPhone(
                    workspaceId,
                    channelConfigId3,
                    contact5.phone,
                );
            expect(autoAssign2RedisUpdated2).toBe(undefined);

            try {
                await autoAssignConversationService.update(0, workspaceId, updateData2);
            } catch (e) {
                let error = { statusCode: 404, message: 'Not found!', error: 'NOT_FOUND' };
                // Valida se ocorreu o erro especifico ao atualizar para um id invalido
                expect(e.response).toStrictEqual(error);
            }

            try {
                // Dados de canal e contato de um autoAssign diferente
                const updateData2InvalidContactsByChannel: UpdateAutoAssignConversation = {
                    ...updateData2,
                    channelConfigIds: result.channelConfigIds,
                    contacts: data.contacts,
                };
                await autoAssignConversationService.update(
                    result2.id,
                    workspaceId,
                    updateData2InvalidContactsByChannel,
                );
            } catch (e) {
                // Valida se ocorreu o erro especifico ao atualizar para contatos com um canal que já esta sendo utilizado em outro autoAssign
                expect(e.response.error).toBe('ERROR_CONTACT_AUTO_ASSIGN_CONVERSATION');
                expect(e.response.message).toBe('auto sign already has a contact linked');
                expect(e.status).toBe(409);
            }

            // Deleta o segundo registro criado
            await autoAssignConversationService.softDelete(workspaceId, result2.id);

            const listAfterDelete = await autoAssignConversationService.listByWorkspaceIdAndQuery(workspaceId);

            // Valida se registro ainda esta listado no workspace, não pode estar pq teve um softDelete
            expect(listAfterDelete.data?.find((autoAssign) => autoAssign.id === result2.id)).toBe(undefined);

            // Testa a função getOne com o primeiro registro, deve retornar o registro
            const firstCreatedSetting = await autoAssignConversationService.getOne(result.id, workspaceId);
            expect(firstCreatedSetting?.id).toBe(result?.id);

            // Testa a função getOne com o segundo registro, não deve retornar o registro pois foi excluido
            const secondCreatedSetting = await autoAssignConversationService.getOne(result2.id, workspaceId);
            expect(secondCreatedSetting).toBe(undefined);

            // Valida se o contato foi deletado do segundo registro pois o autoAssign vinculado foi deletado
            const phones: string[] = updateData2.contacts?.map((contact) => contact.phone) as string[];
            const contacts = await contactAutoAssignService.getContactAutoAssignListByPhones(workspaceId, phones);
            expect(contacts.length).toBe(0);

            // Valida se encontra o primeiro autoAssign (result) no redis com base no contato1 e channel1 que haviam sido cadastrados
            const autoAssignRedis = await autoAssignConversationService.getAutoAssignConversationByContactPhone(
                workspaceId,
                channelConfigId1,
                contact1.phone,
            );
            expect(autoAssignRedis?.workspaceId).toBe(workspaceId);
            expect(autoAssignRedis?.channelConfigIds).toStrictEqual(result.channelConfigIds);
            expect(autoAssignRedis?.enableRating).toBe(result.enableRating);
            expect(autoAssignRedis?.teamId).toBe(result.teamId);
            expect(autoAssignRedis?.id).toBe(result.id);

            // Valida se encontra o primeiro autoAssign (result) no redis com base no contato1 e channel2 que haviam sido cadastrados
            const autoAssignRedis2 = await autoAssignConversationService.getAutoAssignConversationByContactPhone(
                workspaceId,
                channelConfigId2,
                contact1.phone,
            );
            expect(autoAssignRedis2?.workspaceId).toBe(workspaceId);
            expect(autoAssignRedis2?.channelConfigIds).toStrictEqual(result.channelConfigIds);
            expect(autoAssignRedis2?.enableRating).toBe(result.enableRating);
            expect(autoAssignRedis2?.teamId).toBe(result.teamId);
            expect(autoAssignRedis2?.id).toBe(result.id);

            // Valida se encontra o segundo autoAssign (result2) que foi deletado no redis com base no contato4 e channel3 que haviam sido cadastrados
            const autoAssignRedis3 = await autoAssignConversationService.getAutoAssignConversationByContactPhone(
                workspaceId,
                channelConfigId3,
                contact4.phone,
            );
            expect(autoAssignRedis3).toBe(undefined);
        });

        it('FUNCTION: checkDuplicatedContactAutoAssign test1', async () => {
            jest.spyOn(contactAutoAssignService, 'getContactAutoAssignListByPhones').mockImplementation(() =>
                Promise.resolve([]),
            );
            jest.spyOn(autoAssignConversationService, 'getAutoAssignListByIdsAndChannelConfigIds').mockImplementation(
                () => Promise.resolve([]),
            );

            const result = await autoAssignConversationService.checkDuplicatedContactAutoAssign(
                workspaceId,
                [channelConfigId1, channelConfigId2],
                [contact1, contact2],
            );

            // Valida se caso não possua nenhum contato com os telefones passados vai dar algum erro ou se retornara algum contato
            expect(result.length).toBe(0);
        });

        it('FUNCTION: checkDuplicatedContactAutoAssign test2', async () => {
            const autoAssignId1 = v4();
            const autoAssignId2 = v4();

            const autoAssignConversation1: AutoAssignConversation = {
                id: autoAssignId1,
                name: 'teste',
                teamId: 'teamId',
                channelConfigIds: [channelConfigId1],
                enableRating: true,
                workspaceId,
            };

            const contactsMock = [{ ...contact1, id: 1, autoAssignConversationIds: [autoAssignId1] }];
            const autoAssignListMock = [autoAssignConversation1];

            jest.spyOn(contactAutoAssignService, 'getContactAutoAssignListByPhones').mockImplementation(() =>
                Promise.resolve(contactsMock),
            );
            jest.spyOn(autoAssignConversationService, 'getAutoAssignListByIdsAndChannelConfigIds').mockImplementation(
                () => Promise.resolve(autoAssignListMock),
            );

            try {
                await autoAssignConversationService.checkDuplicatedContactAutoAssign(
                    workspaceId,
                    [channelConfigId1, channelConfigId2],
                    [contact1, contact2, contact3],
                );
            } catch (e) {
                const error = {
                    error: 'ERROR_CONTACT_AUTO_ASSIGN_CONVERSATION',
                    message: 'auto sign already has a contact linked',
                    data: [contact1.phone],
                };
                // Valida se caso possua outro auto assign que já possua o mesmo contato para os mesmos canais se retornara o erro esperado
                expect(e.response).toStrictEqual(error);
            }
        });

        it('FUNCTION: checkDuplicatedContactAutoAssign test3', async () => {
            jest.spyOn(contactAutoAssignService, 'getContactAutoAssignListByPhones').mockImplementation(() =>
                Promise.resolve([]),
            );
            jest.spyOn(autoAssignConversationService, 'getAutoAssignListByIdsAndChannelConfigIds').mockImplementation(
                () => Promise.resolve([]),
            );

            const result = await autoAssignConversationService.checkDuplicatedContactAutoAssign(
                workspaceId,
                [channelConfigId1, channelConfigId2],
                [],
            );

            // Valida se caso não passe nenhum contato se irá retornar um array vazio
            expect(result.length).toBe(0);
        });

        it('FUNCTION: checkDuplicatedContactAutoAssign test4', async () => {
            jest.spyOn(contactAutoAssignService, 'getContactAutoAssignListByPhones').mockImplementation(() =>
                Promise.resolve([]),
            );
            jest.spyOn(autoAssignConversationService, 'getAutoAssignListByIdsAndChannelConfigIds').mockImplementation(
                () => Promise.resolve([]),
            );

            const result = await autoAssignConversationService.checkDuplicatedContactAutoAssign(
                workspaceId,
                [channelConfigId1, channelConfigId2],
                [{ ...contact1, phone: '' }, contact2, contact3],
            );

            // Valida se caso passe algum contato sem telefone, se irá retornar um array vazio
            expect(result.length).toBe(0);
        });

        it('FUNCTION: checkDuplicatedContactAutoAssign test5', async () => {
            const autoAssignId1 = v4();
            const contactsMock = [{ ...contact1, id: 1, autoAssignConversationIds: [autoAssignId1] }];

            jest.spyOn(contactAutoAssignService, 'getContactAutoAssignListByPhones').mockImplementation(() =>
                Promise.resolve(contactsMock),
            );
            jest.spyOn(autoAssignConversationService, 'getAutoAssignListByIdsAndChannelConfigIds').mockImplementation(
                () => Promise.resolve([]),
            );

            const result = await autoAssignConversationService.checkDuplicatedContactAutoAssign(
                workspaceId,
                [channelConfigId1, channelConfigId2],
                [contact1, contact2, contact3],
                autoAssignId1,
            );

            // Valida se caso eu atualize o mesmo autoAssign vai me trazer o contato que já havia sido cadastrado, sem dar nenhum erro de contato duplicado
            expect(result.length).toBe(1);
            expect(result).toStrictEqual(contactsMock);
        });
    });
});
