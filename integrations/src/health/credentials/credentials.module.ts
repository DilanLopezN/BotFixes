import { Module } from '@nestjs/common';
import { CacheService } from '../../core/cache/cache.service';
import { CredentialsHelper } from './credentials.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      baseURL: 'https://integrations.botdesigner.io',
    }),
  ],
  providers: [CredentialsHelper, CacheService],
  exports: [CredentialsHelper],
})
export class CredentialsModule {}
