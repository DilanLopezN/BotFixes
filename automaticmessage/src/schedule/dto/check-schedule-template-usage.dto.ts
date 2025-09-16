import { ApiProperty } from "@nestjs/swagger";

export class CheckScheduleTemplateUsageDto {
  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;
  @ApiProperty({ description: 'Template ID' })
  templateId: string;
}