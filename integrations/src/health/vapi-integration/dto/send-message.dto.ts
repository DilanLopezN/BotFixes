import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SendMessageInputDto {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    description:
      'When true, calls ApiService.sendMessage (botdesigner /v1/messages/sendMessage) with the same payload instead of only enqueueing.',
    example: false,
  })
  debug?: boolean;

  @IsString()
  @ApiProperty({
    required: true,
    description:
      'Call ID da conversa VAPI. Quando informado, os dados salvos no Redis (saveVapiData) são carregados e usados como atributos da mensagem (paciente, convênio, plano, médico, organização).',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  callId: string;

  @IsString()
  @ApiProperty({ required: true, description: 'API token', example: 'd24debe5-5fc3-4adb-bc20-7a985e32e84f' })
  apiToken: string;

  @IsString()
  @ApiProperty({ required: true, description: 'Phone number', example: '48991916725' })
  phoneNumber: string;
}

export class SendMessageOutputDto {
  @ApiProperty({ example: true })
  ok: boolean;

  @ApiProperty({ example: 'Message enqueued successfully' })
  message: string;
}
