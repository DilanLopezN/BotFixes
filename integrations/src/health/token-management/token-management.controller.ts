import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '../../common/guards/auth.guard';
import { ApiTags } from '@nestjs/swagger';
import { ObjectIdPipe } from '../../common/pipes/objectId.pipe';
import { TokenManagementService } from './token-management.service';
import { GenerateAccessTokenResponse } from './interfaces/generate-access-token.interface';
import { GetAccesTokenDataDto } from './dto/get-access-token-data.dto';

@Controller({
  path: 'integration/:integrationId/token-management',
})
export class TokenManagementController {
  constructor(private readonly tokenManagementService: TokenManagementService) {}

  @HttpCode(HttpStatus.OK)
  @ApiTags('Token Management')
  @UseGuards(AuthGuard)
  @Post('generateAccessToken')
  async recoverAccessProtocol(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
  ): Promise<GenerateAccessTokenResponse> {
    return this.tokenManagementService.generateAccessToken(integrationId);
  }

  @HttpCode(HttpStatus.OK)
  @ApiTags('Token Management')
  @Post('getAccessTokenData')
  async getAccessTokenData(
    @Param('integrationId', ObjectIdPipe) integrationId: string,
    @Body(new ValidationPipe()) dto: GetAccesTokenDataDto,
  ): Promise<Record<string, string>> {
    return this.tokenManagementService.getAccessTokenData(integrationId, dto.token);
  }
}
