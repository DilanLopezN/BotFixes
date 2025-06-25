import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { WhatsappSessionSchema } from '../schemas/whatsapp-session.schema';
import { WhatsappSessionControlService } from './../services/whatsapp-session-control.service';
import { v4 } from 'uuid';
import * as moment from 'moment';
import { getWithAndWithout9PhoneNumber } from 'kissbot-core';
describe('MODULE: whatsapp-session-control', () => {
    let moduleRef: TestingModule;
    let whatsappSessionControlService: WhatsappSessionControlService;
    const channelConfigId = v4();
    // const originNumber = '5511912345678';
    const originNumber = v4();
    const integrationToken = v4();
    const workspaceId = v4();
    const now = moment();
    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [
                MongooseModule.forRoot(process.env.MONGO_URI_TESTS || 'mongodb://localhost:27017/kissbot-api', {
                    useNewUrlParser: true,
                    useUnifiedTopology: false,
                    ...(process.env.NODE_ENV === 'local'
                        ? {}
                        : {
                              retryWrites: true,
                              w: 'majority',
                          }),
                }),
                MongooseModule.forFeature([{ name: 'WhatsappSession', schema: WhatsappSessionSchema },
            ]),
            ],
            providers: [
                WhatsappSessionControlService,
            ],
            exports: []
        }).compile();
        whatsappSessionControlService = moduleRef.get<WhatsappSessionControlService>(WhatsappSessionControlService);
    });

    describe('SERVICE: WhatsappSessionControlService', () => {
        it('FUNCTION: create/findSessionByWorkspaceAndNumberAndChannelConfigId DESC: create whatsapp session to number and retrieve with findSessionByWorkspaceAndNumberAndChannelConfigId func', async () => {
            const session1ValueOf = now.clone().add(10,'seconds').valueOf()
            const session2ValueOf = now.clone().add(20,'seconds').valueOf()
            const isNewSession = await whatsappSessionControlService.create({
                channelConfigId,
                originNumber,
                integrationToken,
                whatsappExpiration: session1ValueOf,
                workspaceId,
            });

            const isNewSession2 = await whatsappSessionControlService.create({
                channelConfigId,
                originNumber,
                integrationToken,
                whatsappExpiration: session2ValueOf,
                workspaceId,
            });

            expect(isNewSession).toBe(true);
            expect(isNewSession2).toBe(false);

            const result = await whatsappSessionControlService.findSessionByWorkspaceAndNumberAndChannelConfigId(workspaceId, originNumber, channelConfigId);

            expect(result?.whatsappExpiration).toBe(session2ValueOf);

            const existingSessions = await whatsappSessionControlService.model.find({
                workspaceId,
                originNumber: {
                    $in: getWithAndWithout9PhoneNumber(originNumber)
                },
                channelConfigId,
            });

            expect(existingSessions.length).toBe(1);
        });
    });
});
