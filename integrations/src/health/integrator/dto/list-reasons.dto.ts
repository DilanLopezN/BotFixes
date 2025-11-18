import { IsDefined, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EntityVersionType } from '../../interfaces/entity.interface';
import { CorrelationFilter } from '../../interfaces/correlation-filter.interface';
import { FlowSteps } from '../../flow/interfaces/flow.interface';

export class ListReasonsDto {
  @IsEnum(EntityVersionType)
  @ApiProperty({ enum: EntityVersionType })
  version: EntityVersionType;

  @IsEnum(FlowSteps)
  @ApiProperty({ enum: FlowSteps })
  targetEntity: FlowSteps;

  @IsDefined()
  @ApiProperty()
  filter: CorrelationFilter;
}
