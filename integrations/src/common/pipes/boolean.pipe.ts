import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class BooleandPipe implements PipeTransform {
  transform(value: any) {
    return value === 'true';
  }
}
