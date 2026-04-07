import { HttpStatus, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { HTTP_ERROR_THROWER } from '../../../common/exceptions.service';
import { ExternalInsurances } from '../interfaces/external-insurances';
import { IInsuranceImplementorService } from '../interfaces/insurance-service.interface';
import { AmilApiService } from './amil-api.service';

@Injectable()
export class ExternalInsurancesService {
  constructor(private moduleRef: ModuleRef) {}

  private async getService(insurance: ExternalInsurances): Promise<{ service: IInsuranceImplementorService }> {
    if (!ExternalInsurances[insurance]) {
      throw HTTP_ERROR_THROWER(
        HttpStatus.NOT_IMPLEMENTED,
        'ExternalInsurancesService.getService: Not implemented',
        undefined,
        true,
      );
    }

    switch (insurance) {
      case ExternalInsurances.amil:
        return {
          service: this.moduleRef.get<AmilApiService>(AmilApiService, { strict: false }),
        };

      default:
        throw HTTP_ERROR_THROWER(HttpStatus.BAD_REQUEST, 'Invalid insurance');
    }
  }

  async getData(cpf: string, insurance: ExternalInsurances) {
    const { service } = await this.getService(insurance);
    return await service?.getData(cpf);
  }
}
