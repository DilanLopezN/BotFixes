import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IConversationAddAttributeEvent,
  IConversationRemoveAttributeEvent,
  KissbotEvent,
  KissbotEventType,
  ChannelIdConfig,
  IdentityType,
} from 'kissbot-core';
import { Repository } from 'typeorm';
import * as moment from 'moment';
import { isArray } from 'lodash';
import { ConversationDataType, ConversationSearch } from 'kissbot-entities';
import { ANALYTICS_CONNECTION } from '../../consts';
import { CatchError } from '../../../../utils/catch-error';
import { getQueueName } from '../../../../utils/get-queue-name';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  type: string;
  phone?: string;
  email?: string;
  contactId?: string;
  channelId: ChannelIdConfig;
}

interface Attribute {
  name: string;
  type: string;
  value: string;
  label: string;
  _id: string;
}

@Injectable()
export class ConversationSearchConsumerService {
  constructor(
    @InjectRepository(ConversationSearch, ANALYTICS_CONNECTION)
    private conversationSearchRepository: Repository<ConversationSearch>,
  ) {}

  @RabbitSubscribe({
    exchange: process.env.EVENT_EXCHANGE_NAME || 'events',
    routingKey: [
      KissbotEventType.CONVERSATION_MEMBERS_UPDATED,
      KissbotEventType.CONVERSATION_MEMBER_UPDATED,
      KissbotEventType.CONVERSATION_UPDATED,
      KissbotEventType.CONVERSATION_CREATED,
      KissbotEventType.CONVERSATION_ATTRIBUTE_ADDED,
      KissbotEventType.CONVERSATION_ATTRIBUTE_REMOVED,
    ],
    queue: getQueueName('conversation-search'),
    queueOptions: {
      durable: true,
      channel: ConversationSearchConsumerService.name,
    },
  })
  @CatchError()
  private async processUserEvents(event: KissbotEvent) {
    switch (event.type) {
      case KissbotEventType.CONVERSATION_MEMBERS_UPDATED:
      case KissbotEventType.CONVERSATION_MEMBER_UPDATED:
        return await this.updateConversationMembers(event.data);

      case KissbotEventType.CONVERSATION_CREATED:
        return await this.createDataFromConversation(event.data);

      case KissbotEventType.CONVERSATION_UPDATED:
        return await this.updateDataFromConversation(event.data);

      case KissbotEventType.CONVERSATION_ATTRIBUTE_ADDED:
        return await this.createAttributes(
          event.data as IConversationAddAttributeEvent,
        );

      case KissbotEventType.CONVERSATION_ATTRIBUTE_REMOVED:
        return await this.removeAttribute(
          event.data as IConversationRemoveAttributeEvent,
        );

      default:
        break;
    }
  }

  private formatAttributeData(value: string, type: string): string {
    switch (type) {
      case '@sys.cpf':
        return value.replace(/\D/g, '')?.replace(/[/.-]/g, '');

      case '@sys.date': {
        try {
          const date = moment(value);
          return date.isValid() ? date.format('DD/MM/YYYY') : undefined;
        } catch (error) {
          return undefined;
        }
      }

      default:
        return value;
    }
  }

  private canCreateConversationSearch(conversation) {
    return conversation?.createdByChannel !== ChannelIdConfig.webemulator;
  }

  @CatchError()
  private async createAttributes({
    data,
    conversation,
    conversationId,
    workspaceId,
  }: IConversationAddAttributeEvent): Promise<void> {
    if (!this.canCreateConversationSearch(conversation)) {
      return;
    }

    try {
      const validAttributesTypes = ['@sys.cpf', '@sys.fullName', '@sys.date'];
      const validAttributes = (data as Attribute[]).filter(
        (attr) => attr.label && validAttributesTypes.includes(attr.type),
      );

      if (validAttributes.length) {
        const entities: ConversationSearch[] = [];

        data
          // utiliza apenas atributos com label, não da para identificar o que é do engine ou dado útil pra consulta
          .filter((attr: Attribute) => !!attr.label)
          .forEach((attr: Attribute) => {
            const attrValue = this.formatAttributeData(attr.value, attr.type);

            if (!attrValue || String(attrValue).length <= 3) {
              return;
            }

            const entity = {
              dataType: ConversationDataType.attribute,
              refId: attr._id,
              attrValue: attrValue.toLowerCase(),
              attrLabel: attr.label,
              attrName: attr.name,
              conversationId,
              workspaceId,
              timestamp: moment().valueOf(),
            } as ConversationSearch;

            entities.push(entity);
          });

        if (!entities.length) {
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        const promises = entities.map((entity) => {
          return this.conversationSearchRepository
            .createQueryBuilder()
            .insert()
            .values(entity)
            .orUpdate({
              conflict_target: ['attr_name', 'conversation_id'],
              overwrite: ['attr_value'],
            })
            .execute();
        });

        await Promise.all(promises);
      }
    } catch (error) {
      console.log('ConversationSearchConsumerService.createAttributes', error);
    }
  }

  @CatchError()
  private async removeAttribute(
    data: IConversationRemoveAttributeEvent,
  ): Promise<void> {
    try {
      await this.conversationSearchRepository.delete({
        refId: data._id,
        attrName: data.name.toLowerCase(),
        conversationId: data.conversationId,
      });
    } catch (error) {
      console.log('ConversationSearchConsumerService.removeAttribute', error);
    }
  }

  private parseMemberToSearchableData(
    members: Member | Member[],
  ): Partial<ConversationSearch>[] {
    if (!isArray(members)) {
      members = [members as Member];
    }

    return (
      (members as Member[])
        // salva apenas membros do tipo usuário e do whats/telegram ..
        .filter(
          (member) =>
            member.type === IdentityType.user &&
            [
              ChannelIdConfig.whatsapp,
              ChannelIdConfig.whatsweb,
              ChannelIdConfig.gupshup,
              ChannelIdConfig.instagram,
              ChannelIdConfig.facebook,
              ChannelIdConfig.telegram,
            ].includes(member.channelId),
        )
        .reduce(
          (entities: Partial<ConversationSearch>[], member) => [
            ...entities,
            {
              dataType: ConversationDataType.contact,
              contactPhone: member.phone,
              contactName: member.name.toLowerCase(),
              refId: member.id || member.phone,
            },
          ],
          [],
        )
    );
  }

  private async updateMembers(
    members: Member[],
    conversationId: string,
    workspaceId: string,
  ) {
    try {
      const entities: Partial<ConversationSearch>[] =
        this.parseMemberToSearchableData(members).map((member) => ({
          ...member,
          conversationId,
          workspaceId,
        }));

      return await Promise.all(
        entities.map((entity) =>
          this.conversationSearchRepository.update(
            { conversationId, refId: entity.refId },
            entity,
          ),
        ),
      );
    } catch (error) {
      console.log('ConversationSearchConsumerService.updateMembers', error);
    }
  }

  @CatchError()
  private async updateConversationMembers(data: any): Promise<void> {
    if (!this.canCreateConversationSearch(data)) {
      return;
    }

    try {
      await this.updateMembers(data.members, data._id, data.workspaceId);
    } catch (error) {
      console.log(
        'ConversationSearchConsumerService.updateConversationMembers',
        error,
      );
    }
  }

  @CatchError()
  private async createDataFromConversation(data: any): Promise<void> {
    if (!this.canCreateConversationSearch(data)) {
      return;
    }

    try {
      const entities: Partial<ConversationSearch>[] =
        this.parseMemberToSearchableData(data.members).map((member) => ({
          ...member,
          conversationId: data._id,
          workspaceId: data.workspace._id,
          timestamp: moment(data.createdAt).valueOf(),
        }));

      await this.conversationSearchRepository.save(entities);
    } catch (error) {
      console.log(
        'ConversationSearchConsumerService.createDataFromConversation',
        error,
      );
    }
  }

  @CatchError()
  private async updateDataFromConversation(data: any): Promise<void> {
    if (!this.canCreateConversationSearch(data)) {
      return;
    }

    try {
      await this.updateMembers(data.members, data._id, data.workspace._id);
    } catch (error) {
      console.log(
        'ConversationSearchConsumerService.updateDataFromConversation',
        error,
      );
    }
  }
}
