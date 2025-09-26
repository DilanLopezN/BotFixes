import { BaseModel } from './base-model';

export interface Bot extends BaseModel {
  cloning?: boolean;
  name: string;
  workspaceId: string;
  publishedAt?: string;
  publishDisabled?: {
    disabled: boolean;
    disabledAt: number;
    user?: {
      id: string;
      name: string;
    };
  };
}
