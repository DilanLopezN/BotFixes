import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 } from 'uuid';
import { CacheModule } from '../../_core/cache/cache.module';
import * as moment from 'moment';
import {
  SCHEDULE_CONNECTION_NAME,
  SCHEDULE_READ_CONNECTION_NAME,
} from '../connName';
import { ScheduleMessageService } from '../services/schedule-message/schedule-message.service';
import mongoose from 'mongoose';
import {
  RecipientType,
  ScheduleMessage,
} from '../models/schedule-message.entity';
import { ExtractResumeType } from '../models/extract-resume.entity';
import { SendScheduleMessageService } from '../services/schedule-message/send-schedule-message.service';
import { ScheduleSettingService } from '../services/schedule/schedule-setting.service';
import { IntegrationApiService } from '../services/integration-api.service';
import { ConfirmationSettingService } from '../services/confirmation/confirmation-setting.service';
import { ReminderSettingService } from '../services/reminder/reminder-setting.service';
import { SendSettingService } from '../services/send-settings/send-setting.service';
import { ExternalDataService } from '../services/external-data.service';
import { ScheduleService } from '../services/schedule/schedule.service';
import { Repository, getRepository } from 'typeorm';
import { Schedule } from '../models/schedule.entity';

const SECONDS = 1000;
jest.setTimeout(20 * SECONDS);

describe('MODULE: schedule', () => {
  let moduleRef: TestingModule;
  let scheduleMessageService: ScheduleMessageService;
  let repo: Repository<ScheduleMessage>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          name: SCHEDULE_CONNECTION_NAME,
          url:
            process.env.POSTGRESQL_URI_TESTS ||
            'postgres://postgres:@localhost/tests',
          entities: [ScheduleMessage],
          synchronize: true,
          schema: 'schedule',
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          name: SCHEDULE_READ_CONNECTION_NAME,
          url:
            process.env.POSTGRESQL_URI_TESTS ||
            'postgres://postgres:@localhost/tests',
          entities: [ScheduleMessage],
          synchronize: false,
          schema: 'schedule',
        }),
        TypeOrmModule.forFeature([ScheduleMessage], SCHEDULE_CONNECTION_NAME),
        TypeOrmModule.forFeature(
          [ScheduleMessage],
          SCHEDULE_READ_CONNECTION_NAME,
        ),
        CacheModule,
      ],
      providers: [
        ScheduleMessageService,
        {
          provide: SendScheduleMessageService,
          useValue: {},
        },
        {
          provide: ScheduleSettingService,
          useValue: {},
        },
        {
          provide: IntegrationApiService,
          useValue: {},
        },
        {
          provide: ConfirmationSettingService,
          useValue: {},
        },
        {
          provide: ReminderSettingService,
          useValue: {},
        },
        {
          provide: SendSettingService,
          useValue: {},
        },
        {
          provide: ExternalDataService,
          useValue: {},
        },
        {
          provide: ScheduleService,
          useValue: {},
        },
      ],
    }).compile();

    scheduleMessageService = moduleRef.get<ScheduleMessageService>(
      ScheduleMessageService,
    );
    repo = getRepository(ScheduleMessage, SCHEDULE_CONNECTION_NAME);

    scheduleMessageService = moduleRef.get<ScheduleMessageService>(
      ScheduleMessageService,
    );
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  const cleanupDatabase = async () => {
    await repo.query('DELETE from schedule.schedule_message');
  };

  describe('SERVICE: ScheduleMessageService', () => {
    it('FUNCTION:', async () => {
      expect(1).toBe(1);
    });
    it('FUNCTION: createIfNotExistsScheduleMessage DESC: deve criar o primeiro schedule_message de um sendingGroupType no mesmo dia e o segundo deve ser undefined', async () => {
      const workspaceId = new mongoose.Types.ObjectId().toHexString();
      const groupId = v4();
      const recipient = '5548984332211';
      const scheduleId = 1;

      Date.now = jest.fn(() => new Date('2024-03-17T18:16:17-03:00')) as any;
      const createdAt = moment().toDate();

      const scheduleMessageData1: ScheduleMessage = {
        workspaceId: workspaceId,
        groupId: groupId,
        recipient: recipient,
        recipientType: RecipientType.whatsapp,
        scheduleId: scheduleId,
        sendType: ExtractResumeType.reminder,
        sendingGroupType: 'principal',
        createdAt,
      };

      const scheduleMessageResult =
        await scheduleMessageService.createIfNotExistsScheduleMessage(
          scheduleMessageData1,
        );

      // deve retorna o scheduleMessage criado e valida se criou com campos corretamente
      expect(scheduleMessageResult.workspaceId).toEqual(workspaceId);
      expect(scheduleMessageResult.groupId).toEqual(groupId);
      expect(scheduleMessageResult.recipient).toEqual(recipient);
      expect(scheduleMessageResult.scheduleId).toEqual(scheduleId);
      expect(scheduleMessageResult.recipientType).toEqual(
        RecipientType.whatsapp,
      );
      expect(scheduleMessageResult.sendType).toEqual(
        ExtractResumeType.reminder,
      );
      expect(scheduleMessageResult.sendingGroupType).toEqual('principal');
      expect(scheduleMessageResult.createdAt).toEqual(createdAt);

      const scheduleMessageData2: ScheduleMessage = {
        workspaceId: workspaceId,
        groupId: groupId,
        recipient: recipient,
        recipientType: RecipientType.whatsapp,
        scheduleId: scheduleId,
        sendType: ExtractResumeType.reminder,
        sendingGroupType: 'principal',
        createdAt,
      };

      const scheduleMessageResult2 =
        await scheduleMessageService.createIfNotExistsScheduleMessage(
          scheduleMessageData2,
        );

      // deve retorna o undefined pois já existe scheduleMessage com mesmo sendingGroupType criado no mesmo dia
      expect(scheduleMessageResult2).toBe(undefined);
    });

    it('FUNCTION: createIfNotExistsScheduleMessage DESC: deve criar 2 schedule_message de um sendingGroupType diferente no mesmo dia', async () => {
      const workspaceId = new mongoose.Types.ObjectId().toHexString();
      const groupId = v4();
      const recipient = '5548984332211';
      const scheduleId = 3;

      Date.now = jest.fn(() => new Date('2024-03-17T18:16:17-03:00')) as any;
      const createdAt = moment().toDate();

      const scheduleMessageData1: ScheduleMessage = {
        workspaceId: workspaceId,
        groupId: groupId,
        recipient: recipient,
        recipientType: RecipientType.whatsapp,
        scheduleId: scheduleId,
        sendType: ExtractResumeType.reminder,
        sendingGroupType: 'principal',
        createdAt,
      };

      const scheduleMessageResult =
        await scheduleMessageService.createIfNotExistsScheduleMessage(
          scheduleMessageData1,
        );

      // deve retorna o scheduleMessage criado e valida se criou com campos corretamente
      expect(scheduleMessageResult.workspaceId).toEqual(workspaceId);
      expect(scheduleMessageResult.groupId).toEqual(groupId);
      expect(scheduleMessageResult.recipient).toEqual(recipient);
      expect(scheduleMessageResult.scheduleId).toEqual(scheduleId);
      expect(scheduleMessageResult.recipientType).toEqual(
        RecipientType.whatsapp,
      );
      expect(scheduleMessageResult.sendType).toEqual(
        ExtractResumeType.reminder,
      );
      expect(scheduleMessageResult.sendingGroupType).toEqual('principal');
      expect(scheduleMessageResult.createdAt).toEqual(createdAt);

      const scheduleMessageData2: ScheduleMessage = {
        workspaceId: workspaceId,
        groupId: groupId,
        recipient: recipient,
        recipientType: RecipientType.whatsapp,
        scheduleId,
        sendType: ExtractResumeType.confirmation,
        sendingGroupType: 'secundario',
        createdAt,
      };

      const scheduleMessageResult2 =
        await scheduleMessageService.createIfNotExistsScheduleMessage(
          scheduleMessageData2,
        );

      // deve retorna o scheduleMessage de confirmação criado e valida se criou com campos corretamente
      expect(scheduleMessageResult2.workspaceId).toEqual(workspaceId);
      expect(scheduleMessageResult2.groupId).toEqual(groupId);
      expect(scheduleMessageResult2.recipient).toEqual(recipient);
      expect(scheduleMessageResult2.scheduleId).toEqual(scheduleId);
      expect(scheduleMessageResult2.recipientType).toEqual(
        RecipientType.whatsapp,
      );
      expect(scheduleMessageResult2.sendType).toEqual(
        ExtractResumeType.confirmation,
      );
      expect(scheduleMessageResult2.sendingGroupType).toEqual('secundario');
      expect(scheduleMessageResult2.createdAt).toEqual(createdAt);
    });

    it('FUNCTION: createIfNotExistsScheduleMessage DESC: deve criar 2 schedule_message de um scheduleId diferentes em dias disntintos', async () => {
      const workspaceId = new mongoose.Types.ObjectId().toHexString();
      const groupId = v4();
      const recipient = '5548984332211';
      const scheduleId = 5;
      const scheduleId2 = 6;

      const createdAt = moment('2024-03-18T18:16:17-03:00').toDate();
      const createdAt2 = moment('2024-03-19T18:16:17-03:00').toDate();

      const scheduleMessageData1: ScheduleMessage = {
        workspaceId: workspaceId,
        groupId: groupId,
        recipient: recipient,
        recipientType: RecipientType.whatsapp,
        scheduleId: scheduleId,
        sendType: ExtractResumeType.reminder,
        sendingGroupType: 'principal',
        createdAt,
      };

      const scheduleMessageResult =
        await scheduleMessageService.createIfNotExistsScheduleMessage(
          scheduleMessageData1,
        );

      // deve retorna o scheduleMessage criado e valida se criou com campos corretamente
      expect(scheduleMessageResult.workspaceId).toEqual(workspaceId);
      expect(scheduleMessageResult.groupId).toEqual(groupId);
      expect(scheduleMessageResult.recipient).toEqual(recipient);
      expect(scheduleMessageResult.scheduleId).toEqual(scheduleId);
      expect(scheduleMessageResult.recipientType).toEqual(
        RecipientType.whatsapp,
      );
      expect(scheduleMessageResult.sendType).toEqual(
        ExtractResumeType.reminder,
      );
      expect(scheduleMessageResult.sendingGroupType).toEqual('principal');
      expect(scheduleMessageResult.createdAt).toEqual(createdAt);

      const scheduleMessageData2: ScheduleMessage = {
        workspaceId: workspaceId,
        groupId: groupId,
        recipient: recipient,
        recipientType: RecipientType.whatsapp,
        scheduleId: scheduleId2,
        sendType: ExtractResumeType.reminder,
        sendingGroupType: 'principal',
        createdAt: createdAt2,
      };

      const scheduleMessageResult2 =
        await scheduleMessageService.createIfNotExistsScheduleMessage(
          scheduleMessageData2,
        );

      expect(scheduleMessageResult2.id).toBeTruthy();
    });
  });
});
