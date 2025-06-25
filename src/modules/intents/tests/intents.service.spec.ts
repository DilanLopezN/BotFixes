import { Test, TestingModule } from '@nestjs/testing';
import { v4 } from 'uuid';
import { ExternalDataMockService } from './mocks/external-data-mock.service';
import { IntentsService } from '../services/intents.service';

describe('MODULE: Intents', () => {
    let moduleRef: TestingModule;
    let intentsService: IntentsService;
    let externalDataMockService: ExternalDataMockService;

    const workspaceId = v4();
    const botId = v4();

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [],
            providers: [
                IntentsService,
                // {
                //     useClass: ExternalDataMockService,
                //     provide: ExternalDataService,
                // },
            ],
        }).compile();
        intentsService = moduleRef.get<IntentsService>(IntentsService);
        // externalDataMockService = moduleRef.get<ExternalDataMockService>(ExternalDataService);
    });

    describe('SERVICE: IntentsService', () => {
        //
        it('FUNCTION: getIntentsByWorkspaceAndBot', async () => {
            const intents = await intentsService.getIntentsByWorkspaceAndBot(workspaceId, botId);

            expect(intents.length).toBe(11);
        });
    });
});
