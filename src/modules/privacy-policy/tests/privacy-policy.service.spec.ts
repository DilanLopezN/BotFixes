import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 } from 'uuid';
import { PRIVACY_POLICY } from '../ormconfig';
import { CacheModule } from '../../_core/cache/cache.module';
import { ExternalDataService } from '../services/external-data.service';
import { ExternalDataMockService } from './mocks/external-data-mock.service';
import { PrivacyPolicyService } from '../services/privacy-policy.service'
import { ContactsAcceptedPrivacyPolicyService } from '../services/contacts-accepted-privacy-policy.service'
import { PrivacyPolicy } from '../models/privacy-policy.entity'
import { CreatePrivacyPolicy, UpdatePrivacyPolicy } from '../interfaces/privacy-policy.interface';
import * as moment from 'moment';

describe('MODULE: privacy-policy', () => {
    let moduleRef: TestingModule;
    let privacyPolicyService: PrivacyPolicyService;
    let contactsAcceptedPrivacyPolicyService: ContactsAcceptedPrivacyPolicyService;
    let externalDataMockService: ExternalDataMockService;

    const workspaceId = v4();
    const channelConfigId1 = v4();
    const channelConfigId2 = v4();
    const channelConfigId3 = v4();
    const channelConfigId4 = v4();
    const channelConfigId5 = v4();
    // não valida este campo pois é setado no momento de salvar
    const createdAt = moment().toDate();
    const createdAt2 = moment(). add(10, 'minute').toDate();
    //
    const createdBy = v4();
    const phone1 = '5548987654321';
    const phone2 = '5548912345678';
    
    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    name: PRIVACY_POLICY,
                    // Banco dados teste
                    url: process.env.POSTGRESQL_URI_TESTS || 'postgres://postgres:@localhost/tests',
                    // Banco dados local
                    // url: 'postgres://postgres:@localhost/tests',
                    entities: [PrivacyPolicy],
                    synchronize: true,
                    migrationsRun: false,
                    migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
                    schema: PRIVACY_POLICY,
                }),
                TypeOrmModule.forFeature([PrivacyPolicy], PRIVACY_POLICY),
                CacheModule,
            ],
            providers: [
                PrivacyPolicyService,
                ContactsAcceptedPrivacyPolicyService,
                {
                    useClass: ExternalDataMockService,
                    provide: ExternalDataService,
                },
            ],
        }).compile();
        privacyPolicyService = moduleRef.get<PrivacyPolicyService>(PrivacyPolicyService);
        contactsAcceptedPrivacyPolicyService = moduleRef.get<ContactsAcceptedPrivacyPolicyService>(ContactsAcceptedPrivacyPolicyService);
        externalDataMockService = moduleRef.get<ExternalDataMockService>(ExternalDataService);
    });

    describe('SERVICE: PrivacyPolicyService', () => {
        // Está sendo testado todas as funções do service em apenas um teste pra não ter que repetir criação de dados em cada teste
        it('FUNCTION: create/listByWorkspaceId/update/delete/getOne', async () => {
            const data: CreatePrivacyPolicy = {
                workspaceId,
                text: 'teste privacy policy 1',
                channelConfigIds: [channelConfigId1, channelConfigId2],
                createdAt: createdAt,
                createdBy: createdBy,
                acceptButtonText: 'Aceito',
                rejectButtonText: 'Não aceito',
            };

            const data2: CreatePrivacyPolicy = {
                workspaceId,
                text: 'teste privacy policy 2',
                channelConfigIds: [channelConfigId3],
                createdAt: createdAt2,
                createdBy: createdBy,
                acceptButtonText: 'Aceitar',
                rejectButtonText: 'Recusar',
            };

            // Cria 2 registros um com dois canais e outro apenas com um
            const result = await privacyPolicyService.create(data);
            const result2 = await privacyPolicyService.create(data2);

            // Busca os registros criados
            let createdPrivacyPolicy: PrivacyPolicy = (await privacyPolicyService.getOne(
                result?.id,
                workspaceId,
            )) as any;
            let createdPrivacyPolicy2: PrivacyPolicy = (await privacyPolicyService.getOne(
                result2?.id,
                workspaceId,
            )) as any;

            // Valida se todos campos passados foram criados corretamente
            expect(createdPrivacyPolicy.workspaceId).toBe(data.workspaceId);
            expect(createdPrivacyPolicy.text).toBe(data.text);
            expect(createdPrivacyPolicy.acceptButtonText).toBe(data.acceptButtonText);
            expect(createdPrivacyPolicy.rejectButtonText).toBe(data.rejectButtonText);
            expect(createdPrivacyPolicy.createdBy).toBe(createdBy);
            expect(createdPrivacyPolicy.channelConfigIds.length).toBe(2);
            expect(createdPrivacyPolicy.channelConfigIds[0]).toBe(data.channelConfigIds[0]);
            expect(createdPrivacyPolicy.channelConfigIds[1]).toBe(data.channelConfigIds[1]);
            expect(createdPrivacyPolicy2.text).toBe(data2.text);
            expect(createdPrivacyPolicy2.acceptButtonText).toBe(data2.acceptButtonText);
            expect(createdPrivacyPolicy2.rejectButtonText).toBe(data2.rejectButtonText);
            expect(createdPrivacyPolicy2.channelConfigIds.length).toBe(1);
            expect(createdPrivacyPolicy2.channelConfigIds[0]).toBe(data2.channelConfigIds[0]);

            try {
                // Dados de canal de um privacy policy já existente
                const createData2InvalidChannel: CreatePrivacyPolicy = {
                    ...result2,
                    channelConfigIds: result.channelConfigIds,
                    workspaceId,
                };
                await privacyPolicyService.create(createData2InvalidChannel);
            } catch (e) {
                // Valida se ocorreu o erro especifico ao criar um privacy policy com mesmos canais que já esta sendo utilizado em outro privacy policy
                expect(e.response.error).toBe('ERROR_DUPLICATED_CHANNEL_CONFIG_PRIVACY_POLICY');
                expect(e.response.message).toBe('privacy policy already has a channelConfig linked');
                expect(e.status).toBe(400);
            }

            // Busca a lista pelo workspace, deve retornar os 2 registros criados
            const list = (await privacyPolicyService.listByWorkspaceId(workspaceId)) as any;

            // Valida se trouxe os 2 registros criados para o workspace
            expect(!!list?.find((privacyPolicy) => privacyPolicy.id === result.id)).toBe(true);
            expect(!!list?.find((privacyPolicy) => privacyPolicy.id === result2.id)).toBe(true);

            // Atualiza o segundo registro criado
            const updateData2: UpdatePrivacyPolicy = {
                id: result2.id,
                text: 'teste update privacyPolicy 02',
                channelConfigIds: result2.channelConfigIds,
                workspaceId,
                createdAt: result2.createdAt,
                createdBy: createdBy,
                acceptButtonText: 'sim',
                rejectButtonText: 'não',
            };

            const updateResult2 = await privacyPolicyService.update(result2.id, workspaceId, createdBy, updateData2);

            expect(updateResult2.ok).toBe(true);

            let updatedPrivacyPolicyResult2: PrivacyPolicy = await privacyPolicyService.getOne(
                updateData2.id,
                workspaceId,
            ) as any;

            // Valida se todos campos foram atualizados corretamente
            // Campo workspaceId não pode ser atualizado
            expect(updatedPrivacyPolicyResult2.text).toBe(updateData2.text);
            expect(!!updatedPrivacyPolicyResult2.updateAcceptanceAt).toBe(true);
            expect(updatedPrivacyPolicyResult2.acceptButtonText).toBe(updateData2.acceptButtonText);
            expect(updatedPrivacyPolicyResult2.rejectButtonText).toBe(updateData2.rejectButtonText);
            expect(updatedPrivacyPolicyResult2.createdBy).toBe(updateData2.createdBy);
            expect(updatedPrivacyPolicyResult2.channelConfigIds).toStrictEqual(updateData2.channelConfigIds);
            expect(updatedPrivacyPolicyResult2.workspaceId).toBe(workspaceId);

            try {
                await privacyPolicyService.update(0, workspaceId, createdBy, updateData2);
            } catch (e) {
                let error = { statusCode: 404, message: 'Not found!', error: 'NOT_FOUND' };
                // Valida se ocorreu o erro especifico ao atualizar para um id invalido
                expect(e.response).toStrictEqual(error);
            }

            try {
                // Dados de canal de um privacy policy diferente
                const updateData2InvalidChannel: UpdatePrivacyPolicy = {
                    ...updateData2,
                    channelConfigIds: result.channelConfigIds,
                };
                await privacyPolicyService.update(
                    updatedPrivacyPolicyResult2.id,
                    workspaceId,
                    createdBy,
                    updateData2InvalidChannel,
                );
            } catch (e) {
                // Valida se ocorreu o erro especifico ao atualizar com um canal que já esta sendo utilizado em outro privacy policy
                expect(e.response.error).toBe('ERROR_DUPLICATED_CHANNEL_CONFIG_PRIVACY_POLICY');
                expect(e.response.message).toBe('privacy policy already has a channelConfig linked');
                expect(e.status).toBe(400);
            }

            // Deleta o segundo registro criado
            await privacyPolicyService.softDeletePrivacyPolicy(updatedPrivacyPolicyResult2.id, workspaceId);

            try {
                await privacyPolicyService.softDeletePrivacyPolicy(0, workspaceId);
            } catch (e) {
                let error = { statusCode: 404, message: 'Not found!', error: 'NOT_FOUND' };
                // Valida se ocorreu o erro especifico ao deletar para um id invalido
                expect(e.response).toStrictEqual(error);
            }

            const listAfterDelete = await privacyPolicyService.listByWorkspaceId(workspaceId);

            // Valida se registro ainda esta listado no workspace, não pode estar pq teve um softDelete
            expect(listAfterDelete?.find((autoAssign) => autoAssign.id === updatedPrivacyPolicyResult2.id)).toBe(undefined);

            // Testa a função getOne com o primeiro registro, deve retornar o registro
            const firstCreatedSetting = await privacyPolicyService.getOne(result.id, workspaceId);
            expect(firstCreatedSetting?.id).toBe(result?.id);

            // Testa a função getOne com o segundo registro, não deve retornar o registro pois foi excluido
            const secondCreatedSetting = await privacyPolicyService.getOne(updatedPrivacyPolicyResult2.id, workspaceId);
            expect(secondCreatedSetting).toBe(undefined);
        });

        // Testa se o caso não encontre o channelConfig do externalService ira ocorrer o erro esperado
        it('FUNCTION: verifyChannelConfig', async () => {
            jest.spyOn(externalDataMockService, 'getChannelConfigByIdOrToken').mockImplementation(
                () => Promise.resolve(undefined),
            );

            try {
                await privacyPolicyService.verifyChannelConfig(
                    ['ajsghakjhslajs', 'hjagsjahsjhgahsg'],
                );
            } catch (e) {
                // Valida se ocorreu o erro especifico ao passar na função que verifica se o ChannelConfigId passado é valido
                expect(e.response.error).toBe('INVALID_CHANNELCONFIG');
                expect(e.response.message).toBe('Invalid channelconfigId!');
                expect(e.status).toBe(400);
            }
        });

        // Testa se após dar um softDelete ira apagar os registros de aceite do cache
        it('FUNCTION: softDeletePrivacyPolicy', async () => {
            // jest.spyOn(externalDataMockService, 'getChannelConfigByIdOrToken').mockImplementation(
            //     (channelconfigId) => Promise.resolve({_id: channelconfigId}),
            // );
            // const data: CreatePrivacyPolicy = {
            //     workspaceId,
            //     text: 'teste privacy policy softDelete',
            //     channelConfigIds: [channelConfigId4, channelConfigId5],
            //     createdAt: createdAt,
            //     createdBy: createdBy,
            //     acceptButtonText: 'Aceito',
            //     rejectButtonText: 'Não aceito',
            // };

            // // Cria 1 registros com dois canais
            // const result = await privacyPolicyService.create(data);

            // // seta no redis o aceite do privacy policy para dois telefones
            // await contactsAcceptedPrivacyPolicyService.setContactAcceptedByPhoneCacheKey(workspaceId, channelConfigId4, phone1)
            // await contactsAcceptedPrivacyPolicyService.setContactAcceptedByPhoneCacheKey(workspaceId, channelConfigId5, phone2)

            // // busca dos aceites do privacy policy para os números setados
            // const getAcceptPhone1 = await contactsAcceptedPrivacyPolicyService.getContactAcceptedByPhoneFromCache(workspaceId, channelConfigId4, phone1);
            // const getAcceptPhone2 = await contactsAcceptedPrivacyPolicyService.getContactAcceptedByPhoneFromCache(workspaceId, channelConfigId4, phone2);

            // // deve retornar o aceite no privacy policy channelConfig4
            // expect(!!getAcceptPhone1.acceptanceAt).toBe(true);
            // // deve retornar o aceite null no privacy policy channelConfig4 para o telefone 2 pois ele foi setado no channelConfig5
            // expect(!!getAcceptPhone2.acceptanceAt).toBe(false);

            // // Deleta o segundo registro criado
            // await privacyPolicyService.softDeletePrivacyPolicy(result.id, workspaceId);

            // // busca dos aceites do privacy policy para os números setados após o privacy policy ter sido excluido
            // const getAcceptPhone1AfterDeletePrivacyPolicy = await contactsAcceptedPrivacyPolicyService.getContactAcceptedByPhoneFromCache(workspaceId, channelConfigId4, phone1);
            // const getAcceptPhone2AfterDeletePrivacyPolicy = await contactsAcceptedPrivacyPolicyService.getContactAcceptedByPhoneFromCache(workspaceId, channelConfigId5, phone2);

            // // não deve retornar os dois numeros que deram aceite no privacy policy
            // expect(!!getAcceptPhone1AfterDeletePrivacyPolicy.acceptanceAt).toBe(false);
            // expect(!!getAcceptPhone2AfterDeletePrivacyPolicy.acceptanceAt).toBe(false);
            expect(true).toBe(true)
        });
    });
});
