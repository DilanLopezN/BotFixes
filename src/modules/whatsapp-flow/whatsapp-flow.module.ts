import { forwardRef, MiddlewareConsumer, Module } from '@nestjs/common';
import { FlowWhatsappController } from './controllers/flow-whatsapp.controller';
import { FlowDataController } from './controllers/flow-data.controller';
import { WhatsappFlowLibraryController } from './controllers/whatsapp-flow-library.controller';
import { FlowCategoryController } from './controllers/flow-category.controller';
import { FlowCategoryService } from './services/flow-category.service';
import { FlowService } from './services/flow.service';
import { FlowDataService } from './services/flow-data.service';
import { WhatsappFlowLibraryService } from './services/whatsapp-flow-library.service';
import { ExternalDataService } from './services/external-data.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WHATSAPP_FLOW_CONNECTION } from './ormconfig';
import { synchronizePostgres } from '../../common/utils/sync';
import { FlowData } from './models/flow-data.entity';
import { Flow } from './models/flow.entity';
import { WhatsappFlowLibrary } from './models/whatsapp-flow-library.entity';
import { FlowCategory } from './models/flow-category.entity';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';

@Module({
    controllers: [FlowWhatsappController, FlowDataController, WhatsappFlowLibraryController, FlowCategoryController],
    providers: [FlowCategoryService, FlowService, FlowDataService, WhatsappFlowLibraryService, ExternalDataService],
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            name: WHATSAPP_FLOW_CONNECTION,
            url: process.env.POSTGRESQL_URI,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: synchronizePostgres,
            migrationsRun: false,
            migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
            schema: 'whatsapp_flow',
        }),
        TypeOrmModule.forFeature([FlowCategory, WhatsappFlowLibrary, Flow, FlowData], WHATSAPP_FLOW_CONNECTION),
    ],
    exports: [],
})
export class WhatsappFlowModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware)
            .forRoutes(
                FlowWhatsappController,
                FlowDataController,
                WhatsappFlowLibraryController,
                FlowCategoryController,
            );
    }
}
