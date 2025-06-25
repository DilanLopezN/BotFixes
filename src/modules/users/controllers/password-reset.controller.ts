import { Controller, Body, Put, Get, UseGuards, ValidationPipe, Query, Post, Res, Patch } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RolesDecorator } from '../decorators/roles.decorator';
import { PredefinedRoles } from '../../../common/utils/utils';
import { RolesGuard } from '../guards/roles.guard';
import { VerifyEmailDto } from '../dtos/verify-email.dto';
import { UpdateUserPasswordDto } from '../dtos/update-user-password.dto';
import { RequestPasswordOrMailResetDto } from '../dtos/request-password-reset.dto';
import { RequestVerifyEmailDto } from '../dtos/request-verify-email.dto';
import { Response } from 'express';
import { AccessTokenGuard } from '../../auth/guard/access-token.guard';

@ApiTags('Users Reset')
@Controller('password-reset')
export class PasswordResetController {
    constructor(private readonly usersService: UsersService) {}

    @Post('/request-password-reset')
    @ApiOperation({ summary: 'Request a password reset', description: 'Sends a password reset email to the user' })
    @ApiBody({ type: RequestPasswordOrMailResetDto })
    @ApiResponse({
        status: 200,
        description: 'Password reset email sent successfully',
        schema: { properties: { ok: { type: 'boolean' } } },
    })
    @ApiResponse({ status: 400, description: 'Invalid input' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async requestPasswordReset(
        @Body(new ValidationPipe()) requestPasswordResetDto: RequestPasswordOrMailResetDto,
    ): Promise<{ ok: boolean }> {
        return await this.usersService.requestUserPasswordReset(requestPasswordResetDto);
    }

    @Patch('/reset-password')
    @ApiOperation({
        summary: 'Reset user password',
        description: 'Resets a user password using the token received by email',
    })
    @ApiBody({ type: UpdateUserPasswordDto })
    @ApiResponse({
        status: 200,
        description: 'Password updated successfully',
        schema: { properties: { ok: { type: 'boolean' } } },
    })
    @ApiResponse({ status: 400, description: 'Invalid input or token' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async updateUserPassword(
        @Body(new ValidationPipe()) updateOtherUserPasswordDto: UpdateUserPasswordDto,
    ): Promise<{ ok: boolean }> {
        return await this.usersService.updateUserPassword(updateOtherUserPasswordDto);
    }

    @UseGuards(AuthGuard, RolesGuard)
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
