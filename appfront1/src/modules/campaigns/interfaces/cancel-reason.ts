export interface CancelReasonDto {
    id: number;
    reasonName: string;
    workspaceId: string;
    createdAt: Date;
}

export interface CreateCancelReasonDto extends Omit<CancelReasonDto, 'id' | 'createdAt' | 'workspaceId'> {
    reasonName: string;
}

export interface UpdateCancelReasonDto extends CreateCancelReasonDto {}
