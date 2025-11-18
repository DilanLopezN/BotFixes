import { Module } from '@nestjs/common';
import { TokenManagementService } from './token-management.service';
import { TokenManagementController } from './token-management.controller';
import { IntegrationModule } from '../integration/integration.module';
import { CredentialsModule } from '../credentials/credentials.module';

@Module({
  imports: [IntegrationModule, CredentialsModule],
  providers: [TokenManagementService],
  controllers: [TokenManagementController],
  exports: [TokenManagementService],
})
export class TokenManagementModule {}
