export interface ApiError {
    statusCode: number;
    message: string[];
    error: string;
    code?: any;
}
export type ApiErrorCallback = (error: ApiError) => void;
