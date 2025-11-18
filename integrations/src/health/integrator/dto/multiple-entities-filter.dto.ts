import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEnum } from 'class-validator';
import { CorrelationFilterByKey } from '../../interfaces/correlation-filter.interface';
import { EntityVersionType } from '../../interfaces/entity.interface';

export class MultipleEntitiesFilterDto {
  @IsEnum(EntityVersionType)
  @ApiProperty({ enum: EntityVersionType })
  version: EntityVersionType;

  @IsDefined()
  @ApiProperty()
  filter: CorrelationFilterByKey;
}
