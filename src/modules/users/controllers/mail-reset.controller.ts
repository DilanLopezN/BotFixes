import { Controller, Body, Put, Get, UseGuards, ValidationPipe, Query, Post, Res } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { RolesGuard } from '../guards/roles.guard';
import { VerifyEmailDto } from '../dtos/verify-email.dto';
import { RequestPasswordOrMailResetDto } from '../dtos/request-password-reset.dto';
import { RequestVerifyEmailDto } from '../dtos/request-verify-email.dto';
import { Response } from 'express';
import { UpdateUserMailDto } from '../dtos/update-user-mail.dto';

@ApiTags('Mail Reset')
@Controller('mail-reset')
export class MailResetController {
    constructor(private readonly usersService: UsersService) {}

    // Rota não precisa do guards porque só e acessivel com o token que precisou ser solicitado pelo ADMIN
    @Post('/reset-mail')
    @ApiOperation({
        summary: 'Reset user mail',
        description: 'Resets a user mail using the token received by email',
    })
    @ApiBody({ type: UpdateUserMailDto })
    @ApiResponse({
        status: 200,
        description: 'Mail updated successfully',
        schema: { properties: { ok: { type: 'boolean' } } },
    })
    @ApiResponse({ status: 400, description: 'Invalid input or token' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async updateUserMail(@Body() updateOtherUserMailDto: UpdateUserMailDto): Promise<{ ok: boolean }> {
        try {
            const data = {
                token: updateOtherUserMailDto.token,
            };

            return await this.usersService.updateUserMail(data);
        } catch (error) {
            console.log('MAIL_ERROR', error);
        }
    }

    @Post('/request-verify-email')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    @ApiOperation({
        summary: 'Request email verification',
        description: 'Sends a verification email to the user (admin only)',
    })
    @ApiBody({ type: RequestVerifyEmailDto })
    @ApiResponse({
        status: 200,
        description: 'Verification email sent successfully',
        schema: { properties: { ok: { type: 'boolean' } } },
    })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async requestVerifyEmail(
        @Body(new ValidationPipe()) requestVerifyEmailDto: RequestVerifyEmailDto,
    ): Promise<{ ok: boolean }> {
        return await this.usersService.requestVerifyEmail(requestVerifyEmailDto);
    }

    @Get('verify-email')
    @ApiOperation({ summary: 'Verify email', description: 'Verifies user email using the token received by email' })
    @ApiQuery({ name: 'token', type: String, required: true, description: 'Email verification token' })
    @ApiResponse({ status: 302, description: 'Redirects to email verified page upon success' })
    @ApiResponse({ status: 400, description: 'Invalid token' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async verifyEmail(@Query(new ValidationPipe()) data: VerifyEmailDto, @Res() res: Response) {
        try {
            await this.usersService.verifyEmail(data.token);
            res.redirect('https://app.botdesigner.io/users/email-verified');
        } catch (error) {
            throw error;
        }
    }
}
