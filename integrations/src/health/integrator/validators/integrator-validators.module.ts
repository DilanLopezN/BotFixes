import { Module } from '@nestjs/common';
import { IntegratorValidatorsService } from './integrator-validators.service';

@Module({
  providers: [IntegratorValidatorsService],
  exports: [IntegratorValidatorsService],
})
export class IntegratorValidatorsModule {}
