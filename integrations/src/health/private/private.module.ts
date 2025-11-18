import { Module } from '@nestjs/common';
import { IntegrationPrivateController } from './controllers/integration-private.controller';
import { IntegrationPrivateService } from './services/integration-private.service';
import { ExternalDataService } from './services/external-data.service';
import { CredentialsModule } from '../credentials/credentials.module';

@Module({
  providers: [IntegrationPrivateService, ExternalDataService],
  controllers: [IntegrationPrivateController],
  imports: [CredentialsModule],
  exports: [],
})
export class PrivateModule {}
