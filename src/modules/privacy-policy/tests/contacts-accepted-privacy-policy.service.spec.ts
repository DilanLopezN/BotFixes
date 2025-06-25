import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { CacheModule } from '../../_core/cache/cache.module';
import { ExternalDataMockService } from './mocks/external-data-mock.service';
import { ExternalDataService } from '../services/external-data.service';
import { ContactsAcceptedPrivacyPolicyService } from '../services/contacts-accepted-privacy-policy.service';

describe('MODULE: Privacy policy', () => {
    let moduleRef: TestingModule;
    let contactsAcceptedPrivacyPolicyService: ContactsAcceptedPrivacyPolicyService;
    let externalDataMockService: ExternalDataMockService;

    const workspaceId = v4();
    const channelConfigId1 = v4();
    const channelConfigId2 = v4();
    const phone1 = '5548987654321';
    const phone2 = '5548912345678';
    
    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                CacheModule,
            ],
            providers: [
                ContactsAcceptedPrivacyPolicyService,
                {
                    useClass: ExternalDataMockService,
                    provide: ExternalDataService,
                },
            ],
        }).compile();
        contactsAcceptedPrivacyPolicyService = moduleRef.get<ContactsAcceptedPrivacyPolicyService>(ContactsAcceptedPrivacyPolicyService);
        externalDataMockService = moduleRef.get<ExternalDataMockService>(ExternalDataService);
    });

    describe('SERVICE: contactsAcceptedPrivacyPolicyService', () => {
        // Teste se esta setando no redis o aceite do número de um paciente da Privacy policy , e fazendo um get no redis para verificar se setou corretamente
        it('FUNCTION: setContactAcceptedByPhoneCacheKey/getContactAcceptedByPhoneFromCache', async () => {
            await contactsAcceptedPrivacyPolicyService.setContactAcceptedByPhoneCacheKey(workspaceId, channelConfigId1, phone1)
            await contactsAcceptedPrivacyPolicyService.setContactAcceptedByPhoneCacheKey(workspaceId, channelConfigId2, phone2)

            const getAcceptPhone1 = await contactsAcceptedPrivacyPolicyService.getContactAcceptedByPhoneFromCache(workspaceId, channelConfigId1, phone1);
            const getAcceptPhone2 = await contactsAcceptedPrivacyPolicyService.getContactAcceptedByPhoneFromCache(workspaceId, channelConfigId1, phone2);

            expect(!!getAcceptPhone1).toBe(true);
            expect(!!getAcceptPhone2).toBe(true);
        });

        // Teste se esta setando no redis o aceite do número de um paciente da Privacy policy com channelConfig invalido, deve ocorrer um erro
        it('FUNCTION: setContactAcceptedByPhoneCacheKey invalid channelConfig', async () => {
            jest.spyOn(externalDataMockService, 'getChannelConfigByIdOrToken').mockImplementation((channelConfigId) =>
                Promise.resolve(undefined),
            );
            try {
                await contactsAcceptedPrivacyPolicyService.setContactAcceptedByPhoneCacheKey(workspaceId, channelConfigId1, phone1)
            } catch (e) {
                // Valida se ocorreu o erro especifico ao setar um aceite do paciente no Privacy policy com channelConfig invalido
                expect(e.response.error).toBe('INVALID_CHANNELCONFIG');
                expect(e.response.message).toBe('Invalid channelconfigId!');
                expect(e.status).toBe(400);
            }
            
        });

        // Teste se esta fazendo a consulta no redis do aceite do número de um paciente da Privacy policy com channelConfig invalido, deve ocorrer um erro
        it('FUNCTION: getContactAcceptedByPhoneFromCache invalid channelConfig', async () => {
            jest.spyOn(externalDataMockService, 'getChannelConfigByIdOrToken').mockImplementation((channelConfigId) =>
                Promise.resolve(undefined),
            );
            try {
                await contactsAcceptedPrivacyPolicyService.getContactAcceptedByPhoneFromCache(workspaceId, channelConfigId1, phone1)
            } catch (e) {
                // Valida se ocorreu o erro especifico ao consultar um aceite do paciente no Privacy policy com channelConfig invalido
                expect(e.response.error).toBe('INVALID_CHANNELCONFIG');
                expect(e.response.message).toBe('Invalid channelconfigId!');
                expect(e.status).toBe(400);
            }
            
        });
    })
});
