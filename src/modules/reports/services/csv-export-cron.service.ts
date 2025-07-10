import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CsvExportService } from './csv-export.service';
import { shouldRunCron } from '../../../common/utils/bootstrapOptions';

@Injectable()
export class CsvExportCronService {
    private readonly logger = new Logger(CsvExportCronService.name);
    constructor(private readonly csvExportService: CsvExportService) {}

    @Cron(CronExpression.EVERY_DAY_AT_3AM)
    async handleDailyCsvExport() {
        if (!shouldRunCron()) return;

        try {
            this.logger.log('Starting daily CSV export at 03:00');

            // Aqui você pode definir os workspaceIds que devem ser processados
            // Por exemplo, buscar de uma tabela ou usar um array fixo
            const workspaceIds = await this.getWorkspaceIds();

            for (const workspaceId of workspaceIds) {
                await this.csvExportService.executeQueryAndGenerateCsv(workspaceId);
            }

            this.logger.log('Daily CSV export completed successfully');
        } catch (error) {
            this.logger.error('Error during daily CSV export:', error);
        }
    }

    private async getWorkspaceIds(): Promise<string[]> {
        // Implementar lógica para obter os workspaceIds
        // Por exemplo, consultar uma tabela de workspaces ativos
        // Por enquanto, retornando array vazio
        return ['646520af9152b57396c87705'];
    }
}
