import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListScheduleCancelReasonParams {
  @ApiPropertyOptional({
    description: 'Nome do motivo de cancelamento',
    type: String,
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Id do workspace obrigatório',
    type: String,
  })
  workspaceId: string;
}

export class FindCancelReasonByIdListParams {
  @ApiPropertyOptional({
    description: 'Lista de ids do motivo de cancelamento',
    type: Number,
  })
  ids?: number[];

  @ApiPropertyOptional({
    description: 'Id do workspace obrigatório',
    type: String,
  })
  workspaceId: string;
}
