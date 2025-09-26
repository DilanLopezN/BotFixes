export interface NewRequestModel<T> {
    data: T;
    skip?: number;
    limit?: number;
}
