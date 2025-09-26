import { AxiosError } from 'axios';

export type ApiError = AxiosError<{
  statusCode: number;
  message: string;
  error: string;
}>;
