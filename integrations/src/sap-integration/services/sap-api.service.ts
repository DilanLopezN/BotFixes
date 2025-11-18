import { HttpService } from '@nestjs/axios';
import { HttpStatus, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HTTP_ERROR_THROWER, HttpErrorOrigin } from 'common/exceptions.service';
import { AwsFilesResponse } from '../sap.interface';

@Injectable()
export class SapApiService {
  constructor(private readonly httpService: HttpService) {}

  public async getUrlFilesFromAws(ignoreException?: boolean): Promise<AwsFilesResponse> {
    try {
      const request = await lastValueFrom(
        this.httpService.get<AwsFilesResponse>(
          'https://rux9uy1evl.execute-api.us-east-2.amazonaws.com/prod/chatbot/tabelas',
          {
            headers: {
              client_id: '0930483d9a3c41f5b0711a42a6f6557a',
              client_secret: 'C765090F9e0843Be995F09619d261c70',
            },
          },
        ),
      );

      return request?.data ?? null;
    } catch (error) {
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }

  async get(url: string): Promise<any> {
    try {
      const request = await lastValueFrom(this.httpService.get<AwsFilesResponse>(url));

      return request?.data ?? null;
    } catch (error) {
      throw HTTP_ERROR_THROWER(
        error?.response?.status || HttpStatus.BAD_REQUEST,
        error?.response?.data || error,
        HttpErrorOrigin.INTEGRATION_ERROR,
      );
    }
  }
}
