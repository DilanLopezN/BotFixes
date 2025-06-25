import { PipeTransform, Injectable } from '@nestjs/common';

@Injectable()
export class NumberPipe implements PipeTransform {
  transform(value: any) {
    return Number(value)
  }
}
