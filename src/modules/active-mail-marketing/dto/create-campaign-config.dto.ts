import { IsString, IsDateString, IsOptional, IsBoolean, IsNumber, Min, Max, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCampaignConfigDto {
    @ApiProperty({
        description: 'The name of the campaign',
        example: 'My Campaign',
        maxLength: 120,
    })
    @IsString()
    @Max(120)
    name: string;

    @IsString()
    workspaceId: string;

    @ApiProperty({
        description: 'The start date and time of the campaign',
        example: '2025-01-01T00:00:00Z',
    })
    @IsDateString()
    startAt: string;

    @ApiProperty({
        description: 'The end date and time of the campaign',
        example: '2025-01-02T00:00:00Z',
    })
    @IsDateString()
    @ValidateIf((o) => o.startAt)
    endAt: string;

    @ApiProperty({
        description: 'The API token for the campaign',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    apiToken: string;

    @ApiProperty({
        description: 'The message to be sent with the link',
        example: 'Text_example',
        maxLength: 500,
    })
    @IsString()
    @Max(500)
    linkMessage: string;

    @ApiProperty({
        description: 'The time to live for the link',
        example: 10080,
        minimum: 1,
        maximum: 10080,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10080)
    linkTtlMinutes?: number;

    @ApiProperty({
        description: 'The ID of the email template',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsString()
    emailTemplateId: string;

    @ApiProperty({
        description: 'The WhatsApp number of the clinic',
        example: '5511999999999',
    })
    @IsString()
    clinicWhatsapp: string;

    @ApiProperty({
        description: 'The title shown in the email sender field',
        example: 'Atend Clinic',
    })
    @IsString()
    fromTitle: string;

    @ApiProperty({
        description: 'Whether the campaign is active',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
