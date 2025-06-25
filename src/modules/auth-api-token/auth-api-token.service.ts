import { AuthApiTokenDto } from './dto/authApiToken.dto';
import { AuthService } from './../auth/auth.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthApiTokenService {
    constructor(
        private readonly authService: AuthService,
    ) { }

    public async auth(authApiTokenApiDto: AuthApiTokenDto) {
        return await this.authService.doLoginApiToken(authApiTokenApiDto);
    }
}