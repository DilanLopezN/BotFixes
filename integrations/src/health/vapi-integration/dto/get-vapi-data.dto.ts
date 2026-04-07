import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { VapiIntegrationData } from '../interfaces/vapi-integration-data.interface';

export class GetVapiDataQueryDto {
  @IsString()
  @ApiProperty({ required: true, description: 'Call ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  callId: string;
}

export class GetVapiDataOutputDto {
  @ApiProperty({
    nullable: true,
    description: 'Dados salvos no Redis para a chave vapi-integration:integrationId:callId. Null se não existir.',
    example: {
      insuranceCode: '8',
      procedureCode: 'c12272:s101:stE:a:lN',
      specialityCode: 'c101:stE',
      appointmentTypeCode: 'E',
      phoneNumber: '32999876075',
      apiToken: 'db178bfa-5937-4c23-992b-766a98031921',
    },
  })
  data: VapiIntegrationData | null;
}
