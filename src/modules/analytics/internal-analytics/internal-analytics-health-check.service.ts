import { Injectable } from '@nestjs/common';
import { IHealthCheckService } from '../../../common/interfaces/IHealthCheckService';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { INTERNAL_ANALYTICS_CONNECTION } from './conn';

@Injectable()
export class InternalAnalyticsHealthCheckService implements IHealthCheckService {
    constructor(
        @InjectConnection(INTERNAL_ANALYTICS_CONNECTION)
        private connection: Connection,
    ) {}

    public async ping() {
        try {
            const result = await this.connection.query('SELECT 1 as ping');
            return Array.isArray(result) && result.length === 1 && result[0].ping === 1;
        } catch (error) {
            return false;
        }
    }
}
