export interface v2ResponseModel<T> {
  data: T;
  metadata?: {
    count: number;
    skip: number;
    limit: number;
  };
}
