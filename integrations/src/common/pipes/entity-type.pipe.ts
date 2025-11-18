import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { HTTP_ERROR_THROWER } from '../exceptions.service';
import { EntityType } from '../../health/interfaces/entity.interface';

@Injectable()
export class EntityTypePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!EntityType[value]) {
      throw HTTP_ERROR_THROWER(406, {
        [metadata.data]: 'EntityType invalid',
      });
    }

    return value;
  }
}
