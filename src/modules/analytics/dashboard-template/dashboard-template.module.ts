import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from './../../auth/middleware/auth.middleware';
import { DashboardTemplateController } from './controllers/dashboard-template.controller';
import { TemplateGroupController } from './controllers/template-group.controller';
import { ConversationTemplateSchema } from './schemas/conversation-template.schema';
import { TemplateGroupSchema } from './schemas/template-group.schema';
import { ConversationTemplateService } from './services/conversation-template.service';
import { TemplateGroupService } from './services/template-group.service';
import { AgentStatusMiddleware } from '../../agent-status/middleware/agent-status.middleware';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'ConversationTemplate', schema: ConversationTemplateSchema },
            { name: 'TemplateGroup', schema: TemplateGroupSchema },
        ]),
    ],
    providers: [ConversationTemplateService, TemplateGroupService],
    exports: [ConversationTemplateService, TemplateGroupService],
    controllers: [DashboardTemplateController, TemplateGroupController],
})
export class DashboardTemplateModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(AuthMiddleware, AgentStatusMiddleware)
            .forRoutes(DashboardTemplateController, TemplateGroupController);
    }
}
