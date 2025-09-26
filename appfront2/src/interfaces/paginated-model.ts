export interface PaginatedModel<T> {
  count: number;
  currentPage: number;
  nextPage: number;
  data: Array<T>;
}
