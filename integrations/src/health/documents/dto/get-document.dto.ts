import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetDocumentDto {
  @ApiProperty({
    description: 'The unique ID of the document',
    required: true,
  })
  @IsUUID()
  @IsString()
  documentId: string;
}
