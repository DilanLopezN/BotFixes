import {
    Controller,
    Body,
    Put,
    Get,
    UseGuards,
    ValidationPipe,
    Query,
    Param,
    UseInterceptors,
    Post,
    HttpCode,
    UploadedFile,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { ApiTags, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { User } from '../interfaces/user.interface';
import { AccessTokenDecorator, UserDecorator } from '../../../decorators/user.decorator';
import { AuthPasswordExpiresDecorator } from '../decorators/auth.decorator';
import { UpdatePasswordDto } from '../dtos/update-password.dto';
import { UpdateAvatarDto } from '../dtos/update-avatar.dto';
import { Exceptions } from '../../auth/exceptions';
import { AccessTokenGuard } from '../../auth/guard/access-token.guard';
import { RolesDecorator } from '../decorators/roles.decorator';
import { castObjectIdToString, PredefinedRoles } from '../../../common/utils/utils';
import { RolesGuard } from '../guards/roles.guard';
import { userAccessLatency } from '../../../common/utils/prom-metrics';
import { isAnySystemAdmin } from '../../../common/utils/roles';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileMimetypeFilter } from '../../../common/file-uploader/file-mimetype-filter';
import { UpdateUserDto } from '../dtos/update-user.dto';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('/:userId/avatar')
    @UseGuards(AuthGuard)
    @UseInterceptors(
        FileInterceptor('attachment', {
            fileFilter: fileMimetypeFilter(['jpg', 'jpeg', 'png']),
            limits: { fileSize: 2000000 },
        }),
    )
    async updateAvatar(
        @UploadedFile() file: Express.Multer.File,
        @UserDecorator() user: User,
        @Param('userId') userId: string,
        @AccessTokenDecorator() token: string,
        @Body(new ValidationPipe({ validationError: { target: false } })) updateAvatarDto: UpdateAvatarDto,
    ) {
        if (userId !== castObjectIdToString(user._id)) {
            throw Exceptions.USER_CANT_ACCESS_RESOURCE;
        }
        return await this.usersService.updateAvatar(updateAvatarDto.workspaceId, user, token, file.buffer);
    }

    @Put('/password')
    @UseGuards(AuthGuard, AccessTokenGuard)
    @AuthPasswordExpiresDecorator(false)
    async updatePassword(
        @UserDecorator() user: User,
        @AccessTokenDecorator() token: string,
        @Body(new ValidationPipe()) passwordDto: UpdatePasswordDto,
    ) {
        const { password, oldPassword } = passwordDto;
        return await this.usersService.updateAuthenticatedUserPassword(user, token, oldPassword, password);
    }

    @Put('/:userId')
    @UseGuards(AuthGuard)
    @ApiParam({ name: 'userId', description: 'userId', type: String, required: true })
    async update(
        @UserDecorator() user: User,
        @Param('userId') userId: string,
        @AccessTokenDecorator() token: string,
        @Body(new ValidationPipe({ validationError: { target: false } })) userDto: UpdateUserDto,
    ) {
        if (userId !== castObjectIdToString(user._id)) {
            throw Exceptions.USER_CANT_ACCESS_RESOURCE;
        }

        return await this.usersService.updateAuthenticatedUser(
            userId,
            token,
            {
                timezone: userDto.timezone,
                name: userDto.name,
                language: userDto.language,
                liveAgentParams: userDto.liveAgentParams,
            },
            userDto.workspaceId,
        );
    }

    @Put('/:userId/remove-avatar')
    @UseGuards(AuthGuard)
    @ApiParam({ name: 'userId', description: 'userId', type: String, required: true })
    async removeAvatar(@UserDecorator() user: User, @Param('userId') userId: string) {
        if (userId !== castObjectIdToString(user._id)) {
            throw Exceptions.USER_CANT_ACCESS_RESOURCE;
        }

        return await this.usersService.removeAvatarUser(userId);
    }

    @Get('/me')
    @AuthPasswordExpiresDecorator(false)
    @UseGuards(AuthGuard)
    async getUserMe(@UserDecorator() user: User) {
        const isAdmin = isAnySystemAdmin(user);
        if (isAdmin) {
            const timer = userAccessLatency.labels(user.name, 'me', 'sem workspace').startTimer();
            timer();
        }
        return await this.usersService.getAuthenticatedMe(castObjectIdToString(user._id));
    }

    @Get('/method/:email')
    async getUserMethod(@Param('email') email: string) {
        const re =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const isEmail = re.test(email);
        if (isEmail) {
            return this.usersService.findLoginMethodByEmail(email);
        }
        return null;
    }

    @Get('/:userId')
    @UseGuards(AuthGuard)
    @ApiParam({ name: 'userId', description: 'userId', type: String, required: true })
    async getUserAuthenticated(
        @UserDecorator() user: User,
        @Param('userId') userId: string,
        @Query('workspaceId') workspaceId: string,
    ) {
        if (userId == user._id?.toString?.() && !!workspaceId) {
            return await this.usersService.getAuthenticatedUser(castObjectIdToString(user._id), workspaceId);
        }
        return await this.usersService._getOne(userId);
    }

    @Get()
    async getByEmail(@Query('email') email: string) {
        return await this.usersService._queryPaginate({
            filter: { email: { $eq: email } },
        });
    }

    @Post('cognito-registry')
    async cognitoRegistry(@Body() body: { email: string; password: string; newPassword: string }) {
        return await this.usersService.registryCognito(body.email, body.password, body.newPassword);
    }

    @HttpCode(200)
    @Post('validate')
    async validateCredentials(@Body() body: { email: string; password: string }) {
        return await this.usersService.validateCredentials(body.email, body.password);
    }

    @Post('/checkUserCount/workspace/:workspaceId')
    @UseGuards(AuthGuard, RolesGuard)
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    async getWithinLimit(@Param('workspaceId') workspaceId: string) {
        return await this.usersService.checkUserCount(workspaceId);
    }
}
