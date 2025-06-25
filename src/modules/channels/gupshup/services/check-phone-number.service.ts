import { Injectable, Logger } from '@nestjs/common';
import { ChannelConfigService } from '../../../channel-config/channel-config.service';
import {
    IWhatswebCheckPhoneNumberResponseEvent,
    KissbotEvent,
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType,
} from 'kissbot-core';
import { EventsService } from '../../../events/events.service';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { getQueueName } from '../../../../common/utils/get-queue-name';
import { rabbitMsgCounter, rabbitMsgCounterError, rabbitMsgLatency } from '../../../../common/utils/prom-metrics';
import * as Sentry from '@sentry/node';
import { getWhatsappPhone } from '../../../../common/utils/utils';

@Injectable()
export class CheckPhoneNumberService {
    private readonly logger = new Logger(CheckPhoneNumberService.name);

    constructor(
        private readonly channelConfigService: ChannelConfigService,
        public readonly eventsService: EventsService,
    ) {}

    @RabbitSubscribe({
        exchange: process.env.EVENT_EXCHANGE_NAME,
        routingKey: KissbotEventType.WHATSWEB_CHECK_PHONE_NUMBER_REQUEST + '.#',
        queue: getQueueName('gupshup-check-phone'),
        queueOptions: {
            durable: true,
            channel: CheckPhoneNumberService.name,
            arguments: {
                'x-single-active-consumer': true,
            },
        },
    })
    private async dispatchEvent(ev: KissbotEvent) {
        const timer = rabbitMsgLatency.labels(CheckPhoneNumberService.name).startTimer();
        rabbitMsgCounter.labels(CheckPhoneNumberService.name).inc();
        try {
            switch (ev.type) {
                case KissbotEventType.WHATSWEB_CHECK_PHONE_NUMBER_REQUEST: {
                    await this.handleEvent(ev.data);
                }
            }
        } catch (e) {
            rabbitMsgCounterError.labels(CheckPhoneNumberService.name).inc();
        }
        timer();
    }

    private async handleEvent(data: any) {
        const channelConfig = await this.channelConfigService.getOneByToken(data.token);

        if (process.env.NODE_ENV === 'local') {
            return await this.sendCheckPhoneNumberResponseEvent({
                isValid: true,
                token: data.token,
                phone: data.phone,
                phoneId: data.phone,
                userId: data.userId,
                whatsapp: data.phone,
            });
        }

        if (channelConfig.canValidateNumber && channelConfig.configData?.appName) {
            const phoneId = getWhatsappPhone(data.phone, data?.ddi);
            try {
                await this.sendCheckPhoneNumberResponseEvent({
                    isValid: true,
                    token: data.token,
                    phone: data.phone,
                    phoneId: phoneId,
                    userId: data.userId,
                    whatsapp: phoneId,
                });
            } catch (e) {
                Sentry.captureException(e);
                this.logger.debug(`try phoneId: ${phoneId}`);

                await this.sendCheckPhoneNumberResponseEvent({
                    isValid: true,
                    token: data.token,
                    phone: data.phone,
                    phoneId,
                    userId: data.userId,
                    whatsapp: data.phone,
                });
            }
        } else {
            this.logger.debug(`data.token ${JSON.stringify}`);
            this.logger.debug(`canValidateNumber ${JSON.stringify(channelConfig)}`);
            this.logger.debug(`==================================================`);
        }
    }

    private async sendCheckPhoneNumberResponseEvent(data: IWhatswebCheckPhoneNumberResponseEvent) {
        await this.eventsService.sendEvent({
            data,
            dataType: KissbotEventDataType.ANY,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.WHATSWEB_CHECK_PHONE_NUMBER_RESPONSE,
        });
    }
}
