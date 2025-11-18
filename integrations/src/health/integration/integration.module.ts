import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '../../core/cache/cache.module';
import { IntegrationController } from './integration.controller';
import { Integration, IntegrationSchema } from './schema/integration.schema';
import { IntegrationService } from './integration.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Integration.name, schema: IntegrationSchema }]), CacheModule],
  controllers: [IntegrationController],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
