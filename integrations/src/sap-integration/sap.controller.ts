import { Body, Controller, Get, Post, Query, ValidationPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SapService } from './services/sap.service';
import { OkResponse } from 'common/interfaces/ok-response.interface';
import { GetStatusResponse, MessageStatus } from './sap.interface';

@Controller({
  path: 'contracts/integration/sap',
})
export class SapController {
  constructor(private readonly sapService: SapService) {}

  @ApiTags('AWSFiles')
  @Get('getAwsFiles')
  async getAwsFiles(): Promise<OkResponse> {
    return this.sapService.getAwsFiles();
  }

  @ApiTags('Status')
  @Get('getStatus')
  async getStatus(
    @Query('requisitionNumber') requisitionNumber: string,
    @Query('userPhoneNumber') userPhoneNumber: string,
  ): Promise<GetStatusResponse> {
    return this.sapService.getStatus(requisitionNumber, userPhoneNumber);
  }

  @ApiTags('Notification')
  @Post('addUserToNotify')
  async addUserToNotify(
    @Body(new ValidationPipe()) data: { contractNumber: string; userPhoneNumber: string },
  ): Promise<MessageStatus> {
    return this.sapService.addUserToNotify(data);
  }

  @ApiTags('Notification')
  @Post('removeUserToNotify')
  async removeUserToNotify(
    @Body(new ValidationPipe()) data: { contractNumber: string; userPhoneNumber: string },
  ): Promise<MessageStatus> {
    return this.sapService.removeUserToNotify(data);
  }
}
