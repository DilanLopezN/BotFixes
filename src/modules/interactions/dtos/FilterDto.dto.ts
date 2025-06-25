import { ApiProperty } from '@nestjs/swagger';
import { FilterType, FilterOperator } from '../interfaces/filter.interface';
import { OperatorType } from '../interfaces/interaction.interface';

export class ConditionDto {
  @ApiProperty({ enum: FilterType })
  readonly type: FilterType;

  @ApiProperty()
  readonly name: string;

  @ApiProperty({ enum: OperatorType })
  readonly operator: OperatorType;

  @ApiProperty()
  readonly value: string;
}

export class FilterDto {
  @ApiProperty({enum: [FilterOperator.and, FilterOperator.or]})
  readonly operator: FilterOperator;
    @ApiProperty({
        isArray: true,
        type: ConditionDto
    })
    readonly conditions: Array<ConditionDto>
}