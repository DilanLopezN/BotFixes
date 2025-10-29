import { Injectable } from '@nestjs/common';
import { ExternalDataService } from './external-data.service';

@Injectable()
export class QueryExecutorService {
    constructor(private readonly externalDataService: ExternalDataService) {}

    async executeQuery(integrationId: string, sql: string): Promise<any> {
        return await this.externalDataService.doSql(integrationId, sql);
    }

    async getDoctorStatus(integratonId: string, doctorCode: string, insuranceCode: string, age: number): Promise<any> {
        const sql = `SELECT * FROM TABLE(PKG_BOT.get_debug_medico(${doctorCode}, ${insuranceCode}, ${age}))`;

        return await this.executeQuery(integratonId, sql);
    }
}
