import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsOptional, IsString } from 'class-validator';

export class SendAuthorizationInsuranceDataDto {
  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'unimed' })
  type: string;

  @IsDefined()
  @ApiProperty({
    example: {
      cardNumber: '123456789',
      patientName: 'João Silva',
      doctorName: 'Dr. Maria Santos',
      procedureCode: '12345',
      serviceDate: '2025-12-02',
    },
  })
  data: any;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'success', required: false })
  status?: string;
}
