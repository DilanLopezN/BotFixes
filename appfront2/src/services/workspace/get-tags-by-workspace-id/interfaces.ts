import type { Tag } from '~/interfaces/tag';

export interface GetTagsByWorkspaceIdResponse {
  count: number;
  currentPage: number;
  nextPage: number;
  data: Tag[];
}
