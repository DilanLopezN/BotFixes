import { Request } from 'express';

export class ReportsRequest extends Request {
    workspaceId?: string;
    permissions?: string[];
}
