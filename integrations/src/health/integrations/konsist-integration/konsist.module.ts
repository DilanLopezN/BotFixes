import { Module } from '@nestjs/common';
import { KonsistApiService } from './services/konsist-api.service';

@Module({
  providers: [KonsistApiService],
})
export class KonsistModule {}
