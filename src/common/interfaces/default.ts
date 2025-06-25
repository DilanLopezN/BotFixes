import { ApiPropertyOptional } from '@nestjs/swagger';

export interface DefaultResponse<T> {
    data: T;
    metadata?: {
        count: number;
        skip: number;
        limit: number;
    };
}

export class DefaultRequest<T = unknown> {
    params?: Record<string, unknown>;

    @ApiPropertyOptional({
        description: 'Main data payload for the request',
        type: Object,
    })
    data?: T;

    @ApiPropertyOptional({
        description: 'Number of items to skip for pagination',
        type: Number,
        example: 0,
    })
    skip?: number;

    @ApiPropertyOptional({
        description: 'Maximum number of items to return',
        type: Number,
        example: 10,
    })
    limit?: number;
}
