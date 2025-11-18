import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { FlowTriggerType } from '../../flow/interfaces/flow.interface';

export class MatchFlowsConfirmationDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  scheduleCode: string;

  @IsNumber()
  @IsOptional()
  @ApiProperty()
  scheduleId?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ApiPropertyOptional({ type: [Number], description: 'Optional array of schedule IDs' })
  scheduleIds?: number[];

  @IsOptional()
  @IsEnum(FlowTriggerType)
  @ApiProperty({ enum: FlowTriggerType })
  trigger?: FlowTriggerType;
}
