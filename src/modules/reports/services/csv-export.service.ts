import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { S3 } from 'aws-sdk';
import { REPORTS_CONNECTION_NAME } from '../connName';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';
import * as moment from 'moment';

@Injectable()
export class CsvExportService {
    private readonly logger = new Logger(CsvExportService.name);
    private readonly s3: S3;

    constructor(
        @InjectConnection(REPORTS_CONNECTION_NAME)
        private readonly connection: Connection,
    ) {
        this.s3 = new S3({
            region: process.env.AWS_WORKSPACE_REGION_NAME,
        });
    }

    async executeQueryAndGenerateCsv(workspaceId: string): Promise<void> {
        try {
            // Gerar nome do arquivo com workspaceId + data
            const dateString = moment().format('YYYY-MM-DD');
            const fileName = `${workspaceId}/${dateString}.csv`;
            const s3Key = `reports/${fileName}`;

            // Verificar se o arquivo já existe no S3
            const fileExists = await this.checkIfFileExistsInS3(s3Key);
            if (fileExists) {
                this.logger.log(`File already exists in S3: ${s3Key}. Skipping execution.`);
                return;
            }

            // Execute raw query - deixando vazia conforme solicitado
            const queryResult = await this.connection.query(`
SELECT
    a.id AS id_interacao_total,
    a.date_agg AS dt_hr_entrada,
    to_timestamp(a.metrics_assignment_at / 1000) AS dt_hr_inicio_atendimento,
    to_timestamp(a.metrics_close_at / 1000) AS dt_hr_finalizacao_atendimento,
    mem_user.member_id AS ddd_nr_contato,
    a.assigned_to_team_id AS time,
    a.tags AS etiquetas,
    CASE
        WHEN a.created_by_channel = 'whatsapp-gupshup' THEN 'whatsapp'
        ELSE a.created_by_channel
    END AS canal,
    mem_close.name AS finalizador_por,
    mem_agent.name AS usuario_atendimento,
    a.metrics_time_to_agent_reply AS tme_1_resposta,
    a.metrics_median_time_to_user_reply AS tempo_medio_resposta_paciente,
    a.metrics_time_to_close AS tma,
    a.state AS status_final
FROM
    analytics.conversation_view as a
    left join analytics.member as mem_user on mem_user.conversation_id = a.id
    and mem_user.type = 'user'
    left join analytics.member as mem_agent on mem_agent.conversation_id = a.id
    and mem_agent.type = 'agent'
    left join analytics.member as mem_close on mem_close.conversation_id = a.id
    and mem_close.member_id = a.closed_by
WHERE
    a.workspace_id = '${workspaceId}'
    AND a.date_agg >= date_trunc('day', now() - interval '1 day')
    AND a.date_agg < date_trunc('day', now())
                `);

            if (!queryResult || queryResult.length === 0) {
                this.logger.log(`No data found for workspace ${workspaceId}`);
                return;
            }
            this.logger.log(`Found ${queryResult.length} to generate CSV`);

            // Gerar CSV em memória
            const csvContent = this.generateCsvFromQueryResult(queryResult);

            this.logger.log(`CSV Generated with ${queryResult.length} results`);

            // Upload para S3
            await this.uploadCsvToS3(csvContent, fileName);

            this.logger.log(`CSV exported successfully for workspace ${workspaceId}: ${fileName}`);
        } catch (error) {
            this.logger.error(`Error exporting CSV for workspace ${workspaceId}:`, error);
            throw error;
        }
    }

    private generateCsvFromQueryResult(queryResult: any[]): string {
        if (!queryResult || queryResult.length === 0) {
            return '';
        }

        // Obter headers dinamicamente a partir do primeiro registro
        const headers = Object.keys(queryResult[0]);

        // Criar linha de cabeçalho
        const headerRow = headers.map((header) => this.escapeCsvValue(header)).join(',');

        // Criar linhas de dados
        const dataRows = queryResult.map((row) => headers.map((header) => this.escapeCsvValue(row[header])).join(','));

        // Combinar cabeçalho e dados
        return [headerRow, ...dataRows].join('\n');
    }

    private escapeCsvValue(value: any): string {
        if (value === null || value === undefined) {
            return '';
        }

        const stringValue = String(value);

        // Se contém vírgula, quebra de linha ou aspas, deve ser escapado
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
    }

    private async uploadCsvToS3(csvContent: string, fileName: string): Promise<void> {
        const buffer = Buffer.from(csvContent, 'utf-8');

        const params: S3.Types.PutObjectRequest = {
            Bucket: process.env.AWS_REPORT_BUCKET_NAME,
            Key: `reports/${fileName}`,
            Body: buffer,
            ContentType: 'text/csv',
            ACL: 'private',
        };

        await this.s3.upload(params).promise();
    }

    private async checkIfFileExistsInS3(key: string): Promise<boolean> {
        try {
            const params: S3.Types.HeadObjectRequest = {
                Bucket: process.env.AWS_REPORT_BUCKET_NAME,
                Key: key,
            };

            await this.s3.headObject(params).promise();
            return true;
        } catch (error) {
            if (error.statusCode === 404) {
                return false;
            }
            throw error;
        }
    }
}
