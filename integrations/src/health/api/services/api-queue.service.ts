import { Injectable, Logger } from '@nestjs/common';
import { IntegrationDocument } from '../../integration/schema/integration.schema';
import { IntegrationCacheUtilsService } from '../../integration-cache-utils/integration-cache-utils.service';
import { ApiService } from './api.service';
import { IntegrationService } from '../../integration/integration.service';
import { OkResponse } from '../../../common/interfaces/ok-response.interface';

export enum STATUS {
  PROCESSING = 'processing',
  SENDED = 'sended',
  FINISHED = 'finished',
}

export enum EndpointType {
  DEFAULT = 'default',
  TRACKED = 'tracked',
}

export interface MessageBody {
  integrationId: string;
  id: string;
  phone: string;
  token: string;
  attributes: {
    name: string;
    value: string;
  }[];
  internalId?: string;
  customFlow?: string;
  sendType?: string;
  templateId?: string;
}

export interface Message {
  messageBody: MessageBody;
  callback: () => OkResponse | Promise<OkResponse>;
  config?: {
    endpointType: EndpointType;
  };
}

@Injectable()
export class ApiQueueService {
  private readonly INTERVAL_TIME: number = 1_000;
  private readonly BATCH_SIZE: number = 10;
  private readonly logger = new Logger(ApiQueueService.name);

  private interval: NodeJS.Timeout = null;
  private messages: Message[] = [];
  private integrations: { [key: string]: IntegrationDocument } = {};

  constructor(
    private readonly apiService: ApiService,
    private readonly integrationCacheUtilsService: IntegrationCacheUtilsService,
    private readonly integrationService: IntegrationService,
  ) {}

  public async enqueue(messageList: Message[]) {
    if (!messageList.length) return;

    await this.addMessages(messageList);

    if (this.interval) return;

    this.runProcess();
  }

  private async addMessages(messageList: Message[]): Promise<void> {
    try {
      const integrationsId = new Set<string>(messageList.map((el) => el.messageBody.integrationId));
      const integrationPromises = [...integrationsId].map(async (id) => {
        if (!this.integrations[id]) {
          this.integrations[id] = await this.integrationService.getOne(id);
        }
      });

      await Promise.allSettled(integrationPromises);

      const messageId = new Set<string>(
        this.messages.map(({ messageBody: { id, integrationId } }) => `${integrationId}_${id}`),
      );
      const messageFiltered = messageList.filter(
        ({ messageBody: { id, integrationId } }) => !messageId.has(`${integrationId}_${String(id)}`),
      );

      if (!messageFiltered.length) {
        return;
      }

      this.messages.push(...messageFiltered);

      const updateCache = messageFiltered.map(async ({ messageBody: { id, integrationId } }) => {
        const cachedMessage = await this.getCache(this.integrations[integrationId], id);

        if (!cachedMessage) {
          return this.updateCache(this.integrations[integrationId], id, STATUS.PROCESSING);
        }
      });

      await Promise.allSettled(updateCache);
    } catch (error) {
      this.logger.error('Error on format message', error);
      throw error;
    }
  }

  private runProcess() {
    this.interval = setInterval(async () => {
      try {
        if (!this.messages.length) {
          clearInterval(this.interval);

          return (this.interval = null);
        }

        const messagesToSend = this.messages.splice(0, this.BATCH_SIZE);

        const sendPromises = messagesToSend.map((message) => this.sendMessage(message));

        const fulfilledMessages = (await Promise.allSettled(sendPromises))
          .filter((result) => result.status === 'fulfilled')
          .map((result: PromiseFulfilledResult<Message>) => result.value);

        const sendCallbacks = fulfilledMessages.map(async ({ callback, messageBody }) => {
          const { ok } = await callback();
          return { messageBody, ok };
        });

        const fulfilledCallbacks = (await Promise.allSettled(sendCallbacks))
          .filter((result) => result.status === 'fulfilled')
          .map((result: PromiseFulfilledResult<{ messageBody: MessageBody; ok: boolean }>) => result.value);

        const messagesUpdatedCache = fulfilledCallbacks
          .filter(({ ok }) => ok)
          .map(async ({ messageBody: { id, integrationId }, ok }) => {
            if (ok) {
              await this.updateCache(this.integrations[integrationId], id, STATUS.FINISHED);
            }
          });

        await Promise.allSettled(messagesUpdatedCache);
      } catch (error) {
        this.logger.error('Error on interval', error);
      }
    }, this.INTERVAL_TIME);
  }

  private async sendMessage(message: Message): Promise<Message> {
    try {
      const { messageBody } = message;
      const integration = this.integrations[messageBody.integrationId];
      const cachedMessage = await this.getCache(integration, messageBody.id);

      if (cachedMessage === STATUS.PROCESSING) {
        if (message.config?.endpointType === EndpointType.TRACKED) {
          if (!messageBody?.sendType) {
            throw Error('The sendType is required to track the message');
          }

          const mountedAttributes = messageBody.attributes.reduce((acc, el) => {
            acc[el.name] = el.value;
            return acc;
          }, {});

          await this.apiService.sendTrackedMessage(integration, {
            schedule: {
              scheduleCode: mountedAttributes['schedule.code']
                ? `${mountedAttributes['schedule.code']}-${Math.random().toString(36).substring(2, 7)}`
                : '-1',
              scheduleDate: mountedAttributes['schedule.date'] || '-1',
              data: {
                URL_0: mountedAttributes['URL_0'] || '-1',
              },
            },
            apiKey: messageBody.token,
            contact: {
              name: mountedAttributes['contact.name'] || '-1',
              code: mountedAttributes['contact.code'] || '-1',
              phone: [messageBody.phone],
            },
            sendType: messageBody.sendType,
          });
        } else {
          await this.apiService.sendMessage(integration, {
            attributes: messageBody.attributes?.map(({ name, value }) => ({ name, value })) || [],
            apiToken: messageBody.token,
            phoneNumber: messageBody.phone,
            action: messageBody.customFlow || null,
            templateId: messageBody.templateId || '',
            externalId: messageBody.internalId ? String(messageBody.internalId) : null,
          });
        }

        await this.updateCache(this.integrations[messageBody.integrationId], messageBody.id, STATUS.SENDED);
      }

      return message;
    } catch (error) {
      this.logger.error('Error sending message', error);
      throw error;
    }
  }

  private async getCache(integration: IntegrationDocument, id: string) {
    try {
      return this.integrationCacheUtilsService.getApiQueueCache(integration, id);
    } catch (error) {
      this.logger.error('Error on get cache', error);
      throw error;
    }
  }

  private async updateCache(integration: IntegrationDocument, id: string, status: STATUS) {
    try {
      await this.integrationCacheUtilsService.setApiQueueCache(integration, id, status);
    } catch (error) {
      this.logger.error('Error on update cache', error);
      throw error;
    }
  }
}
