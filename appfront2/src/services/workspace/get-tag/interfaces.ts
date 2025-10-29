import { Tag } from '~/interfaces/tag';

export interface ListTagsResponse {
  data: Tag[];
  total: number;
}
