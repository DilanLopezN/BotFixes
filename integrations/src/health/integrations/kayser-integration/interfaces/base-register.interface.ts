import { HttpStatusCode } from 'axios';

export interface KayserStatusResponse {
  code: HttpStatusCode;
  success: boolean;
  data: {
    echo: string;
  };
  message: string;
}
