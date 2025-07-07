import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IContactBlockedEvent,
  IContactCreatedEvent,
  IContactUpdatedEvent,
  KissbotEvent,
  KissbotEventType,
} from 'kissbot-core';
import { Repository } from 'typeorm';
import { ANALYTICS_CONNECTION } from '../../consts';
import { ContactSearch } from 'kissbot-entities';
import { CatchError } from '../../../../utils/catch-error';
import { getQueueName } from '../../../../utils/get-queue-name';

@Injectable()
export class ContactSearchConsumerService {
  constructor(
    @InjectRepository(ContactSearch, ANALYTICS_CONNECTION)
    private contactSearchRepository: Repository<ContactSearch>,
  ) {}

  @RabbitSubscribe({
    exchange: process.env.EVENT_EXCHANGE_NAME || 'events',
    routingKey: [
      KissbotEventType.CONTACT_UPDATED,
      KissbotEventType.CONTACT_CREATED,
      KissbotEventType.CONTACT_BLOCKED,
    ],
    queue: getQueueName('contact-search'),
    queueOptions: {
      durable: true,
      channel: ContactSearchConsumerService.name,
    },
  })
  @CatchError()
  private async processUserEvents(event: KissbotEvent) {
    switch (event.type) {
      case KissbotEventType.CONTACT_CREATED:
        await this.createContact(event.data as IContactCreatedEvent);
        break;

      case KissbotEventType.CONTACT_UPDATED:
        await this.updateContact(event.data as IContactUpdatedEvent);
        break;

      case KissbotEventType.CONTACT_BLOCKED:
        await this.updateBlockedContact(event.data as IContactBlockedEvent);
        break;

      default:
        break;
    }
    return;
  }

  private createContactEntity(
    data: IContactCreatedEvent | IContactUpdatedEvent,
  ) {
    const entity: Omit<ContactSearch, 'id'> = {
      refId: data._id,
      name: data.name.toLowerCase(),
      workspaceId: data.workspaceId,
      phone: data.phone,
    };
    return entity;
  }

  @CatchError()
  private async createContact(data: IContactCreatedEvent): Promise<void> {
    try {
      const entity = this.createContactEntity(data);
      await this.contactSearchRepository.save(entity);
    } catch (error) {
      if (
        error?.message?.indexOf(
          'duplicate key value violates unique constraint',
        ) == -1
      ) {
        console.log(
          'ContactSearchConsumerService.createContact',
          error.message,
        );
      }
    }
  }

  @CatchError()
  private async updateContact(data: IContactUpdatedEvent): Promise<void> {
    try {
      const entity = this.createContactEntity(data);
      await this.contactSearchRepository.update(
        { refId: data._id },
        { ...entity },
      );
    } catch (error) {
      console.log('ContactSearchConsumerService.updateContact', error);
    }
  }

  @CatchError()
  private async updateBlockedContact(
    data: IContactBlockedEvent,
  ): Promise<void> {
    try {
      const blockedAt = data.isBlocked ? +new Date() : null;
      await this.contactSearchRepository.update(
        { refId: data.contactId },
        { blockedAt },
      );
    } catch (error) {
      console.log('ContactSearchConsumerService.updateBlockedContact', error);
    }
  }
}
