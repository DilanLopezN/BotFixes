import { Injectable } from '@nestjs/common';
import { IHealthCheckService } from '../../../common/interfaces/IHealthCheckService';
import { ACTIVE_MESSAGE_CONNECTION } from '../ormconfig';
import { Connection } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';

@Injectable()
export class ActiveMessageHealthCheckService implements IHealthCheckService {
    constructor(
        @InjectConnection(ACTIVE_MESSAGE_CONNECTION)
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
