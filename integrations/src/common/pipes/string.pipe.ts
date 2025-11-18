import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { HTTP_ERROR_THROWER } from '../exceptions.service';

@Injectable()
export class StringPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      throw HTTP_ERROR_THROWER(406, {
        [metadata.data]: 'Value required',
      });
    }

    return value;
  }
}
