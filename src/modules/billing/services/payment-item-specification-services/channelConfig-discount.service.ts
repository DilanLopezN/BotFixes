import { Injectable } from '@nestjs/common';
import {
    GetPaymentItemsData,
    IPaymentItemSpecificationService,
} from '../../interfaces/payment-item-specification-service.interface';
import { PaymentItem, PaymentItemTypes } from '../../models/payment-item.entity';
import { ModuleRef } from '@nestjs/core';
import { WorkspaceChannelResumeService } from '../workspace-channel-resume.service';
import { ChannelIdConfig } from 'kissbot-core';

@Injectable()
export class ChannelConfigDiscountService implements IPaymentItemSpecificationService {
    constructor(private moduleRef: ModuleRef) {}

    async getPaymentItems(data: GetPaymentItemsData): Promise<Partial<PaymentItem>[]> {
        const { startDate, workspace, specification } = data;
        const service = this.moduleRef.get<WorkspaceChannelResumeService>(WorkspaceChannelResumeService, {
            strict: true,
        });

        let channelConfig: ChannelIdConfig = null;
        let itemDescription = '';

        switch (specification.type) {
            case PaymentItemTypes.reminder_discount: {
                channelConfig = ChannelIdConfig.reminder;
                itemDescription = 'Desconto referente a envios de lembretes';
                break;
            }
            case PaymentItemTypes.campaign_discount: {
                channelConfig = ChannelIdConfig.campaign;
                itemDescription = 'Desconto referente a envios de lista de transmissão';
                break;
            }
            case PaymentItemTypes.api_discount: {
                channelConfig = ChannelIdConfig.api;
                itemDescription = 'Desconto referente a envios de API';
                break;
            }
            case PaymentItemTypes.confirmation_discount: {
                channelConfig = ChannelIdConfig.confirmation;
                itemDescription = 'Desconto referente a envios de confirmação';
                break;
            }
            case PaymentItemTypes.nps_discount: {
                channelConfig = ChannelIdConfig.nps;
                itemDescription = 'Desconto referente a envios de NPS - (Pesquisa de satisfação)';
                break;
            }
            case PaymentItemTypes.medical_report_discount: {
                channelConfig = ChannelIdConfig.medical_report;
                itemDescription = 'Desconto referente a envios de laudo médico';
                break;
            }
            case PaymentItemTypes.api_ivr_discount: {
                channelConfig = ChannelIdConfig.api_ivr;
                itemDescription = 'Desconto referente a envios de URA';
                break;
            }
            case PaymentItemTypes.schedule_notification_discount: {
                channelConfig = ChannelIdConfig.schedule_notification;
                itemDescription = 'Desconto referente a envios de notificação de agendamento';
                break;
            }
            case PaymentItemTypes.recover_lost_schedule_discount: {
                channelConfig = ChannelIdConfig.recover_lost_schedule;
                itemDescription = 'Desconto referente a envios de recuperação de agendamento perdido';
                break;
            }
            case PaymentItemTypes.documents_request_discount: {
                channelConfig = ChannelIdConfig.documents_request;
                itemDescription = 'Desconto referente a envios de solicitação de documentos';
                break;
            }
            default: {
                channelConfig = null;
                break;
            }
        }

        const items = [];

        if (!channelConfig) {
            return items;
        }

        const totalConversations = await service.getChannelsSumByWorkspace(workspace.id, startDate.toDate());
        const planConversationCount = Number(workspace.planConversationLimit || Number.MAX_VALUE);

        // Verifica se teve excedente, só calcula o desconto apenas para o channel especifico
        if (totalConversations > planConversationCount) {
            const planConversationExceededPrice = parseFloat(String(workspace.planConversationExceedPrice));
            const totalChannelConversations = await service.getChannelsSumByWorkspaceAndChannel(
                workspace.id,
                channelConfig,
                startDate.toDate(),
            );

            if (totalChannelConversations) {
                let totalChannelConversationsToBill = totalChannelConversations;
                // Se tiver mais atendimentos do canal do que conversas excedentes então deve dar desconto apenas nas conversas
                // excedentes, pois não pode ter fatura menor que o plano
                if (totalChannelConversations > totalConversations - planConversationCount) {
                    //Popula o totalChannelConversationsToBill com a quantidade de excedentes
                    totalChannelConversationsToBill = totalConversations - planConversationCount;
                }
                items.push({
                    itemDescription: itemDescription,
                    quantity: totalChannelConversationsToBill,
                    totalPrice: totalChannelConversationsToBill * planConversationExceededPrice * -1,
                    unitPrice: planConversationExceededPrice * -1,
                    type: specification.type,
                });
            }
        }
        return items;
    }
}
