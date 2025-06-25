import { Module, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from '../auth/middleware/auth.middleware';
import { FlowPublicationHistoryService } from './flow-publication-history.service';
import { FlowPublicationHistorySchema } from './schema/health-publication-flow-history.schema';

@Module({
    controllers: [],
    imports: [MongooseModule.forFeature([{ name: 'FlowPublicationHistory', schema: FlowPublicationHistorySchema }])],
    providers: [FlowPublicationHistoryService],
    exports: [FlowPublicationHistoryService],
})
export class FlowPublicationHistoryModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(AuthMiddleware).forRoutes();
    }
}
