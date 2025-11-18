import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntegrationModule } from '../integration/integration.module';
import { FlowController } from './flow.controller';
import { FlowDraft, FlowDraftSchema } from './schema/flow-draft.schema';
import { Flow, FlowSchema } from './schema/flow.schema';
import { FlowTransformerService } from './service/flow-transformer.service';
import { FlowService } from './service/flow.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Flow.name, schema: FlowSchema },
      { name: FlowDraft.name, schema: FlowDraftSchema },
    ]),
    IntegrationModule,
  ],
  controllers: [FlowController],
  providers: [FlowService, FlowTransformerService],
  exports: [FlowService],
})
export class FlowModule {}
