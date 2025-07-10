import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ReportsAuthMiddleware } from './middlewares/reports-auth.middleware';
import { ReportsControler } from './controllers/reports.controller';
import { ReportsService } from './services/reports.service';
import { ExternalDataService } from './services/external-data.service';
import { CsvExportService } from './services/csv-export.service';
import { CsvExportCronService } from './services/csv-export-cron.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { REPORTS_CONNECTION_NAME } from './connName';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: REPORTS_CONNECTION_NAME,
            url: process.env.POSTGRESQL_READ_URI + '?uuidExtension=pgcrypto',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
        }),
    ],
    controllers: [ReportsControler],
    providers: [ReportsService, ExternalDataService, CsvExportService, CsvExportCronService],
})
export class ReportsModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(ReportsAuthMiddleware).forRoutes(ReportsControler);
    }
}
