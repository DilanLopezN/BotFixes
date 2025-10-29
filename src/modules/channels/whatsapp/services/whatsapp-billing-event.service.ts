import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment';
import { Repository } from 'typeorm';
import { CreateWhatsappBillingEvent } from '../interfaces/create-whatsapp-billing-event.interface';
import { WhatsappBillingEvent } from '../models/whatsapp-billing-event.entity';
import { WHATSAPP_CONNECTION } from '../ormconfig';

@Injectable()
export class WhatsappBillingEventService {
    private readonly logger = new Logger(WhatsappBillingEventService.name);

    constructor(
        @InjectRepository(WhatsappBillingEvent, WHATSAPP_CONNECTION)
        private whatsappBillingEventRepository: Repository<WhatsappBillingEvent>,
    ) {}

    async create(data: CreateWhatsappBillingEvent): Promise<void> {
        try {
            await this.whatsappBillingEventRepository.insert({
                ...data,
                createdAt: moment().valueOf(),
            });
        } catch (e) {
            this.logger.error('Error creating WhatsApp billing event', e);
        }
    }
}
