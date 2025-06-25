import { TeamService } from '../../team/services/team.service';
import { Injectable, Logger } from '@nestjs/common';
import { KissbotEventType, KissbotEvent, KissbotSocketType, KissbotSocket, IWhatswebCheckPhoneNumberResponseEvent } from 'kissbot-core';
import { ChannelLiveAgentService } from './channel-live-agent.service';
import { ChannelConfigService } from './../../channel-config/channel-config.service';
import * as _ from 'lodash';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../../common/utils/get-queue-name';
import { castObjectIdToString } from '../../../common/utils/utils';
@Injectable()
export class EventsChannelLiveAgentService {
    private readonly logger = new Logger(EventsChannelLiveAgentService.name);
    constructor(
        private readonly channelLiveAgentService: ChannelLiveAgentService,
        private readonly channelConfigService: ChannelConfigService,
        private readonly teamsService: TeamService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: [
            KissbotEventType.WHATSWEB_DRIVER_STATUS_RESPONSE,
            KissbotEventType.WHATSWEB_QRCODE_RESPONSE,
            KissbotEventType.WHATSWEB_LOGGEDIN_RESPONSE,
            KissbotEventType.WHATSWEB_CHECK_PHONE_NUMBER_RESPONSE,
        ],
        queue: getQueueName('events-channel-live-agent'),
        queueOptions: {
            durable: true,
            channel: EventsChannelLiveAgentService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async handleEvent(event: KissbotEvent) {
        switch (event.type) {
            case (KissbotEventType.WHATSWEB_QRCODE_RESPONSE): {
                await this.handleQrCodeResponse(event);
                break;
            }
            case (KissbotEventType.WHATSWEB_DRIVER_STATUS_RESPONSE): {
                await this.handleStatusResponse(event);
                break;
            }
            case (KissbotEventType.WHATSWEB_LOGGEDIN_RESPONSE): {
                this.handleLoggedInResponse(event);
                break;
            }
            case (KissbotEventType.WHATSWEB_CHECK_PHONE_NUMBER_RESPONSE): {
                this.handleCheckNumberResponse(event);
                break;
            }
        }
    }

    private async sendToSocket(socketRoomId, socketMessage) {
        if (socketRoomId && socketMessage && process.env.NODE_ENV !== 'test') {
            return await this.channelLiveAgentService.sendActivityToRoom(socketRoomId, socketMessage);
        }
    }

    /**
     * Quando o qrCode chega deve enviar para o socket do channelId
     * @param event
     */
    private async handleQrCodeResponse(event: KissbotEvent) {
        const { data }: { data: any } = event;
        const socketMessage: KissbotSocket = {
            message: data,
            type: KissbotSocketType.WHATSAPP_WEB_QRCODE,
        };

        const channelConfig = await this.channelConfigService.getOneBtIdOrToken((data as any).token);

        const rooms = await this.getUsersFromWorkspaceTeams(channelConfig.workspaceId);

        await this.sendToSocket(rooms, socketMessage);
    }

    /**
     * Quando o status chega deve salvar no channelconfig e enviar para socket
     * @param event
     */
    private async handleStatusResponse(event: KissbotEvent) {
        const { data }: { data: any } = event;
        const socketMessage: KissbotSocket = {
            message: data,
            type: KissbotSocketType.WHATSAPP_WEB_STATUS,
        };
        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(data.token);
        data.status.timestamp = new Date();
        this.channelConfigService.updateRaw({ _id: channelConfig._id }, {
            $set: {
                'configData.status': data.status,
            },
        });

        const rooms = await this.getUsersFromWorkspaceTeams(channelConfig.workspaceId);

        await this.sendToSocket(rooms, socketMessage);
    }

    private async handleLoggedInResponse(event: KissbotEvent) {
        const { data }: { data: any } = event;
        const { session } = data;
        const channelConfig = await this.channelConfigService.getOneBtIdOrToken(data.token);
        await this.channelConfigService.updateRaw({ _id: channelConfig._id }, {
            $set: {
                'configData.session': session,
            },
        });
    }

    /**
     * Envia para o front quando um numero é checkado pelo wrappe de whatsapp
     */
    private async handleCheckNumberResponse(event: KissbotEvent) {
        const data = event.data as IWhatswebCheckPhoneNumberResponseEvent;

        const socketMessage: KissbotSocket = {
            message: data,
            type: KissbotSocketType.WHATSWEB_CHECK_PHONE_NUMBER_RESPONSE,
        };

        if (data?.userId) {
            return await this.sendToSocket([data.userId], socketMessage);
        }

        const channelConfig = await this.channelConfigService.getOneBtIdOrToken((event.data as any).token);
        const rooms = await this.getUsersFromWorkspaceTeams(channelConfig.workspaceId);

        await this.sendToSocket(rooms, socketMessage);
    }

    private async getUsersFromWorkspaceTeams(workspaceId: string) {
        const teamList = await this.teamsService.getAll({
            workspaceId,
        });

        let result = [workspaceId];

        if (teamList?.length < 1) {
            return result;
        }

        teamList.forEach(team => result.push(castObjectIdToString(team._id)));

        return result;
    }
}