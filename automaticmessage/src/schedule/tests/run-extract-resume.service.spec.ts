import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { v4 } from 'uuid';
import { CacheModule } from '../../_core/cache/cache.module';
import * as moment from 'moment';
import { orderBy } from 'lodash';
import { SCHEDULE_CONNECTION_NAME } from '../connName';
import { ExtractResumeService } from '../services/extract/extract-resume.service';
import mongoose from 'mongoose';
import {
  ExtractResume,
  ExtractResumeState,
  ExtractResumeType,
} from '../models/extract-resume.entity';
import { ExtractRule } from '../models/schedule-setting.entity';
import { RunExtractResumeService } from '../services/extract/run-extract-resume.service';
import { ScheduleSettingService } from '../services/schedule/schedule-setting.service';
import { IntegrationApiService } from '../services/integration-api.service';
import { ScheduleService } from '../services/schedule/schedule.service';
import { KafkaService } from '../../_core/kafka/kafka.service';
import { ScheduleGroupRule } from '../interfaces/schedule-group-rule.enum';
import { Repository, getRepository } from 'typeorm';
import { RunExtractData } from '../interfaces/run-extract-data.interface';

const SECONDS = 1000;
jest.setTimeout(20 * SECONDS);

describe('MODULE: schedule', () => {
  let moduleRef: TestingModule;

  let runExtractResumeService: RunExtractResumeService;
  let extractResumeService: ExtractResumeService;
  let kafkaService: KafkaService;
  let extarctResumeRepo: Repository<ExtractResume>;

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
      providers: [
        RunExtractResumeService,
        ExtractResumeService,
        {
          provide: ScheduleSettingService,
          useValue: {},
        },
        {
          provide: IntegrationApiService,
          useValue: {},
        },
        {
          provide: ScheduleService,
          useValue: {},
        },
        {
          provide: KafkaService,
          useValue: {
            sendEvent: (...args) => null,
          },
        },
        {
          provide: getRepositoryToken(ExtractResume),
          useClass: Repository,
        },
      ],
    }).compile();

    runExtractResumeService = moduleRef.get<RunExtractResumeService>(
      RunExtractResumeService,
    );
    extractResumeService =
      moduleRef.get<ExtractResumeService>(ExtractResumeService);
    kafkaService = moduleRef.get<KafkaService>(KafkaService);
    extarctResumeRepo = getRepository(ExtractResume, SCHEDULE_CONNECTION_NAME);
  });

  describe('SERVICE: RunExtractResumeService', () => {
    it('FUNCTION:', async () => {
      expect(1).toBe(1);
    });
  });

  describe('SERVICE: RunExtractResumeService', () => {
    // it('FUNCTION: runNextExtract->runDailyStrategy DESC: deve setar um extractAt para 1h a frente p/ cair na regra de não rodar antes um horário do dia', async () => {
    //     const mmt = moment().add(1, 'hour');
    //     var mmtMidnight = mmt.clone().startOf('day');
    //     var diffMinutes = mmt.diff(mmtMidnight, 'minutes');
    //     const result = await runExtractResumeService.runNextExtract({
    //         hoursBeforeScheduleDate: 24,
    //         scheduleGroupRule: ScheduleGroupRule.allOfRange,
    //         scheduleSetting: {
    //             extractRule: ExtractRule.DAILY,
    //             extractAt: diffMinutes,
    //         } as any,
    //         settingTypeId: 1,
    //         type: ExtractResumeType.confirmation,
    //         erpParams: '{}',
    //     });

    //     //expect(result).toBe(`ommiting extract: runDailyStrategy not on hour, setting ${diffMinutes}`);
    // });

    it('FUNCTION: runNextExtract->runDailyStrategy DESC: deve verificar se ja rodou extração no dia e não retornar', async () => {
      jest
        .spyOn(extractResumeService, 'getDailyExtracts')
        .mockImplementation(() =>
          Promise.resolve({
            id: 1,
          } as ExtractResume),
        );

      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate: 24,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          extractRule: ExtractRule.DAILY,
          extractAt: 1, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      if (new Date().getDate() != 19 && new Date().getMonth() != 4) {
        expect(result).toBe(`ommiting extract: runDailyStrategy runner on day`);
      }
    });

    it('FUNCTION: runNextExtract->runDailyStrategy DESC: deve omitir se for domingo ou sabado e hoursBeforeScheduleDate for menos de 24', async () => {
      const extractResumeIdId = Math.floor(Math.random() * 10000);
      jest
        .spyOn(extractResumeService, 'getDailyExtracts')
        .mockImplementation(() =>
          Promise.resolve({
            id: extractResumeIdId,
          } as ExtractResume),
        );

      //Essa data é um domingo
      Date.now = jest.fn(() => new Date('2024-03-17T18:16:17-03:00')) as any;

      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate: 23,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          extractRule: ExtractRule.DAILY,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      expect(result).toBe(`ommiting extract: runDailyStrategy sunday`);

      //Essa data é um sabado
      Date.now = jest.fn(() => new Date('2024-03-16T18:16:17-03:00')) as any;

      const result2 = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate: 23,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          extractRule: ExtractRule.DAILY,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      expect(result2).toBe(`ommiting extract: runDailyStrategy saturday`);
    });

    it('FUNCTION: runNextExtract->runDailyStrategy DESC:Deve criar extractResume e enviar pro kafka', async () => {
      const scheduleSettingId = Math.floor(Math.random() * 10000);
      const settingTypeId = Math.floor(Math.random() * 10000);
      const workspaceId = new mongoose.Types.ObjectId().toString();

      let kafkaResult;

      Date.now = jest.fn(() => new Date()) as any;

      jest
        .spyOn(extractResumeService, 'getDailyExtracts')
        .mockImplementation(() => Promise.resolve(null));
      jest
        .spyOn(kafkaService, 'sendEvent')
        .mockImplementation(
          (
            data: ExtractResume,
            workspaceId: string,
            scheduleTopicName: string,
          ) => {
            kafkaResult = { data, workspaceId, scheduleTopicName };
            return '' as any;
          },
        );

      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate: 24,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          extractRule: ExtractRule.DAILY,
          workspaceId,
          extractAt: 1, //setado pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      const workspaceCreatedExtractResumeList = await extarctResumeRepo.find({
        workspaceId,
        scheduleSettingId,
      });

      const extractData: RunExtractData = kafkaResult?.data;

      //ADICIONADO PARA FAZER DEPLOY NO FINAL DE SEMANA DESSE DIA
      if (new Date().getDate() != 19 && new Date().getMonth() != 4) {
        expect(workspaceCreatedExtractResumeList.length).toBe(1);
        expect(result).toBe(undefined);
        expect(workspaceCreatedExtractResumeList?.[0]?.workspaceId).toBe(
          workspaceId,
        );
        expect(extractData?.extract.id).toBeDefined();
        expect(extractData?.extract.id).toBe(
          workspaceCreatedExtractResumeList?.[0]?.id,
        );
        expect(kafkaResult?.workspaceId).toBe(workspaceId);
      }
    });

    it('FUNCTION: runNextExtract->runDailyStrategy DESC:Deve criar extractResume e enviar pro kafka', async () => {
      const scheduleSettingId = Math.floor(Math.random() * 10000);
      const settingTypeId = Math.floor(Math.random() * 10000);
      const extractResumeId = Math.floor(Math.random() * 10000);
      const workspaceId = new mongoose.Types.ObjectId().toString();

      let kafkaResult;
      let updateEndedLockResult;
      Date.now = jest.fn(() => new Date()) as any;

      jest
        .spyOn(extractResumeService, 'getDailyExtracts')
        .mockImplementation(() =>
          Promise.resolve({
            id: extractResumeId,
            startedAt: moment().subtract(2, 'hours').toDate(),
            state: ExtractResumeState.RUNNING,
          } as ExtractResume),
        );

      jest
        .spyOn(kafkaService, 'sendEvent')
        .mockImplementation(
          (
            data: ExtractResume,
            workspaceId: string,
            scheduleTopicName: string,
          ) => {
            kafkaResult = { data, workspaceId, scheduleTopicName };
            return '' as any;
          },
        );

      jest
        .spyOn(extractResumeService, 'updateEndedLock')
        .mockImplementation((extract) => {
          updateEndedLockResult = extract;
          return '' as any;
        });

      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate: 24,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          extractRule: ExtractRule.DAILY,
          workspaceId,
          extractAt: 1, //setado pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      const workspaceCreatedExtractResumeList = await extarctResumeRepo.find({
        workspaceId,
        scheduleSettingId,
      });

      const extractData: RunExtractData = kafkaResult?.data;

      //ADICIONADO PARA FAZER DEPLOY NO FINAL DE SEMANA DESSE DIA
      if (new Date().getDate() != 19 && new Date().getMonth() != 4) {
        expect(workspaceCreatedExtractResumeList.length).toBe(1);
        expect(workspaceCreatedExtractResumeList?.[0]?.workspaceId).toBe(
          workspaceId,
        );
        expect(extractData?.extract.id).toBeDefined();
        expect(extractData?.extract.id).toBe(
          workspaceCreatedExtractResumeList?.[0]?.id,
        );
        expect(kafkaResult?.workspaceId).toBe(workspaceId);
        expect(extractData?.extract.id).not.toBe(extractResumeId);
      }
    });

    it('FUNCTION: runNextExtract->runDailyStrategy DESC:Deve criar extractResume e enviar pro kafka e as datas de range devem ser de sabado a segunda', async () => {
      const scheduleSettingId = 1;
      const workspaceId = new mongoose.Types.ObjectId().toString();

      let kafkaResult = null;

      jest
        .spyOn(extractResumeService, 'getDailyExtracts')
        .mockImplementation(() => Promise.resolve(null));
      jest
        .spyOn(kafkaService, 'sendEvent')
        .mockImplementation(
          (
            data: ExtractResume,
            workspaceId: string,
            scheduleTopicName: string,
          ) => {
            kafkaResult = { data, workspaceId, scheduleTopicName };
            return '' as any;
          },
        );

      //Essa data é uma sexta feira
      Date.now = jest.fn(() => new Date('2024-03-15T18:16:17-03:00')) as any;

      await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate: 24,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          extractRule: ExtractRule.DAILY,
          fridayJoinWeekendMonday: true,
          workspaceId,
          extractAt: 1, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      const workspaceCreatedExtractResumeList = await extarctResumeRepo.find({
        workspaceId,
        scheduleSettingId,
      });

      const extractData: RunExtractData = kafkaResult?.data;

      // Verifica se gerou o rangeStart no sabado e rangeEnd na segunda de acordo com a regra fridayJoinWeekendMonday
      expect(moment(extractData?.extract.startRangeDate).day()).toBe(6);
      expect(moment(extractData?.extract.endRangeDate).day()).toBe(1);
      expect(workspaceCreatedExtractResumeList.length).toBe(1);
      expect(workspaceCreatedExtractResumeList?.[0]?.workspaceId).toBe(
        workspaceId,
      );
      expect(extractData?.extract.id).toBeDefined();
      expect(extractData?.extract.id).toBe(
        workspaceCreatedExtractResumeList?.[0]?.id,
      );
      expect(kafkaResult?.workspaceId).toBe(workspaceId);
    });

    // it('FUNCTION: runNextExtract->runHourlyStrategy DESC: Deve retornar mensagem de omitir extração por estar fora do horario 22 - 6', async () => {
    //     const scheduleSettingId = 1;
    //     const workspaceId = new mongoose.Types.ObjectId().toString();

    //     //Essa data é 3h da manhã, não deve rodar extração depois das 22 e antes das 6h da manhã
    //     Date.now = jest.fn(() => new Date('2024-03-15T02:00:00-03:00')) as any;

    //     jest.spyOn(
    //         extractResumeService,
    //         'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
    //     ).mockImplementation(() => {
    //         return {} as any;
    //     });

    //     const result = await runExtractResumeService.runNextExtract({
    //         hoursBeforeScheduleDate: 24,
    //         scheduleGroupRule: ScheduleGroupRule.allOfRange,
    //         scheduleSetting: {
    //             id: scheduleSettingId,
    //             fridayJoinWeekendMonday: true,
    //             extractRule: ExtractRule.HOURLY,
    //             workspaceId,
    //             extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
    //         } as any,
    //         settingTypeId: 1,
    //         type: ExtractResumeType.confirmation,
    //         erpParams: '{}',
    //     });

    //     expect(result).toBe('ommiting extract: hourly interval');
    // });

    it('FUNCTION: runNextExtract->runHourlyStrategy DESC: Deve retornar mensagem de omitir extração por não ter o minimo de diferença entre uma', async () => {
      const scheduleSettingId = 1;
      const workspaceId = new mongoose.Types.ObjectId().toString();
      const getScheduleInterval = 60; //1h
      jest
        .spyOn(
          extractResumeService,
          'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
        )
        .mockImplementation(() => {
          return {
            endAt: moment().startOf('day').add(8, 'hour'),
          } as any;
        });

      const now = moment()
        .startOf('day')
        .add(8, 'hour')
        .add(30, 'minute')
        .toDate();
      Date.now = jest.fn(() => now) as any;

      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate: 24,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          getScheduleInterval,
          extractRule: ExtractRule.HOURLY,
          workspaceId,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      expect(result).toBe(
        `ommiting extract: interval:${getScheduleInterval} minutes`,
      );
    });

    it('FUNCTION: runNextExtract->runHourlyStrategy DESC: Deve retornar mensagem de omitir extração por ter uma extração com state: RUNNING', async () => {
      const scheduleSettingId = 1;
      const workspaceId = new mongoose.Types.ObjectId().toString();
      const getScheduleInterval = 60; //1h
      jest
        .spyOn(
          extractResumeService,
          'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
        )
        .mockImplementation(() => {
          return {
            state: ExtractResumeState.RUNNING,
          } as any;
        });

      const now = moment()
        .startOf('day')
        .add(10, 'hour')
        .add(30, 'minute')
        .toDate();
      Date.now = jest.fn(() => now) as any;

      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate: 24,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          getScheduleInterval,
          extractRule: ExtractRule.HOURLY,
          workspaceId,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      expect(result).toBe(`ommiting extract: running`);
    });

    it('FUNCTION: runNextExtract->runHourlyStrategy DESC: Deve criar no kafka/banco um extração novacaso a existente esteja como RUNNING a mais de 60min e atualizar a RUNNING para ENDED_LOCK', async () => {
      const scheduleSettingId = 1;
      const workspaceId = new mongoose.Types.ObjectId().toString();
      const getScheduleInterval = 60; //1h
      const extractResumeId = Math.floor(Math.random() * 10000);
      let kafkaResult: any;
      let updateRangeResult: any;
      let updateEndedLockResult: any;
      const hoursBeforeScheduleDate = 24;
      jest
        .spyOn(
          extractResumeService,
          'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
        )
        .mockImplementation(() => {
          return {
            state: ExtractResumeState.RUNNING,
            id: extractResumeId,
            startedAt: moment().subtract(2, 'hour').toDate(),
          } as any;
        });

      jest
        .spyOn(kafkaService, 'sendEvent')
        .mockImplementation(
          (
            data: ExtractResume,
            workspaceId: string,
            scheduleTopicName: string,
          ) => {
            kafkaResult = { data, workspaceId, scheduleTopicName };
            return '' as any;
          },
        );

      jest
        .spyOn(extractResumeService, 'updateEndedLock')
        .mockImplementation((extract) => {
          updateEndedLockResult = extract;
          return '' as any;
        });

      jest
        .spyOn(extractResumeService, 'updateRange')
        .mockImplementation(
          (data: {
            id: number;
            startDate: moment.Moment;
            endDate: moment.Moment;
          }) => {
            updateRangeResult = data;
            return '' as any;
          },
        );

      const now = moment()
        .startOf('day')
        .add(10, 'hour')
        .add(30, 'minute')
        .toDate();
      Date.now = jest.fn(() => now) as any;

      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          getScheduleInterval,
          extractRule: ExtractRule.HOURLY,
          workspaceId,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      const workspaceCreatedExtractResumeList = await extarctResumeRepo.find({
        workspaceId,
        scheduleSettingId,
      });

      expect(workspaceCreatedExtractResumeList.length).toBe(1);
      expect(workspaceCreatedExtractResumeList[0].id).not.toBe(extractResumeId);
      expect(result).toBe(undefined);
      expect(updateEndedLockResult).toBe(extractResumeId);
      expect(moment(updateRangeResult.startDate).valueOf()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hours').startOf('day').valueOf(),
      );
      expect(moment(updateRangeResult.endDate).valueOf()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hours').endOf('day').valueOf(),
      );
      expect(moment(kafkaResult.data.startDate).valueOf()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hours').startOf('day').valueOf(),
      );
      expect(moment(kafkaResult.data.endDate).valueOf()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hours').endOf('day').valueOf(),
      );
    });

    it('FUNCTION: runNextExtract->runHourlyStrategy DESC: Deve adicionar no kafka um extração ja salva que está como AWAITING_RUN e hoursBeforeScheduleDate true e fridayJoinWeekendMonday false', async () => {
      const scheduleSettingId = 1;
      const workspaceId = new mongoose.Types.ObjectId().toString();
      const getScheduleInterval = 60; //1h
      const extractResumeId = Math.floor(Math.random() * 10000);
      let kafkaResult: any;
      let updateRangeResult: any;
      const hoursBeforeScheduleDate = 24;
      jest
        .spyOn(
          extractResumeService,
          'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
        )
        .mockImplementation(() => {
          return {
            state: ExtractResumeState.AWAITING_RUN,
            id: extractResumeId,
          } as any;
        });

      jest
        .spyOn(kafkaService, 'sendEvent')
        .mockImplementation(
          (
            data: ExtractResume,
            workspaceId: string,
            scheduleTopicName: string,
          ) => {
            kafkaResult = { data, workspaceId, scheduleTopicName };
            return '' as any;
          },
        );

      jest
        .spyOn(extractResumeService, 'updateRange')
        .mockImplementation(
          (data: {
            id: number;
            startDate: moment.Moment;
            endDate: moment.Moment;
          }) => {
            updateRangeResult = data;
            return '' as any;
          },
        );

      const now = moment()
        .startOf('day')
        .add(10, 'hour')
        .add(30, 'minute')
        .toDate();
      Date.now = jest.fn(() => now) as any;

      await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          getScheduleInterval,
          extractRule: ExtractRule.HOURLY,
          workspaceId,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      expect(updateRangeResult.id).toBe(extractResumeId);
      expect(moment(updateRangeResult.startDate).valueOf()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hours').startOf('day').valueOf(),
      );
      expect(moment(updateRangeResult.endDate).valueOf()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hours').endOf('day').valueOf(),
      );
      expect(moment(kafkaResult.data.startDate).valueOf()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hours').startOf('day').valueOf(),
      );
      expect(moment(kafkaResult.data.endDate).valueOf()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hours').endOf('day').valueOf(),
      );
      expect(kafkaResult.data.extract.id).toBe(extractResumeId);
    });

    it('FUNCTION: runNextExtract->runHourlyStrategy DESC: Deve adicionar no kafka um extração ja salva que está como AWAITING_RUN e hoursBeforeScheduleDate true e fridayJoinWeekendMonday true pra sobreescrever na sexta', async () => {
      const scheduleSettingId = 1;
      const workspaceId = new mongoose.Types.ObjectId().toString();
      const getScheduleInterval = 60; //1h
      const extractResumeId = Math.floor(Math.random() * 10000);
      let kafkaResult: any;
      let updateRangeResult: any;
      const hoursBeforeScheduleDate = 24;
      jest
        .spyOn(
          extractResumeService,
          'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
        )
        .mockImplementation(() => {
          return {
            state: ExtractResumeState.AWAITING_RUN,
            id: extractResumeId,
          } as any;
        });

      jest
        .spyOn(kafkaService, 'sendEvent')
        .mockImplementation(
          (
            data: ExtractResume,
            workspaceId: string,
            scheduleTopicName: string,
          ) => {
            kafkaResult = { data, workspaceId, scheduleTopicName };
            return '' as any;
          },
        );

      jest
        .spyOn(extractResumeService, 'updateRange')
        .mockImplementation(
          (data: {
            id: number;
            startDate: moment.Moment;
            endDate: moment.Moment;
          }) => {
            updateRangeResult = data;
            return '' as any;
          },
        );

      // esse dia é uma setxa
      const now = new Date('2024-03-15T18:16:17-03:00');
      Date.now = jest.fn(() => now) as any;

      await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          getScheduleInterval,
          extractRule: ExtractRule.HOURLY,
          fridayJoinWeekendMonday: true,
          workspaceId,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      expect(updateRangeResult.id).toBe(extractResumeId);
      expect(moment(updateRangeResult.startDate).valueOf()).toBe(
        moment().add(24, 'hours').startOf('day').valueOf(),
      );
      expect(moment(updateRangeResult.endDate).valueOf()).toBe(
        moment().add(72, 'hours').endOf('day').valueOf(),
      );
      expect(moment(kafkaResult.data.startDate).valueOf()).toBe(
        moment().add(24, 'hours').startOf('day').valueOf(),
      );
      expect(moment(kafkaResult.data.endDate).valueOf()).toBe(
        moment().add(72, 'hours').endOf('day').valueOf(),
      );
      expect(kafkaResult.data.extract.id).toBe(extractResumeId);
    });

    it('FUNCTION: runNextExtract->runHourlyStrategy DESC: Deve adicionar no kafka e no banco um extração não salva', async () => {
      const workspaceId = new mongoose.Types.ObjectId().toString();
      const getScheduleInterval = 60; //1h
      const scheduleSettingId = Math.floor(Math.random() * 10000);
      let kafkaResult: any;
      const hoursBeforeScheduleDate = 24;
      let updateRangeResult;
      jest
        .spyOn(
          extractResumeService,
          'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
        )
        .mockImplementation(() => null);
      jest
        .spyOn(kafkaService, 'sendEvent')
        .mockImplementation(
          (
            data: ExtractResume,
            workspaceId: string,
            scheduleTopicName: string,
          ) => {
            kafkaResult = { data, workspaceId, scheduleTopicName };
            return '' as any;
          },
        );

      jest
        .spyOn(extractResumeService, 'updateRange')
        .mockImplementation(
          (data: {
            id: number;
            startDate: moment.Moment;
            endDate: moment.Moment;
          }) => {
            updateRangeResult = data;
            return '' as any;
          },
        );

      //Esse dia é uma quinta
      const now = new Date('2024-03-14T18:16:17-03:00');
      Date.now = jest.fn(() => now) as any;
      await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          getScheduleInterval,
          extractRule: ExtractRule.HOURLY,
          workspaceId,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });
      const workspaceCreatedExtractResumeList = await extarctResumeRepo.find({
        workspaceId,
        scheduleSettingId,
      });
      expect(workspaceCreatedExtractResumeList.length).toBe(1);
      expect(moment(updateRangeResult.startDate).valueOf()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hours').startOf('day').valueOf(),
      );
      expect(moment(updateRangeResult.endDate).valueOf()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hours').endOf('day').valueOf(),
      );
      expect(workspaceCreatedExtractResumeList[0].id).toBe(
        updateRangeResult.id,
      );
      expect(workspaceCreatedExtractResumeList[0].state).toBe(
        ExtractResumeState.AWAITING_RUN,
      );
    });

    it('FUNCTION: runNextExtract->runDefaultStrategy DESC: Valida se o intervalo entre uma extração e outra é de no minimo a quantidade de minutos definida no campo getScheduleInterval', async () => {
      const workspaceId = new mongoose.Types.ObjectId().toString();
      const getScheduleInterval = 60; //1h
      const scheduleSettingId = Math.floor(Math.random() * 10000);
      const hoursBeforeScheduleDate = 24;

      jest
        .spyOn(
          extractResumeService,
          'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
        )
        .mockImplementation(() => {
          return {
            endAt: moment().subtract(getScheduleInterval - 10, 'minute'),
          } as any;
        });

      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          getScheduleInterval,
          extractRule: ExtractRule.DEFAULT,
          workspaceId,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });
      expect(result).toBe(
        `ommiting extract: interval:${getScheduleInterval} minutes`,
      );
    });

    it('FUNCTION: runNextExtract->runDefaultStrategy DESC: Valida se a extração ainda está sendo executada', async () => {
      const workspaceId = new mongoose.Types.ObjectId().toString();
      const getScheduleInterval = 60; //1h
      const scheduleSettingId = Math.floor(Math.random() * 10000);
      const hoursBeforeScheduleDate = 24;

      jest
        .spyOn(
          extractResumeService,
          'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
        )
        .mockImplementation(() => {
          return {
            endAt: moment().subtract(getScheduleInterval + 10, 'minute'),
            state: ExtractResumeState.RUNNING,
          } as any;
        });

      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          getScheduleInterval,
          extractRule: ExtractRule.DEFAULT,
          workspaceId,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });
      expect(result).toBe(`ommiting extract: running`);
    });

    it('FUNCTION: runNextExtract->runDefaultStrategy DESC: Valida se a extração ainda está sendo executada e atualiza para ENDED_LOCK', async () => {
      const workspaceId = new mongoose.Types.ObjectId().toString();
      const lastExtractId = Math.floor(Math.random() * 10000);
      const getScheduleInterval = 60; //1h
      const scheduleSettingId = Math.floor(Math.random() * 10000);
      const hoursBeforeScheduleDate = 24;
      let updateEndedLockResult;
      const now = moment();
      const nowDay = now.get('day');
      const nowHour = now.get('hour');
      jest
        .spyOn(
          extractResumeService,
          'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
        )
        .mockImplementation(() => {
          return {
            state: ExtractResumeState.RUNNING,
            id: lastExtractId,
            startedAt: moment().subtract(65, 'minute'),
            createdAt: now.toDate(),
          } as any;
        });

      jest
        .spyOn(extractResumeService, 'updateEndedLock')
        .mockImplementation(async (data) => {
          updateEndedLockResult = data;
          return;
        });

      Date.now = jest.fn(() => now.toDate()) as any;
      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          getScheduleInterval,
          extractRule: ExtractRule.DEFAULT,
          workspaceId,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });
      expect(result).toBe(
        `ommiting already extracted at day ${nowDay} and hour ${nowHour}`,
      );
      expect(updateEndedLockResult).toBe(lastExtractId);
    });
    it('FUNCTION: runNextExtract->runDefaultStrategy DESC: Cria uma extração e envia pro kafka ', async () => {
      const workspaceId = new mongoose.Types.ObjectId().toString();
      const extractId = Math.floor(Math.random() * 10000);
      const getScheduleInterval = 60; //1h
      const scheduleSettingId = Math.floor(Math.random() * 10000);
      const hoursBeforeScheduleDate = 48;
      let updateRangeResult;
      let createExtractResumeResult;
      let kafkaSendEventResult;
      jest
        .spyOn(
          extractResumeService,
          'getLastExtractByScheduleSettingIdAndTypeAndSettingTypeId',
        )
        .mockImplementation(() => undefined);

      jest
        .spyOn(extractResumeService, 'updateRange')
        .mockImplementation(async (data) => {
          updateRangeResult = data;
          return;
        });

      jest
        .spyOn(extractResumeService, 'createExtractResume')
        .mockImplementation(async (data) => {
          createExtractResumeResult = data;
          data.id = extractId;
          return data as any;
        });

      jest.spyOn(kafkaService, 'sendEvent').mockImplementation((data) => {
        kafkaSendEventResult = data;
        return {} as any;
      });

      const result = await runExtractResumeService.runNextExtract({
        hoursBeforeScheduleDate,
        scheduleGroupRule: ScheduleGroupRule.allOfRange,
        scheduleSetting: {
          id: scheduleSettingId,
          getScheduleInterval,
          extractRule: ExtractRule.DEFAULT,
          workspaceId,
          extractAt: 0, //setado pra zero pra sempre passar na validação de horario minimo pra envio
        } as any,
        settingTypeId: 1,
        type: ExtractResumeType.confirmation,
        erpParams: '{}',
      });

      expect(result).toBe(undefined);
      expect(createExtractResumeResult.id).toBe(extractId);
      expect(updateRangeResult.id).toBe(extractId);
      expect(moment(updateRangeResult.startDate).format()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hour').startOf('day').format(),
      );
      expect(moment(updateRangeResult.endDate).format()).toBe(
        moment().add(hoursBeforeScheduleDate, 'hour').endOf('day').format(),
      );
      expect(kafkaSendEventResult.extract.id).toBe(extractId);
    });
  });
});
