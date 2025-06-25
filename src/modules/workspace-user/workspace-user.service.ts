import {
    BadRequestException,
    Inject,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
    forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { join } from 'bluebird';
import { isArray } from 'lodash';
import * as moment from 'moment';
import { Model, Types } from 'mongoose';
import { isAnySystemAdmin, isSystemAdmin, isWorkspaceAdmin } from '../../common/utils/roles';
import { castObjectId, castObjectIdToString } from '../../common/utils/utils';
import { CacheService } from '../_core/cache/cache.service';
import { RoleDto, UserLanguage } from '../users/dtos/user.dto';
import { CognitoIdentityService } from '../users/services/cognito-identity.service';
import { UsersHistoryService } from '../users/services/users-history.service';
import { QueryStringFilter } from './../../common/abstractions/queryStringFilter.interface';
import { CatchError, Exceptions } from './../auth/exceptions';
import { BotsService } from './../bots/bots.service';
import { PermissionResources, Role, User, UserRoles } from './../users/interfaces/user.interface';
import { PASSWORD_EXPIRATION, UsersService } from './../users/services/users.service';
import { CreateUserRoleRequest } from './dtos/user-role.dto';
import { User as IUser } from './interfaces/workspace-user.create.interface';
import { MailResetRequestService } from '../users/services/mail-reset-request.service';

@Injectable()
export class WorkspaceUserService {
    private readonly workspaceRoles: UserRoles[] = [
        UserRoles.BOT_ADMIN,
        UserRoles.BOT_DEVELOP,
        UserRoles.WORKSPACE_ADMIN,
        UserRoles.WORKSPACE_AGENT,
        UserRoles.WORKSPACE_INACTIVE,
    ];
    private readonly logger = new Logger(WorkspaceUserService.name);

    constructor(
        @Inject(forwardRef(() => UsersService))
        @InjectModel('User')
        protected readonly model: Model<User>,
        private readonly userService: UsersService,
        private readonly botService: BotsService,
        private readonly usersHistoryService: UsersHistoryService,
        private readonly cognitoIdentityService: CognitoIdentityService,
        public cacheService: CacheService,
    ) {}

    private readonly sendEvent: (data: User, operation: 'update' | 'create' | 'delete') => void;

    getItensProcessingCacheKey(workspaceId: string) {
        return `workspace-user-processing-${workspaceId}`;
    }

    private async getPossibleResources(workspaceId: string): Promise<string[]> {
        const possibleResourceIds: string[] = [];
        const bots = await this.botService.getAll({ workspaceId });

        const resources = [...bots, { _id: workspaceId }];

        resources.forEach((resource) => possibleResourceIds.push(String(resource._id)));

        return possibleResourceIds;
    }

    async getAllWorkspaceUser(query: QueryStringFilter, workspaceId: string) {
        if (!query.filter?.email) {
            query = {
                ...query,
                filter: {
                    ...query.filter,
                    roles: {
                        $elemMatch: {
                            role: { $in: this.workspaceRoles },
                            resourceId: workspaceId,
                        },
                    },
                },
            };
        }

        const users = await this.userService.queryPaginate({
            ...query,

            projection: {
                ...query.projection,
                password: 0,
            },
        });

        users.data = await this.filterRoles(users.data, workspaceId);
        return users;
    }

    async getAllWorkspaceUserWithRoleActive(query: QueryStringFilter, workspaceId: string) {
        query = {
            ...query,
            filter: {
                roles: {
                    $elemMatch: {
                        role: { $ne: UserRoles.WORKSPACE_INACTIVE },
                        resourceId: { $eq: new Types.ObjectId(workspaceId) },
                    },
                },
            },
        };

        const users = await this.userService.queryPaginate({
            ...query,

            projection: {
                password: 0,
            },
        });

        users.data = await this.filterRoles(users.data, workspaceId);

        return users;
    }

    public async filterRoles(data: any, workspaceId?: string) {
        const users = !isArray(data) ? [data] : data;
        const possibleResourceIds = await this.getPossibleResources(workspaceId);

        if (!workspaceId) {
            users.map((user) => {
                user.roles = [];
            });

            return users;
        }

        users.map((user) => {
            const filteredRoles = user.roles.filter(
                (role) => possibleResourceIds.includes(String(role.resourceId)) || role.role === UserRoles.SYSTEM_ADMIN,
            );
            user.roles = filteredRoles;
        });

        return users;
    }

    /**
     * Valida se um bot pertence a um workspace
     * @param botId
     * @param workspaceId
     */
    private async botIsOwnedByWorkspace(botId: string, workspaceId: string): Promise<boolean> {
        return !!(await this.botService.findOne({ _id: botId, workspaceId }));
    }

    /**
     * Valida se a um resourceId de uma role pertence a um workspace de acordo com o tipo de resource
     * @param role
     * @param workspaceId
     */
    private async resourceIdIsOwnedByWorkspace(role: Role, workspaceId: string, requestUser?: User): Promise<boolean> {
        if (requestUser.roles.find((currRole) => currRole.role === UserRoles.SYSTEM_ADMIN)) {
            return true;
        }
        if (!this.workspaceRoles.find((workspaceRole) => workspaceRole !== role.role)) {
            return false;
        }
        switch (role.role) {
            case UserRoles.BOT_ADMIN:
                return await this.botIsOwnedByWorkspace(role.resourceId, workspaceId);
            case UserRoles.BOT_DEVELOP:
                return await this.botIsOwnedByWorkspace(role.resourceId, workspaceId);
            case UserRoles.WORKSPACE_AGENT:
                return role.resourceId == workspaceId;
            case UserRoles.WORKSPACE_ADMIN:
                return true;
            case UserRoles.WORKSPACE_INACTIVE:
                return true;
            case UserRoles.WORKSPACE_PENDENT_CONFIG:
                return true;
            default:
                return false;
        }
    }

    /**
     * Cria uma role para o usuário.
     * É checkado se o usuário que está criando pode criar role para o dado workspaceId
     *  através do RolesDecorator do controller.
     * Aqui no service é checkado se o resourceId que foi passado pertence ao workspace passado
     * @param createRoleRequest
     * @param userDoingAction
     * @param workspaceId
     * @param userId
     */
    async createUserRole(
        createRoleRequest: CreateUserRoleRequest,
        userDoingAction: User,
        workspaceId: string,
        userId: string,
    ) {
        const user = await this.model.findOne({ _id: userId });

        if (isSystemAdmin(user)) {
            throw Exceptions.USER_CANNOT_UPDATE_ROLE;
        }

        const canUpdateRole = await this.resourceIdIsOwnedByWorkspace(
            createRoleRequest as Role,
            workspaceId,
            userDoingAction,
        );
        if (canUpdateRole) {
            const customId = new Types.ObjectId();
            const createdRole = await this.userService
                .getModel()
                .updateOne(
                    { _id: userId },
                    {
                        $push: {
                            roles: {
                                _id: customId,
                                ...createRoleRequest,
                            } as Role,
                        },
                    },
                )
                .exec();

            if (createdRole.modifiedCount === 1) {
                await this.usersHistoryService.create(castObjectIdToString(userDoingAction._id), user);
                return {
                    ...createRoleRequest,
                    _id: customId,
                };
            }
        }
    }

    async deleteUserRole(workspaceId: string, userId: string, roleId: string, userDoingAction: User) {
        const toUpdateUser = await this.model.findOne({
            _id: castObjectId(userId),
            deletedAt: undefined,
            roles: { $elemMatch: { resourceId: workspaceId } },
        });

        if (isSystemAdmin(toUpdateUser)) {
            throw Exceptions.USER_CANNOT_UPDATE_ROLE;
        }

        const { user, possibleResourceIds } = await new Promise<{ user: User; possibleResourceIds: string[] }>(
            (resolve) => {
                join(
                    this.getPossibleResources(workspaceId),
                    this.model.findOne({
                        _id: userId,
                        deletedAt: undefined,
                        roles: { $elemMatch: { resourceId: workspaceId } },
                    }),
                    (possibleResourceIds, user) => {
                        resolve({ possibleResourceIds, user });
                    },
                );
            },
        );

        const isRoleIntoPossibleResources: boolean = !!user.roles.find((role) => {
            return role._id == roleId && !!possibleResourceIds.find((resourceId) => role.resourceId == resourceId);
        });

        const userIsSystemAdmin = userDoingAction.roles.find((currRole) => currRole.role === UserRoles.SYSTEM_ADMIN);

        if (isRoleIntoPossibleResources || userIsSystemAdmin) {
            await this.model.updateMany(
                { _id: new Types.ObjectId(userId) },
                {
                    $pull: {
                        roles: {
                            resourceId: new Types.ObjectId(workspaceId),
                        },
                    },
                },
            );

            await this.usersHistoryService.create(castObjectIdToString(userDoingAction._id), toUpdateUser);
        }
        if (this.cacheService) {
            await this.cacheService.remove(userId).then().catch(console.log);
        }
        return { ok: true };
    }

    public async createUser(userData: IUser, workspaceId: string) {
        try {
            const rgxSpaceBeginEnd = /^\s+|\s+$/;

            if (rgxSpaceBeginEnd.test(userData.name)) {
                userData.name = userData.name.trim();
            }

            if (rgxSpaceBeginEnd.test(userData.email)) {
                userData.email = userData.email.trim().toLowerCase();
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                throw Exceptions.INVALID_EMAIL_FORMAT;
            }

            const roleFormat = userData.role
                ? [
                      {
                          resource: userData.role.resource,
                          resourceId: workspaceId,
                          role: userData.role.role,
                      },
                  ]
                : [];

            let subAttr;

            try {
                // necessário apenas para casos especiais, onde algum usuário venha a ser deletado do banco e não do cognito.
                const alreadyExistsUserInCognito = await this.cognitoIdentityService.adminGetUser(userData.email);

                if (alreadyExistsUserInCognito) {
                    subAttr = alreadyExistsUserInCognito.UserAttributes.find((userAttr) => userAttr.Name === 'sub');
                    if (userData?.timezone) {
                        delete userData.timezone;
                    }
                    return await this.userService._create({
                        ...userData,
                        roles: roleFormat,
                        language: UserLanguage.pt,
                        cognitoUniqueId: subAttr.Value,
                    });
                }
            } catch (error) {
                // neste caso não tem necessidade de tratar o erro que pode vir do "adminGetUser"
                // pois só vai dar erro se o usuário não estiver criado no cognito ainda
                // o que acontecerá na maioria dos casos
            }

            const response = await this.cognitoIdentityService.adminCreateUser(
                {
                    email: userData.email,
                    name: userData.name,
                    avatar: userData.avatar,
                },
                userData.password,
            );

            subAttr = response.User.Attributes.find((userAttr) => userAttr.Name === 'sub');

            if (!response) {
                throw new BadRequestException();
            }

            if (userData?.timezone) {
                delete userData.timezone;
            }

            return await this.userService._create({
                ...userData,
                roles: roleFormat,
                language: UserLanguage.pt,
                cognitoUniqueId: subAttr.Value,
            });
        } catch (error) {
            console.log(error);
            if (error?.code === 'LimitExceededException') {
                throw new BadRequestException('Too many requests', 'LIMIT_EXCEEDED');
            }
            throw new BadRequestException(error.message);
        }
    }

    public async updateUser(
        whoUserId: string,
        userId: string,
        updateUserData: Partial<IUser & { subRoles?: RoleDto[] }>,
        workspaceID: string,
        ignoreCognitoUpdate?: boolean,
        authUser?: User,
    ) {
        try {
            const rgxSpaceBeginEnd = /^\s+|\s+$/;
            let emailWasUpdated = false;

            if (rgxSpaceBeginEnd.test(updateUserData.name)) {
                updateUserData.name = updateUserData.name.trim();
            }

            if (rgxSpaceBeginEnd.test(updateUserData.email)) {
                updateUserData.email = updateUserData.email.trim().toLowerCase();
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (updateUserData.email && !emailRegex.test(updateUserData.email)) {
                throw Exceptions.INVALID_EMAIL_FORMAT;
            }

            if (this.cacheService) {
                await this.cacheService.remove(userId).then().catch(console.log);
            }

            const user = await this.model.findOne({
                _id: userId,
                deletedAt: undefined,
                roles: { $elemMatch: { resourceId: workspaceID } },
            });

            if (!user) {
                throw Exceptions.USER_NOT_FOUND;
            }

            // entra apenas se vier o email na data
            if (updateUserData.email) {
                const isEmailChanged = updateUserData.email !== user.email;
                // so faz requisição de troca se o email for diferente
                if (isEmailChanged) {
                    emailWasUpdated = true;
                    try {
                        await this.userService.requestUserMailReset({
                            email: user.email,
                            newMail: updateUserData.email,
                        });
                    } catch (error) {
                        this.logger.error('Erro ao solicitar reset de email:', error);

                        if (
                            error === Exceptions.USER_EMAIL_ALREADY_EXISTS ||
                            error === Exceptions.HAS_OPEN_RESET_REQUEST
                        )
                            throw error;

                        // Log do erro mas não impede a atualização dos outros campos
                    }
                }

                // Remove email dos updates - responsabilidade fica com requestUserMailReset
                delete updateUserData.email;
            }

            if (!ignoreCognitoUpdate) {
                await this.cognitoIdentityService.adminUpdateUserProfile({
                    email: user.email,
                    name: updateUserData.name ?? user.name,
                    avatar: updateUserData.avatar ?? user.avatar,
                });
            }

            if (updateUserData.passwordExpires) {
                const expires = moment().add(PASSWORD_EXPIRATION, 'days').endOf('day').valueOf();

                if (updateUserData.passwordExpires > expires) {
                    updateUserData.passwordExpires = expires;
                }
            }

            if (updateUserData?.role || updateUserData?.subRoles?.length) {
                if (isSystemAdmin(user)) {
                    throw Exceptions.USER_CANNOT_UPDATE_ROLE;
                }
                const roleByWorkspace = user.roles.find((r) => r?.resourceId?.toString() === workspaceID);

                if (!roleByWorkspace) {
                    throw Exceptions.USER_CANNOT_UPDATE_ROLE;
                }

                const canUpdateRole = await this.resourceIdIsOwnedByWorkspace(
                    updateUserData.role as Role,
                    workspaceID,
                    authUser,
                );
                const possibleResourceIds = await this.getPossibleResources(workspaceID);
                const isRoleIntoPossibleResources: boolean = !!user.roles.find((role) => {
                    return (
                        role._id == roleByWorkspace._id &&
                        !!possibleResourceIds.find((resourceId) => role.resourceId == resourceId)
                    );
                });

                if (canUpdateRole && (isRoleIntoPossibleResources || isSystemAdmin(authUser))) {
                    try {
                        const result = await this.userService.updateWithChangeRoles(
                            workspaceID,
                            whoUserId,
                            userId,
                            updateUserData,
                            updateUserData?.role
                                ? {
                                      ...updateUserData.role,
                                      resource: roleByWorkspace?.resource || PermissionResources.WORKSPACE,
                                  }
                                : undefined,
                            updateUserData.subRoles,
                        );

                        return {
                            ...result,
                            message: emailWasUpdated
                                ? 'Usuário foi atualizado e foi requisitada uma troca de email'
                                : 'Usuário foi atualizado',
                        };
                    } catch (error) {
                        console.log(error);
                        throw new BadRequestException('Error update User Role');
                    }
                }
            } else {
                const result = await this.userService._update(whoUserId, userId, updateUserData);

                return {
                    ...result,
                    message: emailWasUpdated
                        ? 'Usuário foi atualizado e foi requisitada uma troca de email'
                        : 'Usuário foi atualizado',
                };
            }
        } catch (error) {
            if (error?.code === 'LimitExceededException') {
                throw new BadRequestException('Too many requests', 'LIMIT_EXCEEDED');
            }

            throw new BadRequestException(error);
        }
    }

    public async deleteUser(
        userId: string,
        workspaceId: string,
        userCanDeleteCB?: (...params) => Promise<any>,
        forceDelete?: boolean,
    ) {
        const entity = await this.model.findOne({
            _id: userId,
            roles: { $elemMatch: { resourceId: workspaceId } },
        });

        if (!entity) {
            throw new NotFoundException();
        }

        if (userCanDeleteCB) {
            await userCanDeleteCB(entity);
        }

        this.sendEvent(entity, 'delete');

        if (forceDelete) {
            await this.model.findOneAndDelete({ _id: castObjectId(userId) } as any);
        } else {
            await this.model.updateOne({ _id: castObjectId(userId) }, { $set: { deletedAt: new Date() } } as any);
        }

        if (this.cacheService) {
            await this.cacheService.remove(userId).then().catch(console.log);
        }

        return { deleted: true };
    }

    async getOne(userId: any, workspaceID?: string) {
        let result: User = null;

        if (this.cacheService && userId) {
            result = await this.cacheService.get(`${userId.toString()}`);

            if (result) {
                return result;
            }
        }

        if (typeof userId === 'string') {
            userId = castObjectId(userId);
        }

        result = await this.userService
            .getModel()
            .findOne({
                _id: userId,
                deletedAt: undefined,
                ...(workspaceID ? { roles: { $elemMatch: { resourceId: workspaceID } } } : {}),
            })
            .exec();

        if (this.cacheService && result) {
            await this.cacheService
                .set(result, userId, parseInt(process.env.REDIS_CACHE_EXPIRATION) || 1800000)
                .then()
                .catch(console.log);
        }

        return result;
    }

    public async updateUserPassword(userId: string, authUser: User, newPassword: string, workspaceId: string) {
        const user = await this.model.findOne({
            _id: userId,
            deletedAt: undefined,
            roles: { $elemMatch: { resourceId: workspaceId } },
        });

        if (!user) {
            throw Exceptions.USER_NOT_FOUND;
        }

        const userIsAnySystemAdmin = isAnySystemAdmin(user);
        const userIsSystemAdmin = isSystemAdmin(user);

        const authUserIsSystemAdmin = isSystemAdmin(authUser);
        const authUserIsWorkspaceAdmin = isWorkspaceAdmin(authUser, workspaceId);

        //TODO: acho que colocaria aqui para wsAdmin que estiver com e-mail validado poder trocar senha
        if ((!!userIsSystemAdmin && !authUserIsSystemAdmin) || (!!userIsAnySystemAdmin && !!authUserIsWorkspaceAdmin)) {
            throw new UnauthorizedException('missing authorization', 'MISSING_AUTHORIZATION');
        }

        try {
            if (!user.cognitoUniqueId) {
                return await this.userService.updatePassword(
                    castObjectIdToString(authUser._id),
                    user,
                    newPassword,
                    false,
                );
            }
            await this.cognitoIdentityService.adminSetUserPassword(user.email, newPassword);
            return user;
        } catch (error) {
            console.log(error);
            if (error?.code === 'LimitExceededException') {
                throw new BadRequestException('Too many requests', 'LIMIT_EXCEEDED');
            }
            throw new BadRequestException(error.message);
        }
    }

    async createUserByBatch(data: User, workspaceId: string, authUser: User) {
        const existUserEmail = await this.userService.findOneByEmail(data.email);

        if (existUserEmail) {
            if (existUserEmail.roles.find((r) => r.resourceId?.toString() === workspaceId)) return;
            return await this.createUserRole(
                {
                    resource: PermissionResources.WORKSPACE,
                    resourceId: workspaceId,
                    role: UserRoles.WORKSPACE_AGENT,
                },
                authUser,
                workspaceId,
                (existUserEmail as any)._id,
            );
        }
        const DEFAULTPASSWORD = 'Bot@123456';

        const createUser = {
            name: data.name,
            email: data.email,
            password: DEFAULTPASSWORD,
            language: UserLanguage.pt,
        };

        const user = await this.createUser(createUser, workspaceId);

        return await this.createUserRole(
            {
                resource: PermissionResources.WORKSPACE,
                resourceId: workspaceId,
                role: UserRoles.WORKSPACE_AGENT,
            },
            authUser,
            workspaceId,
            (user as any)._id,
        );
    }

    async saveUserToProcessing(data: User, workspaceId: string) {
        const processingCacheKey = this.getItensProcessingCacheKey(workspaceId);
        const client = this.cacheService.getClient();
        await client.hset(processingCacheKey, data.email, JSON.stringify(data));
        await client.expire(processingCacheKey, 120);
    }

    @CatchError()
    async processCreateUser(workspaceId: string, authUser: User) {
        const processingCacheKey = this.getItensProcessingCacheKey(workspaceId);
        const client = this.cacheService.getClient();

        let results = await client.hrandfield(processingCacheKey, 1);
        let countCreatedUser = 0;

        while (results?.length) {
            for (const key of results) {
                const dataString = await client.hget(processingCacheKey, key as string);
                const data = JSON.parse(dataString);
                try {
                    const createUser = await this.createUserByBatch(data, workspaceId, authUser);

                    if (createUser?._id) {
                        countCreatedUser = countCreatedUser + 1;
                    }
                } catch (e) {
                    this.logger.error(`Error processing create user: ${JSON.stringify(data)}`);
                    this.logger.error(`Error processing create user ERROR STACK: ${e}`);
                }
                await client.hdel(processingCacheKey, key as string);
            }
            results = await client.hrandfield(processingCacheKey, 10);
        }

        return countCreatedUser;
    }
}
