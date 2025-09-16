import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { CancelReason } from '../models/cancel-reason.entity';

export class CancelReasonDto implements Omit<CancelReason, 'id' | 'createdAt'> {
  @IsString()
  @ApiProperty({ description: 'Reason name' })
  reasonName: string;

  @IsString()
  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;
}

export class CreateCancelReasonDto
  implements Omit<CancelReason, 'id' | 'createdAt'>
{
  @IsString()
  @ApiProperty({ description: 'Reason name' })
  reasonName: string;

  @IsString()
  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;
}

export class UpdateCancelReasonDto implements Omit<CancelReason, 'createdAt'> {
  @IsString()
  @ApiProperty({ description: 'Reason name' })
  reasonName: string;

  @IsNumber()
  @ApiProperty({ description: 'Reason ID' })
  id: number;
  
  @IsString()
  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;
}

export class ListWorkspaceDto {
  @IsString()
  @ApiProperty({ description: 'Workspace ID' })
  workspaceId: string;
}

export class GetCancelReasonDto {
  @IsNumber()
  @ApiProperty({ description: 'Reason ID' })
  reasonId: number;
}
