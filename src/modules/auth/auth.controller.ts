import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dtos/loginDto.dto';

@ApiTags('Users')
@Controller('users')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('auth')
    async login(@Body() loginDto: LoginDto) {
        return await this.authService.doLogin(loginDto);
    }
}
