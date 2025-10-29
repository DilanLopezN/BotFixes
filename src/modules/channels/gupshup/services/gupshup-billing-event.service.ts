import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from "moment";
import { CatchError } from "./../../../auth/exceptions";
import { Repository } from "typeorm";
import { CreateGupshupBillingEvent } from "../interfaces/create-gupshup-billing-event.interface";
import { GupshupBillingEvent } from "../models/gupshup-billing-event.entity";
import { GUPSHUP_CONNECTION } from "../ormconfig";

@Injectable()
export class GupshupBillingEventService {
    private readonly logger = new Logger(GupshupBillingEventService.name);
    constructor(
        @InjectRepository(GupshupBillingEvent, GUPSHUP_CONNECTION)
        private gupshupBillingEventRepository: Repository<GupshupBillingEvent>,
    ) {}

    @CatchError()
    async create(data: CreateGupshupBillingEvent) {
        try {
            await this.gupshupBillingEventRepository.insert({
                ...data,
                createdAt: moment().valueOf(),
            });
        } catch (e) {
            this.logger.log(e);
        }
    }
}