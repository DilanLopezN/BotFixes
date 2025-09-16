import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { v4 } from 'uuid';
import * as moment from 'dayjs';
import { orderBy } from 'lodash';
import { SCHEDULE_CONNECTION_NAME } from '../connName';
import { ExtractResumeService } from '../services/extract/extract-resume.service';
import {
  ExtractResume,
  ExtractResumeState,
  ExtractResumeType,
} from '../models/extract-resume.entity';
import { ExtractRule } from '../models/schedule-setting.entity';
import { CacheModule } from '../../cache/cache.module';
import * as ObjectId from 'objectid';
const SECONDS = 1000;
jest.setTimeout(20 * SECONDS);

describe('MODULE: schedule', () => {
  let moduleRef: TestingModule;

  let extractResumeService: ExtractResumeService;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          name: SCHEDULE_CONNECTION_NAME,
          url:
            process.env.POSTGRESQL_URI_TESTS ||
            'postgres://postgres:@localhost/tests',
          entities: [ExtractResume],
          synchronize: true,
          migrationsRun: false,
          migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
          schema: 'schedule',
        }),
        TypeOrmModule.forFeature([ExtractResume], SCHEDULE_CONNECTION_NAME),
        CacheModule,
      ],
      providers: [ExtractResumeService],
    }).compile();

    extractResumeService =
      moduleRef.get<ExtractResumeService>(ExtractResumeService);
  });

  describe('SERVICE: ExtractResumeService', () => {
    it('FUNCTION: create/getDailyExtracts', async () => {
      // Esse teste cria um extractResume com extractRule DAILY e testa a função de
      const workspaceId = new ObjectId();
      const settingId = 1;
      const startDate1 = moment().subtract(1, 'hour');
      const endDate1 = moment();
      const settingTypeId = 1;
      const extractResumeData1: Partial<ExtractResume> = {
        workspaceId: workspaceId,
        scheduleSettingId: settingId,
        createdAt: new Date(),
        extractRule: ExtractRule.DAILY,
        startRangeDate: startDate1.clone().toDate(),
        endRangeDate: endDate1.clone().toDate(),
        type: ExtractResumeType.confirmation,
        settingTypeId,
      };

      const extractResume =
        await extractResumeService.createExtractResume(extractResumeData1);

      const listedExtractResume = await extractResumeService.getDailyExtracts({
        data: {
          type: ExtractResumeType.confirmation,
          settingTypeId,
        } as any,
        now: moment(),
        scheduleSetting: {
          workspaceId,
          id: settingId,
        } as any,
      });

      expect(extractResume.startRangeDate).toEqual(
        listedExtractResume.startRangeDate,
      );
      expect(extractResume.workspaceId).toEqual(
        listedExtractResume.workspaceId,
      );
      expect(Number(extractResume.scheduleSettingId)).toEqual(
        Number(listedExtractResume.scheduleSettingId),
      );
      expect(extractResume.createdAt).toEqual(listedExtractResume.createdAt);
      expect(extractResume.endRangeDate).toEqual(
        listedExtractResume.endRangeDate,
      );
      expect(extractResume.type).toEqual(listedExtractResume.type);
      expect(Number(extractResume.settingTypeId)).toEqual(
        Number(listedExtractResume.settingTypeId),
      );
    });
    it('FUNCTION: create/getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId', async () => {
      //Esse teste cria 2 extract resumes iguais porém com datas de criação diferentes e datas de range diferentes, deve trazer o com createdAt mais recente
      const workspaceId = new mongoose.Types.ObjectId().toHexString();
      const settingId = 2;
      const settingTypeId = 2;
      const type = ExtractResumeType.reminder;
      const startDate1 = moment().subtract(1, 'day').subtract(1, 'hour');
      const endDate1 = moment().subtract(1, 'day');

      const startDate2 = moment().subtract(1, 'hour');
      const endDate2 = moment();

      const extractResumeData1: Partial<ExtractResume> = {
        workspaceId: workspaceId,
        scheduleSettingId: settingId,
        createdAt: moment().subtract(1, 'minute').toDate(),
        extractRule: ExtractRule.DAILY,
        startRangeDate: startDate1.clone().toDate(),
        endRangeDate: endDate1.clone().toDate(),
        type,
        settingTypeId,
      };
      const extractResumeData2: Partial<ExtractResume> = {
        workspaceId: workspaceId,
        scheduleSettingId: settingId,
        createdAt: moment().toDate(),
        extractRule: ExtractRule.DAILY,
        startRangeDate: startDate2.clone().toDate(),
        endRangeDate: endDate2.clone().toDate(),
        type,
        settingTypeId,
      };

      const extractResume1 =
        await extractResumeService.createExtractResume(extractResumeData1);
      const extractResume2 =
        await extractResumeService.createExtractResume(extractResumeData2);
      const extractResume =
        await extractResumeService.getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId(
          {
            scheduleSettingId: settingId,
            settingTypeId,
            type,
          },
        );
      expect(extractResume.startRangeDate).toEqual(
        extractResume2.startRangeDate,
      );
      expect(extractResume.workspaceId).toEqual(extractResume2.workspaceId);
      expect(Number(extractResume.scheduleSettingId)).toEqual(
        extractResume2.scheduleSettingId,
      );
      expect(extractResume.createdAt).toEqual(extractResume2.createdAt);
      expect(extractResume.endRangeDate).toEqual(extractResume2.endRangeDate);
      expect(extractResume.type).toEqual(extractResume2.type);
      expect(Number(extractResume.settingTypeId)).toEqual(
        extractResume2.settingTypeId,
      );
    });

    it('FUNCTION: create/updateRange/updateStart/updateEnded/updateEndedError/updateEndedLock', async () => {
      //Esse teste cria 2 extract resumes iguais porém com datas de criação diferentes e datas de range diferentes, deve trazer o com createdAt mais recente
      const workspaceId = new mongoose.Types.ObjectId().toHexString();
      const settingId = 3;
      const settingTypeId = 3;
      const type = ExtractResumeType.reminder;
      const startDate1 = moment().subtract(1, 'day').subtract(1, 'hour');
      const endDate1 = moment().subtract(1, 'day');
      const extractResumeData1: Partial<ExtractResume> = {
        workspaceId: workspaceId,
        scheduleSettingId: settingId,
        createdAt: new Date(),
        extractRule: ExtractRule.DAILY,
        type,
        settingTypeId,
      };
      const extractResume1 =
        await extractResumeService.createExtractResume(extractResumeData1);

      expect(extractResume1.startRangeDate).toBeNull();
      expect(extractResume1.endRangeDate).toBeNull();
      expect(typeof extractResume1.id).toBe('number');

      await extractResumeService.updateRange({
        endDate: endDate1,
        startDate: startDate1,
        id: extractResume1.id,
      });
      const extractResumeRange =
        await extractResumeService.getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId(
          {
            scheduleSettingId: settingId,
            settingTypeId,
            type,
          },
        );

      expect(moment(extractResumeRange.startRangeDate).valueOf()).toBe(
        startDate1.valueOf(),
      );
      expect(moment(extractResumeRange.endRangeDate).valueOf()).toBe(
        endDate1.valueOf(),
      );
      expect(extractResumeRange.startedAt).toBeNull();
      expect(extractResumeRange.id).toEqual(extractResume1.id);

      await extractResumeService.updateStart(extractResumeRange.id);

      const extractResumeStart =
        await extractResumeService.getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId(
          {
            scheduleSettingId: settingId,
            settingTypeId,
            type,
          },
        );

      expect(extractResumeStart.startedAt).toBeInstanceOf(Date);
      expect(extractResumeStart.id).toEqual(extractResume1.id);
      expect(extractResumeStart.state).toBe(ExtractResumeState.RUNNING);
      expect(extractResumeStart.processedCount).toBeNull();
      expect(extractResumeStart.sendedCount).toBeNull();
      expect(extractResumeStart.extractedCount).toBeNull();

      await extractResumeService.updateEnded(extractResumeRange.id, 10, 10, 10);

      const extractResumeEnded =
        await extractResumeService.getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId(
          {
            scheduleSettingId: settingId,
            settingTypeId,
            type,
          },
        );

      expect(extractResumeEnded.endAt).toBeInstanceOf(Date);
      expect(extractResumeEnded.id).toEqual(extractResume1.id);
      expect(extractResumeEnded.state).toBe(ExtractResumeState.ENDED);
      expect(Number(extractResumeEnded.processedCount)).toBe(10);
      expect(Number(extractResumeEnded.sendedCount)).toBe(10);
      expect(Number(extractResumeEnded.extractedCount)).toBe(10);

      await extractResumeService.updateEndedError(extractResumeRange.id, {
        Error: 'TESTE',
      });

      const extractResumeEndedError =
        await extractResumeService.getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId(
          {
            scheduleSettingId: settingId,
            settingTypeId,
            type,
          },
        );

      expect(extractResumeEndedError.endAt).toBeInstanceOf(Date);
      expect(extractResumeEndedError.id).toEqual(extractResume1.id);
      expect(extractResumeEndedError.state).toBe(
        ExtractResumeState.ENDED_ERROR,
      );
      expect(extractResumeEndedError.error).toBe(
        JSON.stringify({ Error: 'TESTE' }),
      );

      await extractResumeService.updateEndedLock(extractResumeRange.id);

      const extractResumeEndedLock =
        await extractResumeService.getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId(
          {
            scheduleSettingId: settingId,
            settingTypeId,
            type,
          },
        );

      expect(extractResumeEndedLock.endAt).toBeInstanceOf(Date);
      expect(extractResumeEndedLock.id).toEqual(extractResume1.id);
      expect(extractResumeEndedLock.state).toBe(ExtractResumeState.ENDED_LOCK);
    });
  });
});
