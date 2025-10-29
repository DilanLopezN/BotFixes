export interface NewResponseModel<T> {
  data: T;
  metadata?: {
    count?: number;
    skip?: number;
    limit?: number;
  };
}
