import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { HTTP_ERROR_THROWER } from '../../common/exceptions.service';
import { Types } from 'mongoose';

@Injectable()
export class ObjectIdPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!Types.ObjectId.isValid(value)) {
      throw HTTP_ERROR_THROWER(406, {
        [metadata.data]: 'ObjectId required',
      });
    }

    return value;
  }
}
