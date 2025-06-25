import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import * as moment from 'moment';
import { Connection } from 'typeorm';
import { BILLING_CONNECTION } from '../ormconfig';

@Injectable()
export class PaymentGetDataService {
    constructor(
        @InjectConnection(BILLING_CONNECTION)
        private connection: Connection,
    ) {}
    async getHsmCount(workspaceId: string, startDate: moment.Moment, endDate: moment.Moment): Promise<number> {
        if (process.env.NODE_ENV === 'local') return 2;
        const result = await this.connection.query(`
            SELECT
                w.id,
                w.name,
                sum(agg.count)
            FROM analytics.activity_aggregate agg
            INNER JOIN analytics.conversation c ON c.id = agg.conversation_id
            INNER JOIN billing.workspace w ON w.id = agg.workspace_id
            WHERE agg.workspace_id = '${workspaceId}'
                AND agg.timestamp >= '${startDate.format('YYYY-MM-DD HH:mm:ss')}'::timestamp
                AND agg.timestamp <= '${endDate.format('YYYY-MM-DD HH:mm:ss')}'::timestamp
                AND (agg.type IN ('rating_message', 'message', 'member_upload_attachment') OR (agg.type = 'event' AND agg.name = 'start'))
                AND c.created_by_channel <> 'webemulator'
                AND agg.is_hsm = 1
            GROUP BY w.id, w.name;
        `);

        return parseInt(result[0]?.sum);
    }

    async getMsgCount(workspaceId: string, startDate: moment.Moment, endDate: moment.Moment): Promise<number> {
        if (process.env.NODE_ENV === 'local') return 10;
        const result = await this.connection.query(`
            SELECT
                w.id,
                w.name,
                sum(agg.count)
            FROM analytics.activity_aggregate agg
            INNER JOIN analytics.conversation c ON c.id = agg.conversation_id
            INNER JOIN billing.workspace w ON w.id = agg.workspace_id
            WHERE agg.timestamp >= '${startDate.format('YYYY-MM-DD HH:mm:ss')}'::timestamp
            AND agg.timestamp <= '${endDate.format('YYYY-MM-DD HH:mm:ss')}'::timestamp
            AND (agg.type IN ('rating_message', 'message', 'member_upload_attachment') OR (agg.type = 'event' AND agg.name = 'start'))
            AND c.created_by_channel <> 'webemulator'
            AND agg.is_hsm <> 1
            AND agg.workspace_id = '${workspaceId}'
            GROUP BY w.id, w.name
            LIMIT 1;
        `);

        return parseInt(result[0]?.sum);
    }

    async getConversationCount(workspaceId: string, startDate: moment.Moment, endDate: moment.Moment): Promise<number> {
        if (process.env.NODE_ENV === 'local') return 10;
        const result = await this.connection.query(`
            SELECT
                COUNT(cc.id) 
            FROM analytics.conversation_view AS cc
            WHERE
            cc.created_by_channel <> 'webemulator'
            and cc.created_at >= ${moment(startDate.format('YYYY-MM-DDTHH:mm:ss')).valueOf()}
            AND cc.created_at <= ${moment(endDate.format('YYYY-MM-DDTHH:mm:ss')).valueOf()}
            AND cc.workspace_id = '${workspaceId}'
            AND cc.invalid_number = false;
        `);

        return parseInt(result[0]?.count);
    }
}
