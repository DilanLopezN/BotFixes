import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUsageLoggerRepository } from './ai-usage-logger.entity';
import { AiUsageLoggerService } from './ai-usage-logger.service';
import { CONTEXT_AI } from '../ormconfig';
import { EventsModule } from '../../../modules/events/events.module';

@Module({
    imports: [TypeOrmModule.forFeature([AiUsageLoggerRepository], CONTEXT_AI), EventsModule],
    providers: [AiUsageLoggerService],
})
export class AiUsageLoggerModule {}
