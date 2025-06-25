import { SourceTypeEnum } from '../models/referral.entity';

export interface Referral {
    id: number;
    conversationId: string;
    workspaceId: string;
    sourceId: string;
    sourceType: SourceTypeEnum;
    sourceUrl: string;
    headline?: string;
    body?: string;
    imageId?: string;
    videoId?: string;
}

export interface CreateReferral extends Omit<Referral, 'id'> {}
