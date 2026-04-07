import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CancelFutureScheduleDto {
  @IsString()
  @ApiProperty({
    description: 'Código do agendamento a ser cancelado',
    example: '321926863',
  })
  scheduleCode: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Parâmetros específicos do ERP',
    required: false,
    example: {
      DATABASE_PACKAGE: 'PKG_BOT',
      SCHEDULE: {
        patientCode: '3026500',
        appointmentTypeCode: 'C',
      },
    },
  })
  erpParams?: any;
}
