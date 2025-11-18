import { Module } from '@nestjs/common';
import { AmilApiService } from './services/amil-api.service';
import { ExternalInsurancesService } from './services/external-insurances.service';

@Module({
  imports: [],
  providers: [ExternalInsurancesService, AmilApiService],
  exports: [ExternalInsurancesService],
})
export class ExternalInsurancesModule {}
