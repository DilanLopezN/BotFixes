import { AuthApiTokenService } from './auth-api-token.service';
import { AuthApiTokenDto } from './dto/authApiToken.dto';
import { AuthApiGuard } from './../auth/guard/auth-api.guard';
import { Controller, Post, UseGuards, Body, ValidationPipe } from '@nestjs/common';
import { ApiHeader, ApiTags, ApiResponse } from '@nestjs/swagger';
import { UserDto } from '../users/dtos/user.dto';

@Controller('auth-api-token')
@ApiTags('AuthApiToken')
export class AuthApiTokenController {
    constructor(
        private authApiTokenService: AuthApiTokenService,
    ) { }

    @Post()
    @ApiHeader({ description: 'api token', required: true, name: 'authorization' })
    @ApiResponse({ isArray: false, status: 200, type: UserDto })
    @UseGuards(AuthApiGuard)
    async login(
        @Body(new ValidationPipe({ transform: true })) authApiTokenDto: AuthApiTokenDto,
    ) {
        return await this.authApiTokenService.auth(authApiTokenDto);
    }
}
