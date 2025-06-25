import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { IConversationAssignEvent, IdentityType, KissbotEventType } from 'kissbot-core';
import { getQueueName } from '../../../common/utils/get-queue-name';
import { CustomerXService } from './customer-x.service';
import { Identity } from '../../conversation/interfaces/conversation.interface';

@Injectable()
export class MetricsCustomerXConsumerService {
    private readonly logger = new Logger(MetricsCustomerXConsumerService.name);

    constructor(private readonly customerXService: CustomerXService) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: [
            KissbotEventType.CONVERSATION_ASSIGNED,
            KissbotEventType.CONVERSATION_MEMBERS_UPDATED,
            KissbotEventType.BILLING_CREATED_PAYMENT,
            KissbotEventType.RATING_RECEIVED,
        ],
        queue: getQueueName('metric-customer-x'),
        queueOptions: {
            durable: true,
            arguments: {
                'x-single-active-consumer': true,
            },
            channel: MetricsCustomerXConsumerService.name,
        },
    })
    private async consume(event: any) {
        try {
            switch (event.type) {
                case KissbotEventType.CONVERSATION_ASSIGNED: {
                    const data = event?.data as IConversationAssignEvent;
                    const wokspaceId = data?.team?.workspaceId || data?.conversation?.workspace?.id;
                    const teamId = data?.team?._id || data?.conversation?.assignedToTeamId;
                    const members: Identity[] = data?.conversation?.members;
                    if (wokspaceId && teamId) {
                        const activeAgentMember = members?.find(
                            (member) => member?.type === IdentityType.agent && !member?.disabled,
                        );

                        // se não possui nenhum agente ativo no atendimento então este atendimento esta na fila
                        if (!activeAgentMember) {
                            await this.customerXService.setMetricQueueAwaitingAttendance(
                                wokspaceId,
                                teamId,
                                'increase',
                            );
                        }
                    }
                    break;
                }
                case KissbotEventType.CONVERSATION_MEMBERS_UPDATED: {
                    const data: {
                        members?: Identity[];
                        workspaceId: string;
                        teamId: string;
                        _id: string;
                    } = event.data;
                    const wokspaceId = data?.workspaceId;
                    const teamId = data?.teamId;
                    const members: Identity[] = data?.members;
                    if (wokspaceId && teamId) {
                        const countActiveAgentMember =
                            members?.filter((member) => member?.type === IdentityType.agent && !member?.disabled) || [];

                        // se não possui nenhum agente ativo no atendimento então este atendimento voltou para fila
                        if (countActiveAgentMember?.length == 0) {
                            await this.customerXService.setMetricQueueAwaitingAttendance(
                                wokspaceId,
                                teamId,
                                'increase',
                            );
                        } else if (countActiveAgentMember?.length == 1) {
                            // se possui um agente ativo então não esta mais na fila
                            await this.customerXService.setMetricQueueAwaitingAttendance(
                                wokspaceId,
                                teamId,
                                'decrease',
                            );
                        }
                    }
                    break;
                }
                case KissbotEventType.RATING_RECEIVED: {
                    if (event.data.workspaceId && event.data.teamId && event.data.value) {
                        await this.customerXService.setMetricLowRatings(
                            event.data.workspaceId,
                            event.data.teamId,
                            event.data.value,
                        );
                    }
                    break;
                }
                case KissbotEventType.BILLING_CREATED_PAYMENT: {
                    if (event.data) {
                        await this.customerXService.sendBillingTracking(event.data);
                    }
                    break;
                }
            }
        } catch (e) {
            this.logger.error(e);
        }
    }
}
