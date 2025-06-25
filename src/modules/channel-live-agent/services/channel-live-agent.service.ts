import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { ChannelConfigService } from '../../../modules/channel-config/channel-config.service';
import {
    KissbotSocket,
    ISocketSendRequestEvent,
    getConversationRoomId,
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType,
} from 'kissbot-core';
import { EventsService } from './../../../modules/events/events.service';

@Injectable()
export class ChannelLiveAgentService {
    private channelManagerUrl: string;

    constructor(private readonly eventsService: EventsService) {
        this.channelManagerUrl = process.env.CHAT_SOCKET_URI || 'http://localhost:3004';
    }

    dispatchSocket = (conversation: any, data: KissbotSocket) => {
        if (process.env.NODE_ENV == 'test') return;
        const rooms = getConversationRoomId(conversation);
        this.sendActivityToRoom(rooms, data);
    };

    /**
     * Envia activity para todas as salas de membros do tipo da agentQueue
     */
    sendActivityToRoom = async (roomId: any, data: KissbotSocket) => {
        const socketEvent: ISocketSendRequestEvent = {
            data,
            room: roomId,
        };
        this.eventsService.sendEvent({
            data: socketEvent,
            dataType: KissbotEventDataType.SOCKET,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.SOCKET_SEND_REQUEST,
        });
    };
}
