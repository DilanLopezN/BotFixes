import { Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as moment from 'moment';
import { Repository } from "typeorm";
import { CatchError } from "../../auth/exceptions";
import { ActiveMessage } from "../models/active-message.entity";
import { SendActiveMessageIncomingData } from "../models/send-active-message-data.entity";
import { ACTIVE_MESSAGE_CONNECTION } from "../ormconfig";

export class SendActiveMessageIncomingDataService {

    private readonly logger = new Logger(SendActiveMessageIncomingDataService.name)
    constructor (
        @InjectRepository(SendActiveMessageIncomingData, ACTIVE_MESSAGE_CONNECTION)
        public repository: Repository<SendActiveMessageIncomingData>,
    ) {}

    @CatchError()
    async create(data: Partial<SendActiveMessageIncomingData>) {
        return await this.repository.save({
            ...data,
            createdAt: moment().valueOf(),
        })
    }

    async getNotProcessedIncomingData(timestamp: number, activeMessageSettingId?: number, limit?: number) {
        let query = await this.repository.createQueryBuilder('ss')
            .innerJoin(
                ActiveMessage,
                'ac',
                'ss.external_id = ac.external_id'
            )
            .where(`ss.created_at > 1685044800000`)
            .andWhere(`ss.created_at < 1685055600000`)
            .andWhere(`ss.api_token = '35781f60-df2d-44fa-afde-a6812be49ec9'`)
            .andWhere(`ac.status_id = 8`)
            .andWhere(`ac.received_at IS NULL`)
            .take((limit || 20))

        return await query.getMany();
    }

    @CatchError()
    async updateRetryAt(id: number, retryAt?: number) {
        return await this.repository.update({
            id,
        }, {
            retryAt: retryAt || moment().valueOf(),
        });
    }
}