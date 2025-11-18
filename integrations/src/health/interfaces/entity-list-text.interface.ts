import { EntityDocument } from '../entities/schema';

export interface EntityListByText {
  isValid: boolean;
  data: EntityDocument[];
}
