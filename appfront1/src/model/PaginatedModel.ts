export interface PaginatedModel<Model> {
    count: number;
    currentPage: number;
    nextPage: number;
    data: Array<Model>;
}