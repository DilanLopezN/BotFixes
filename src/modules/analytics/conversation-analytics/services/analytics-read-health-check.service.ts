import { Injectable } from '@nestjs/common';
import { IHealthCheckService } from '../../../../common/interfaces/IHealthCheckService';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { ANALYTICS_READ_CONNECTION } from '../../ormconfig';

@Injectable()
export class AnalyticsReadHealthCheckService implements IHealthCheckService {
    constructor(
        @InjectConnection(ANALYTICS_READ_CONNECTION)
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
