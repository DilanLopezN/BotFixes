import { Module } from '@nestjs/common';
import { EntitiesModule } from '../../entities/entities.module';
import { CustomImportService } from './custom-import.service';
import { FlowModule } from '../../flow/flow.module';

@Module({
  imports: [EntitiesModule, FlowModule],
  providers: [CustomImportService],
})
export class CustomImportModule {}
