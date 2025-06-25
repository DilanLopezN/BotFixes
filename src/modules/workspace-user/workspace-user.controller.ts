import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as csv from 'csvtojson';
import { pick } from 'lodash';
import * as XLSX from 'xlsx';
import { fileMimetypeFilter } from '../../common/file-uploader/file-mimetype-filter';
import { UserDto } from '../users/dtos/user.dto';
import { QueryStringFilter } from './../../common/abstractions/queryStringFilter.interface';
import { castObjectIdToString, PredefinedRoles } from './../../common/utils/utils';
import { QueryStringDecorator } from './../../decorators/queryString.decorator';
import { UserDecorator } from './../../decorators/user.decorator';
import { AuthGuard } from './../auth/guard/auth.guard';
import { RolesDecorator } from './../users/decorators/roles.decorator';
import { RolesGuard } from './../users/guards/roles.guard';
import { User } from './../users/interfaces/user.interface';
import { UpdatePasswordDto } from './dtos/change-password.dto';
import { CreateUserRoleRequest } from './dtos/user-role.dto';
import { CreateWorkspaceUserDTO } from './dtos/workspace-user.create.dto';
import { UpdateWorkspaceUserDTO } from './dtos/workspace-user.update.dto';
import { WorkspaceUserService } from './workspace-user.service';

@ApiTags('Workspace user')
@Controller('workspaces')
export class WorkspaceUserController {
    constructor(private readonly workspaceUsersService: WorkspaceUserService) {}

    @Get(':workspaceId/users')
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @ApiParam({ name: 'workspaceId', required: true })
    @ApiResponse({ isArray: true, type: UserDto, status: 200 })
    @UseGuards(AuthGuard, RolesGuard)
    async getWorkspaceUsers(
        @Param('workspaceId') workspaceId: string,
        @QueryStringDecorator({
            filters: [],
        })
        query: QueryStringFilter,
    ) {
        return await this.workspaceUsersService.getAllWorkspaceUser(query, workspaceId);
    }

    @Get(':workspaceId/users-active')
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_AGENT,
    ])
    @ApiParam({ name: 'workspaceId', required: true })
    @ApiResponse({ isArray: true, type: UserDto, status: 200 })
    @UseGuards(AuthGuard, RolesGuard)
    async getWorkspaceUsersWithRoleActive(
        @Param('workspaceId') workspaceId: string,
        @QueryStringDecorator({
            filters: [],
        })
        query: QueryStringFilter,
    ) {
        return await this.workspaceUsersService.getAllWorkspaceUserWithRoleActive(query, workspaceId);
    }

    @Get(':workspaceId/users/:userId')
    @ApiBearerAuth()
    @UseGuards(AuthGuard)
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @ApiParam({ name: 'userId', description: 'userId', type: String, required: true })
    @ApiParam({ name: 'workspaceId', description: 'workspaceId', type: String, required: true })
    async getOne(@Param('userId') userId: string, @Param('workspaceId') workspaceId: string) {
        return await this.workspaceUsersService.getOne(userId, workspaceId);
    }

    @Post(':workspaceId/users')
    @ApiBearerAuth()
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @ApiParam({ name: 'workspaceId', required: true })
    @UseGuards(AuthGuard, RolesGuard)
    async createUser(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true }))
        userData: CreateWorkspaceUserDTO,
        @Param('workspaceId') workspaceId: string,
    ) {
        return await this.workspaceUsersService.createUser(userData, workspaceId);
    }

    @Post(':workspaceId/users/:userId/roles')
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async createUserRole(
        @Param('workspaceId') workspaceId: string,
        @Param('userId') userId: string,
        @Body() body: CreateUserRoleRequest,
        @UserDecorator() authUser: User,
    ) {
        return await this.workspaceUsersService.createUserRole(body, authUser, workspaceId, userId);
    }

    @Post(':workspaceId/users/user-batch')
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN])
    @UseGuards(AuthGuard)
    @UseInterceptors(
        FileInterceptor('file', {
            fileFilter: fileMimetypeFilter(['csv', 'xlsx']),
            limits: {
                fileSize: 1000000,
            },
        }),
    )
    async createUserBatch(
        @UploadedFile() file: Express.Multer.File,
        @Param('workspaceId') workspaceId: string,
        @UserDecorator() authUser: User,
    ) {
        const readedData = XLSX.read(file.buffer, { type: 'buffer' });
        const wsname = readedData.SheetNames[0];
        const ws = readedData.Sheets[wsname];
        const dataParse: string = XLSX.utils.sheet_to_csv(ws);

        const columnsToValidate = ['name', 'email'];
        let count = 0;

        const headers = dataParse.split('\n')?.[0]?.split(',');

        for (const column of columnsToValidate) {
            const finded = (headers || []).find((header) => header == column);
            if (!finded) {
                throw new BadRequestException(
                    { error: 'CREATE_USER_BATCH_INVALID_FIELD', column: column },
                    `Invalid CSV header. missing field ${column}`,
                );
            }
        }

        await Promise.race([
            new Promise<void>((resolve, reject) => {
                csv({ delimiter: 'auto', flatKeys: true })
                    .fromString(dataParse)
                    .subscribe(
                        (item) => {
                            return new Promise((res, reject) => {
                                if (count >= 200) {
                                    res();
                                } else {
                                    if (item.name && item.email) {
                                        const sanitizedItem = {
                                            ...(pick(item, columnsToValidate) as any),
                                        };
                                        this.workspaceUsersService.saveUserToProcessing(
                                            {
                                                ...sanitizedItem,
                                            },
                                            workspaceId,
                                        );
                                    }
                                    count++;
                                    res();
                                }
                            });
                        },
                        (error) => reject(error),
                        async () => {
                            await this.workspaceUsersService.processCreateUser(workspaceId, authUser);
                            resolve();
                        },
                    );
            }),

            // Timeout de 5 segundos apenas para a requisição não ficar "presa" por muito tempo
            // em caso de muitos registros inseridos ao mesmo tempo
            new Promise<void>((resolve) => setTimeout(resolve, 5000)),
        ]);
    }

    @Put(':workspaceId/users/:userId')
    @ApiBearerAuth()
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateUser(
        @Param('userId') userId: string,
        @Param('workspaceId') workspaceId: string,
        @Body(new ValidationPipe()) userData: UpdateWorkspaceUserDTO,
        @UserDecorator() authUser: User,
    ) {
        return await this.workspaceUsersService.updateUser(
            castObjectIdToString(authUser._id),
            userId,
            userData,
            workspaceId,
            undefined,
            authUser,
        );
    }

    @Put(':workspaceId/users/:userId/password')
    @ApiBearerAuth()
    @RolesDecorator([
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
        PredefinedRoles.WORKSPACE_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async updateUserPassword(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true }))
        passwordDto: UpdatePasswordDto,
        @UserDecorator() authUser: User,
        @Param('userId') userId: string,
        @Param('workspaceId') workspaceId: string,
    ) {
        const { password } = passwordDto;
        return this.workspaceUsersService.updateUserPassword(userId, authUser, password, workspaceId);
    }

    @Delete(':workspaceId/users/:userId')
    @ApiBearerAuth()
    @RolesDecorator([PredefinedRoles.SYSTEM_ADMIN, PredefinedRoles.SYSTEM_CS_ADMIN, PredefinedRoles.SYSTEM_UX_ADMIN])
    @ApiParam({ name: 'workspaceId', required: true })
    @ApiParam({ name: 'userId', description: 'userId', type: String, required: true })
    @UseGuards(AuthGuard, RolesGuard)
    async deleteUser(@Param('userId') userId: string, @Param('workspaceId') workspaceId: string) {
        return await this.workspaceUsersService.deleteUser(userId, workspaceId);
    }

    @Delete(':workspaceId/users/:userId/roles/:roleId')
    @RolesDecorator([
        PredefinedRoles.WORKSPACE_ADMIN,
        PredefinedRoles.SYSTEM_ADMIN,
        PredefinedRoles.SYSTEM_CS_ADMIN,
        PredefinedRoles.SYSTEM_UX_ADMIN,
    ])
    @UseGuards(AuthGuard, RolesGuard)
    async deleteUserRole(
        @Param('workspaceId') workspaceId: string,
        @Param('userId') userId: string,
        @Param('roleId') roleId: string,
        @UserDecorator() authUser: User,
    ) {
        return await this.workspaceUsersService.deleteUserRole(workspaceId, userId, roleId, authUser);
    }
}
