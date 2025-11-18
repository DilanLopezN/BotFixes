import { Test, TestingModule } from '@nestjs/testing';
import { createMock } from '@golevelup/ts-jest';
import { ApiQueueService, MessageBody, Message, STATUS } from '../api-queue.service';
import { ApiService } from '../api.service';
import { IntegrationCacheUtilsService } from '../../../integration-cache-utils/integration-cache-utils.service';
import { getSampleIntegrationDocument } from '../../../../mock/integration.mock';
import { IntegrationService } from '../../../integration/integration.service';
import { ObjectId } from 'typeorm';
import { Types } from 'mongoose';
import { IntegrationDocument } from '../../../integration/schema/integration.schema';

describe('ApiQueueService', () => {
  let apiQueueService: ApiQueueService;
  let integrationCacheUtilsService: IntegrationCacheUtilsService;
  let integrationService: IntegrationService;
  let apiService: ApiService;

  let messageMock: MessageBody = {
    integrationId: '',
    id: '0',
    internalId: 'INT1001',
    token: 'Abc123!Xyz456?789_abc-123-xyz-456-789',
    customFlow: '',
    phone: '1234567890',
    attributes: [
      { name: '', value: 'Atributo 01' },
      { name: '', value: 'Atributo 02' },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiQueueService,
        { provide: IntegrationCacheUtilsService, useValue: createMock<IntegrationCacheUtilsService>() },
        { provide: ApiService, useValue: createMock<ApiService>() },
        { provide: IntegrationService, useValue: createMock<IntegrationService>() },
      ],
    }).compile();

    apiQueueService = module.get<ApiQueueService>(ApiQueueService);
    integrationCacheUtilsService = module.get<IntegrationCacheUtilsService>(IntegrationCacheUtilsService);
    apiService = module.get<ApiService>(ApiService);
    integrationService = module.get<IntegrationService>(IntegrationService);

    jest.spyOn(apiQueueService['logger'], 'error').mockImplementation(jest.fn());
  });

  it('should be defined', () => {
    expect(ApiQueueService).toBeDefined();
  });

  afterAll(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('FUNC: enqueue', () => {
    beforeEach(() => {
      jest
        .spyOn(apiQueueService as any, 'runProcess')
        .mockImplementation(() => (apiQueueService['interval'] = setInterval(() => {})));

      jest.spyOn(integrationCacheUtilsService as any, 'setApiQueueCache').mockImplementation(() => undefined);
    });

    it('should have an error in a message list', async () => {
      const message = [undefined];
      let caughtError: Error | null = null;

      try {
        await apiQueueService.enqueue(message);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(Error);
    });

    it('should have an error when get the cache of message', async () => {
      const message: Message[] = [];
      const integration = getSampleIntegrationDocument({});
      message.push({
        messageBody: { ...messageMock, id: '0', integrationId: String(integration._id) },
        callback: jest.fn(() => ({ ok: true })),
      });

      jest.spyOn(integrationService as any, 'getOne').mockImplementation((id) => integration);
      jest.spyOn(integrationCacheUtilsService as any, 'getApiQueueCache').mockImplementation(() => {
        throw new Error();
      });

      await apiQueueService.enqueue(message);
      clearInterval(apiQueueService['interval']);

      expect(apiQueueService['messages'].length).toEqual(1);
      expect(Object.values(apiQueueService['integrations']).length).toEqual(1);
      expect(apiQueueService['interval']).not.toBe(null);
      expect(apiQueueService['runProcess']).toHaveBeenCalledTimes(1);
      expect(integrationCacheUtilsService['getApiQueueCache']).toHaveBeenCalledTimes(1);
      expect(integrationCacheUtilsService['getApiQueueCache']).toThrow(Error);
      expect(integrationCacheUtilsService['setApiQueueCache']).toHaveBeenCalledTimes(0);
    });

    it('should add a message and update cache', async () => {
      const message: Message[] = [];
      const integration = getSampleIntegrationDocument({});

      jest.spyOn(integrationService as any, 'getOne').mockImplementation((id) => integration);
      jest.spyOn(integrationCacheUtilsService as any, 'getApiQueueCache').mockImplementation(() => undefined);

      message.push({
        messageBody: { ...messageMock, id: '0', integrationId: String(integration._id) },
        callback: jest.fn(() => ({ ok: true })),
      });

      await apiQueueService.enqueue(message);
      clearInterval(apiQueueService['interval']);

      expect(apiQueueService['messages'].length).toEqual(1);
      expect(Object.values(apiQueueService['integrations']).length).toEqual(1);
      expect(apiQueueService['interval']).not.toBe(null);
      expect(apiQueueService['runProcess']).toHaveBeenCalledTimes(1);
      expect(integrationCacheUtilsService['getApiQueueCache']).toHaveBeenCalledTimes(1);
      expect(integrationCacheUtilsService['setApiQueueCache']).toHaveBeenCalledTimes(1);
    });

    it('should add a message and not update cache', async () => {
      const message: Message[] = [];
      const integration = getSampleIntegrationDocument({});

      jest.spyOn(integrationService as any, 'getOne').mockImplementation((id) => integration);
      jest.spyOn(integrationCacheUtilsService as any, 'getApiQueueCache').mockImplementation(() => STATUS.FINISHED);

      message.push({
        messageBody: { ...messageMock, id: '0', integrationId: String(integration._id) },
        callback: jest.fn(() => ({ ok: true })),
      });

      await apiQueueService.enqueue(message);
      clearInterval(apiQueueService['interval']);

      expect(apiQueueService['messages'].length).toEqual(1);
      expect(Object.values(apiQueueService['integrations']).length).toEqual(1);
      expect(apiQueueService['interval']).not.toBe(null);
      expect(apiQueueService['runProcess']).toHaveBeenCalledTimes(1);
      expect(integrationCacheUtilsService['getApiQueueCache']).toHaveBeenCalledTimes(1);
      expect(integrationCacheUtilsService['setApiQueueCache']).toHaveBeenCalledTimes(0);
    });

    it('should add a couple of messages', async () => {
      const message: Message[] = [];
      const integration = getSampleIntegrationDocument({});

      jest.spyOn(integrationService as any, 'getOne').mockImplementation((id) => integration);

      for (let j = 0; j < 5; j++) {
        message.push({
          messageBody: { ...messageMock, id: String(j), integrationId: String(integration._id) },
          callback: jest.fn(() => ({ ok: true })),
        });
      }

      await apiQueueService.enqueue(message);
      await apiQueueService.enqueue(message);
      clearInterval(apiQueueService['interval']);

      expect(apiQueueService['messages'].length).toEqual(5);
      expect(Object.values(apiQueueService['integrations']).length).toEqual(1);
      expect(apiQueueService['interval']).not.toBe(null);
      expect(apiQueueService['runProcess']).toHaveBeenCalledTimes(1);
    });

    it('should add messages with multiple integrations', async () => {
      const message: Message[] = [];
      const integrations: IntegrationDocument[] = [];

      for (let i = 0; i < 10; i++) {
        const integration = getSampleIntegrationDocument({});
        integrations[integration._id.toString()] = integration;

        for (let j = 0; j < 2; j++) {
          message.push({
            messageBody: { ...messageMock, id: String(j), integrationId: String(integration._id) },
            callback: jest.fn(() => ({ ok: true })),
          });
        }
      }

      jest.spyOn(integrationService as any, 'getOne').mockImplementation((id: string) => integrations[id]);

      await apiQueueService.enqueue(message);
      clearInterval(apiQueueService['interval']);

      expect(apiQueueService['messages'].length).toEqual(20);
      expect(Object.values(apiQueueService['integrations']).length).toEqual(10);
      expect(apiQueueService['interval']).not.toBe(null);
      expect(apiQueueService['runProcess']).toHaveBeenCalledTimes(1);
    });

    it('should add a same message 2 times but ignore the duplicate message', async () => {
      const message: Message[] = [];
      const integration = getSampleIntegrationDocument({});

      for (let j = 0; j < 1; j++) {
        message.push({
          messageBody: { ...messageMock, id: String(j), integrationId: String(integration._id) },
          callback: jest.fn(() => ({ ok: true })),
        });
      }

      jest.spyOn(integrationService as any, 'getOne').mockImplementation((id) => integration);

      await apiQueueService.enqueue(message);
      await apiQueueService.enqueue(message);
      clearInterval(apiQueueService['interval']);

      expect(apiQueueService['messages'].length).toEqual(1);
      expect(Object.values(apiQueueService['integrations']).length).toEqual(1);
      expect(apiQueueService['interval']).not.toBe(null);
      expect(apiQueueService['runProcess']).toHaveBeenCalledTimes(1);
    });
  });

  describe('FUNC: runProcess', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(global, 'setInterval');
      jest.spyOn(global, 'clearInterval');
      jest
        .spyOn(apiQueueService as any, 'sendMessage')
        .mockImplementation((message: Message) => new Promise<Message>((resolve) => resolve(message)));
    });
    it('should send less then batch size of the messages', async () => {
      const messages: Message[] = [];
      const integration = getSampleIntegrationDocument({});

      for (let j = 0; j < 9; j++) {
        messages.push({
          messageBody: {
            ...messageMock,
            integrationId: String(integration._id),
            id: String(j),
          },
          callback: jest.fn(() => ({ ok: true })),
        });
      }

      apiQueueService['messages'] = messages;
      apiQueueService['integrations'][String(integration._id)] = integration;
      apiQueueService['runProcess']();

      await jest.advanceTimersByTimeAsync(apiQueueService['INTERVAL_TIME']);

      expect(apiQueueService['messages'].length).toEqual(0);
      expect(apiQueueService['sendMessage']).toHaveBeenCalledTimes(9);
      messages.forEach((message) => {
        expect(message.callback).toHaveBeenCalledTimes(1);
      });

      clearInterval(apiQueueService['interval']);
    });

    it('should execute the timer twice', async () => {
      const messages: Message[] = [];
      const integration = getSampleIntegrationDocument({});

      for (let j = 0; j < 11; j++) {
        messages.push({
          messageBody: {
            ...messageMock,
            integrationId: String(integration._id),
            id: String(j),
          },
          callback: jest.fn(() => ({ ok: true })),
        });
      }

      apiQueueService['messages'] = messages;
      apiQueueService['integrations'][String(integration._id)] = integration;
      apiQueueService['runProcess']();

      await jest.advanceTimersByTimeAsync(apiQueueService['INTERVAL_TIME']);

      expect(apiQueueService['messages'].length).toEqual(1);
      expect(apiQueueService['sendMessage']).toHaveBeenCalledTimes(10);

      await jest.advanceTimersByTimeAsync(apiQueueService['INTERVAL_TIME']);

      expect(apiQueueService['messages'].length).toEqual(0);
      expect(apiQueueService['sendMessage']).toHaveBeenCalledTimes(11);

      clearInterval(apiQueueService['interval']);
    });

    it('should close the interval if do not have messages', async () => {
      apiQueueService['messages'] = [];
      apiQueueService['interval'] = setInterval(() => {}, apiQueueService['INTERVAL_TIME']);

      apiQueueService['runProcess']();

      await jest.advanceTimersByTimeAsync(apiQueueService['INTERVAL_TIME']);

      expect(apiQueueService['interval']).toBe(null);
      expect(clearInterval).toHaveBeenCalledTimes(1);
    });
  });

  describe('FUNC: sendMessage', () => {
    beforeEach(() => {
      jest.spyOn(integrationCacheUtilsService as any, 'setApiQueueCache');
      jest.spyOn(apiService as any, 'sendMessage');
    });

    it('should send the message and update the cache', async () => {
      jest.spyOn(integrationCacheUtilsService as any, 'getApiQueueCache').mockImplementation(() => STATUS.PROCESSING);

      const integration = getSampleIntegrationDocument({});

      apiQueueService['integrations'][String(integration._id)] = integration;

      await apiQueueService['sendMessage']({
        messageBody: messageMock,
        callback: jest.fn(() => ({ ok: true })),
      });

      expect(integrationCacheUtilsService.getApiQueueCache).toHaveBeenCalledTimes(1);
      expect(integrationCacheUtilsService.setApiQueueCache).toHaveBeenCalledTimes(1);
      expect(apiService.sendMessage).toHaveBeenCalledTimes(1);
    });

    it('should not send the message and update the cache', async () => {
      const integration = getSampleIntegrationDocument({});

      apiQueueService['integrations'][String(integration._id)] = integration;

      jest.spyOn(integrationCacheUtilsService as any, 'getApiQueueCache').mockImplementationOnce(() => STATUS.SENDED);

      await apiQueueService['sendMessage']({ messageBody: messageMock, callback: jest.fn(() => ({ ok: true })) });

      expect(integrationCacheUtilsService.getApiQueueCache).toHaveBeenCalledTimes(1);
      expect(integrationCacheUtilsService.setApiQueueCache).toHaveBeenCalledTimes(0);
      expect(apiService.sendMessage).toHaveBeenCalledTimes(0);

      jest.spyOn(integrationCacheUtilsService as any, 'getApiQueueCache').mockImplementationOnce(() => STATUS.FINISHED);

      await apiQueueService['sendMessage']({ messageBody: messageMock, callback: jest.fn(() => ({ ok: true })) });

      expect(integrationCacheUtilsService.getApiQueueCache).toHaveBeenCalledTimes(2);
      expect(integrationCacheUtilsService.setApiQueueCache).toHaveBeenCalledTimes(0);
      expect(apiService.sendMessage).toHaveBeenCalledTimes(0);

      jest.spyOn(integrationCacheUtilsService as any, 'getApiQueueCache').mockImplementationOnce(() => undefined);

      await apiQueueService['sendMessage']({ messageBody: messageMock, callback: jest.fn(() => ({ ok: true })) });

      expect(integrationCacheUtilsService.getApiQueueCache).toHaveBeenCalledTimes(3);
      expect(integrationCacheUtilsService.setApiQueueCache).toHaveBeenCalledTimes(0);
      expect(apiService.sendMessage).toHaveBeenCalledTimes(0);
    });
  });
});
