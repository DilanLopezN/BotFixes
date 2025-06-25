import { AuthService } from './../../auth/auth.service';
import { Injectable, forwardRef, Inject, BadRequestException, Logger } from '@nestjs/common';
import { CreateSSOUserData, Role, User } from '../interfaces/user.interface';
import * as moment from 'moment';
import { MongooseAbstractionService } from '../../../common/abstractions/mongooseAbstractionService.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId, Types } from 'mongoose';
import { CatchError, Exceptions } from '../../auth/exceptions';
import { LoginMethod, UserModel } from '../schemas/user.schema';
import { EventsService } from './../../events/events.service';
import { StorageService } from '../../storage/storage.service';
import {
    KissbotEventDataType,
    KissbotEventSource,
    KissbotEventType,
    User as IUser,
    UserRoles,
    PermissionResources,
} from 'kissbot-core';
import { UsersHistoryService } from './users-history.service';
import { CognitoIdentityService } from './cognito-identity.service';
import { WorkspacesService } from './../../workspaces/services/workspaces.service';
import { WorkspaceService } from './../../billing/services/workspace.service';
import { CacheService } from '../../_core/cache/cache.service';
import { castObjectId, castObjectIdToString } from '../../../common/utils/utils';
import {
    getAdminRoles,
    isAnySystemAdmin,
    isWorkspaceAdmin,
    getAdminWorkspaceId,
    isAnyWorkspaceAdmin,
    isUserAgent,
} from '../../../common/utils/roles';
import { SubRolesResourceWorkspace } from '../../workspace-user/interfaces/workspace-user.create.interface';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '../../../config/config.service';
import { UpdateUserPasswordDto as UpdateUserPasswordDto } from '../dtos/update-user-password.dto';
import { RequestPasswordOrMailResetDto } from '../dtos/request-password-reset.dto';
import { PasswordResetRequestService } from './password-reset-request.service';
import { ExternalDataService } from './external-data.service';
import { RequestVerifyEmailDto } from '../dtos/request-verify-email.dto';
import { VerifyEmailRequestService } from './verify-email-request.service';
import { MailResetRequestService } from './mail-reset-request.service';
import { UpdateUserMailDto } from '../dtos/update-user-mail.dto';

const SHA256 = require('crypto-js/sha256');

export const PASSWORD_EXPIRATION = 60;

@Injectable()
export class UsersService extends MongooseAbstractionService<User> {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectModel('User') protected readonly model: Model<User>,
        @Inject(forwardRef(() => AuthService))
        private readonly authService: AuthService,
        readonly eventsService: EventsService,
        private readonly storageService: StorageService,
        private readonly usersHistoryService: UsersHistoryService,
        private readonly cognitoIdentityService: CognitoIdentityService,
        private workspaceService: WorkspacesService,
        private readonly workspaceBillingService: WorkspaceService,
        private redisCacheService: CacheService,
        private config: ConfigService,
        private readonly passwordResetRequestService: PasswordResetRequestService,
        private readonly mailResetRequestService: MailResetRequestService,
        private readonly externalDataService: ExternalDataService,
        private readonly verifyEmailRequestService: VerifyEmailRequestService,
    ) {
        super(model);
    }

    getSearchFilter(search: string): any {
        search = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        return {
            $or: [
                {
                    name: { $regex: `.*${search}.*`, $options: 'i' },
                },
                {
                    email: { $regex: `.*${search}.*`, $options: 'i' },
                },
            ],
        };
    }

    getEventsData() {}

    public async _create(userData: IUser, expiresPassword?: boolean) {
        if (await this.model.findOne({ email: userData.email })) {
            throw Exceptions.EMAIL_IN_USE;
        }

        if (await this.model.findOne({ cognitoUniqueId: userData.cognitoUniqueId })) {
            throw Exceptions.COGNITO_UNIQUE_ID_IN_USE;
        }

        const user = await this.create({
            ...new UserModel(userData).toJSON({ minimize: false }),
            // seta expirada para alterar senha assim que efetuar login
            passwordExpires: expiresPassword
                ? moment().valueOf()
                : moment().add(PASSWORD_EXPIRATION, 'days').endOf('day').valueOf(),
        });

        user.password = undefined;
        return await this.authService.genTokenRegister(user);
    }

    @CatchError()
    async createSsoUser(userData: CreateSSOUserData, cognitoGroup: string) {
        const workspaces = await this.workspaceService.findWorkspaceBySSOId(cognitoGroup);
        // Se não tem nenhum workspace cadastrado pro grupo no cognito
        // não é possivel criar usuario pois senão fica sem roles
        if (!workspaces || !workspaces.length) {
            throw Exceptions.SSO_WORKSPACE_NOT_FOUND;
        }

        const existsWrongSsoNameWorkspace = workspaces.find(
            (wrkspc) => !wrkspc.sso?.ssoName || wrkspc.sso?.ssoName === LoginMethod.bot,
        );
        // Não pode criar usuario caso o ssoName não esteja setado corretamente
        if (existsWrongSsoNameWorkspace) {
            throw Exceptions.SSO_NAME_NOT_PROPERLY_SET;
        }
        const loginMethod = workspaces[0].sso.ssoName;
        // Gera as roles pra cada workspace cadastrado com o ssoId igual ao cognitogroup
        const roles = workspaces.map((wrkspc) => {
            return {
                resource: 'WORKSPACE',
                resourceId: wrkspc._id,
                role: UserRoles.WORKSPACE_PENDENT_CONFIG,
            };
        });
        const newUser = {
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar,
            cognitoUniqueId: userData.cognitoUniqueId,
            loginMethod,
            roles,
        };
        return (await this._create(newUser as any, false)) as any;
    }

    public async findOneByEmail(email: string): Promise<User> {
        return await this.model.findOne({ email: { $eq: email } });
    }

    private getUserCacheKeyByEmailAndCognitoId(email: string, cognitoUniqueId: string) {
        return `USER:${email}:${cognitoUniqueId}`;
    }

    private async setUserByEmailAndCognitoIdOnCache(user: User) {
        try {
            const cacheKey = this.getUserCacheKeyByEmailAndCognitoId(user.email, user.cognitoUniqueId);
            const client = await this.redisCacheService.getClient();
            await client.set(cacheKey, JSON.stringify(user), 'EX', 60);
        } catch (e) {
            this.logger.error('setUserByEmailAndCognitoIdOnCache');
            this.logger.error(e);
        }
    }

    private async removeUserByEmailAndCognitoIdOnCache(user: User) {
        try {
            const cacheKey = this.getUserCacheKeyByEmailAndCognitoId(user.email, user.cognitoUniqueId);
            const client = await this.redisCacheService.getClient();
            await client.del(cacheKey);
        } catch (e) {
            this.logger.error('removeUserByEmailAndCognitoIdOnCache');
            this.logger.error(e);
        }
    }

    private async getUserByEmailAndCognitoIdOnCache(email: string, cognitoUniqueId: string) {
        try {
            const cacheKey = this.getUserCacheKeyByEmailAndCognitoId(email, cognitoUniqueId);
            const client = await this.redisCacheService.getClient();
            const result = await client.get(cacheKey);
            return JSON.parse(result) as User;
        } catch (e) {
            this.logger.error('getUserByEmailAndCognitoIdOnCache');
            this.logger.error(e);
        }
    }

    public async findOneByEmailAndCognitoUniqueId(email: string, cognitoUniqueId: string): Promise<User> {
        let user: User = await this.getUserByEmailAndCognitoIdOnCache(email, cognitoUniqueId);
        if (!user) {
            user = await this.model.findOne({ email: { $eq: email }, cognitoUniqueId });
            this.setUserByEmailAndCognitoIdOnCache(user);
        } else {
            user = new this.model(user);
        }
        // const user = await this.model.findOne({ email: { $eq: email }, cognitoUniqueId });
        return user;
    }

    public async updateAuthenticatedUserPassword(
        user: User,
        accessToken: string,
        oldPassword: string,
        newPassword: string,
    ) {
        try {
            await this.cognitoIdentityService.userChangePassword(accessToken, oldPassword, newPassword);
            this.removeUserByEmailAndCognitoIdOnCache(user);
            return await this.updatePasswordExpires(user);
        } catch (error) {
            if (error?.code === 'NotAuthorizedException') {
                throw new BadRequestException('invalid current password', 'INVALID_CURRENT_PASSWORD');
            } else if (error?.code === 'LimitExceededException') {
                throw new BadRequestException('Too many requests', 'LIMIT_EXCEEDED');
            }
            throw new BadRequestException();
        }
    }

    public async updatePasswordExpires(user: User) {
        const updatedUser = await this.updateRaw(
            { _id: user._id },
            {
                $set: {
                    passwordExpires: moment().add(PASSWORD_EXPIRATION, 'days').endOf('day').valueOf(),
                },
            },
        );
        this.removeUserByEmailAndCognitoIdOnCache(user);
        return updatedUser;
    }

    public async findOneByEmailAndPassword(email: string, password: string): Promise<User> {
        return await this.model.findOne({
            email: { $eq: email },
            password: { $eq: SHA256(password).toString() },
        });
    }

    updatedNameMemberEventAnalytics(userId: string, userName: string) {
        this.eventsService.sendEvent({
            data: {
                name: userName,
                _id: userId,
            },
            dataType: KissbotEventDataType.USER,
            source: KissbotEventSource.KISSBOT_API,
            type: KissbotEventType.USER_UPDATED,
        });
    }

    @CatchError()
    async updateAuthenticatedUser(userId: string, accessToken: string, userData: Partial<IUser>, workspaceId: string) {
        const user = await this.getOne({ _id: userId });
        const workspace = await this.workspaceService._getOne(workspaceId);
        if (!workspace) {
            throw Exceptions.WORKSPACE_NOT_FOUND;
        }
        const updateUserData = {
            avatar: userData.avatar,
            name: userData.name,
            email: user.email,
        };
        const shouldRestrictProfileEdit = (() => {
            if (isAnySystemAdmin(user) || isWorkspaceAdmin(user, workspaceId)) {
                return false;
            }

            const flagEnabled = workspace.generalConfigs?.enableEditProfileAllUsers;

            return flagEnabled && isUserAgent(user, workspaceId);
        })();

        if (shouldRestrictProfileEdit) {
            delete updateUserData.name;
            delete updateUserData.avatar;
        }
        await this.cognitoIdentityService.userUpdateProfile(accessToken, updateUserData);

        if (userData.passwordExpires) {
            userData.passwordExpires = undefined;
        }

        const updatedUser = await this.update(userId, {
            ...user.toJSON({ minimize: false }),
            ...userData,
        });

        this.removeUserByEmailAndCognitoIdOnCache(updatedUser);

        if (updatedUser && updatedUser.name !== user.name) {
            this.updatedNameMemberEventAnalytics(castObjectIdToString(updatedUser._id), updatedUser.name);
        }

        updatedUser.password = undefined;
        return updatedUser;
    }

    @CatchError()
    async removeAvatarUser(userId: string) {
        const user = await this.getOne({ _id: userId });

        const updatedUser = await this.model.updateOne(
            {
                _id: user._id,
            },
            {
                $unset: {
                    avatar: true,
                },
            },
        );

        this.removeUserByEmailAndCognitoIdOnCache(user);

        return updatedUser;
    }

    async _update(whoUserId: string, userId: string, userData: Partial<IUser>) {
        const user = await this.getModel()
            .findOne({
                _id: userId,
                deletedAt: undefined,
            })
            .exec();

        this.removeUserByEmailAndCognitoIdOnCache(user);

        const updatedUser = await this.update(userId, {
            ...user.toJSON({ minimize: false }),
            ...userData,
        });

        await this.usersHistoryService.create(whoUserId, user);

        if (updatedUser && updatedUser.name !== user.name) {
            this.updatedNameMemberEventAnalytics(castObjectIdToString(updatedUser._id), updatedUser.name);
        }

        updatedUser.password = undefined;
        return updatedUser;
    }

    async updateWithChangeRoles(
        workspaceId: string,
        whoUserId: string,
        userId: string,
        userData: Partial<IUser>,
        createRoleRequest?: Partial<Role>,
        createSubRole?: Partial<Role>[],
    ) {
        const user = await this.getModel()
            .findOne({
                _id: userId,
                deletedAt: undefined,
                roles: { $elemMatch: { resourceId: workspaceId } },
            })
            .exec();

        if (!user) {
            throw Exceptions.USER_NOT_FOUND;
        }

        this.removeUserByEmailAndCognitoIdOnCache(user);

        const customId = new Types.ObjectId();
        let newRoles = user.roles?.filter((role) => {
            // se veio createRoleRequest e a role a ser trocada e não é uma 'subRole' deve filtrar para remover
            // e após dar um push na nova role para o workspace
            if (!!createRoleRequest && !SubRolesResourceWorkspace[role.role]) {
                return role?.resourceId?.toString?.() !== workspaceId?.toString?.();
            }
            // se a role a ser trocada faz parte do enum de 'subRoles'
            // deve filtrar todas que possuem o resourceId igual do workspaceId para remover
            // e após dar um push nas novas 'subRole' que vieram em createSubRole para o workspace
            if (!!SubRolesResourceWorkspace[role.role]) {
                return role?.resourceId?.toString?.() !== workspaceId?.toString?.();
            }
            return true;
        });

        if (!!createRoleRequest) {
            newRoles.push({
                _id: customId,
                ...createRoleRequest,
                resource: PermissionResources.WORKSPACE,
                resourceId: castObjectId(workspaceId),
            } as any);
        }
        if (!!createSubRole?.length) {
            for (const subRole of createSubRole) {
                newRoles.push({
                    _id: new Types.ObjectId(),
                    ...subRole,
                    resource: PermissionResources.WORKSPACE,
                    resourceId: castObjectId(workspaceId),
                } as any);
            }
        }

        const workspace = await this.workspaceService.findOne({
            _id: workspaceId,
        });

        const flagEnableUploadErpDocuments = workspace.featureFlag.enableUploadErpDocuments;

        const updatedUser = await this.getModel().updateOne(
            { _id: userId },
            {
                $set: {
                    name: userData.name,
                    passwordExpires: userData.passwordExpires || user.passwordExpires,
                    roles: newRoles,
                    ...(flagEnableUploadErpDocuments ? { erpUsername: userData.erpUsername } : {}),
                },
            },
        );

        if (updatedUser.modifiedCount === 1) {
            await this.usersHistoryService.create(whoUserId, user);

            const newUser = await this.getModel()
                .findOne({
                    _id: userId,
                    deletedAt: undefined,
                    roles: { $elemMatch: { resourceId: workspaceId } },
                })
                .exec();

            if (newUser.name !== user.name) {
                this.updatedNameMemberEventAnalytics(castObjectIdToString(newUser._id), newUser.name);
            }

            newUser.password = undefined;
            return newUser;
        }

        return updatedUser;
    }

    async _delete(userId: string) {
        return await this.delete(userId);
    }

    async getOne(userId: any, workspaceID?: string) {
        let result: User = null;

        if (this.cacheService && userId) {
            result = await this.cacheService.get(`${userId.toString()}_${workspaceID ? workspaceID.toString() : ''}`);

            if (result) {
                return result;
            }
        }

        if (typeof userId === 'string') {
            userId = castObjectId(userId);
        }

        result = await this.getModel()
            .findOne({
                _id: userId,
                deletedAt: undefined,
                ...(workspaceID
                    ? {
                          $or: [
                              {
                                  'roles.resourceId': workspaceID,
                              },
                              {
                                  'roles.role': { $in: getAdminRoles() },
                              },
                          ],
                      }
                    : {}),
            })
            .exec();

        if (this.cacheService && result) {
            await this.cacheService
                .set(result, null, parseInt(process.env.REDIS_CACHE_EXPIRATION) || 1800000)
                .then()
                .catch(console.log);
        }

        return result;
    }

    public async getAuthenticatedUser(userId: string, workspaceId: string) {
        const user = await this.getOne(userId, workspaceId);

        return {
            ...(user.toJSON?.({ minimize: false }) || user),
            password: undefined,
            streamUrl: await this.authService.getStreamUrl(user, workspaceId),
        };
    }

    public async getAuthenticatedMe(userId: string) {
        const user = await this.getOne(userId);

        return {
            ...user.toJSON({ minimize: false }),
            password: undefined,
        };
    }

    @CatchError()
    public async updateAvatar(workspaceId: string, user: User, accessToken: string, avatar: any) {
        const workspace = await this.workspaceService._getOne(workspaceId);
        if (!workspace) {
            throw Exceptions.WORKSPACE_NOT_FOUND;
        }
        const shouldRestrictProfileEdit = (() => {
            if (isAnySystemAdmin(user) || isWorkspaceAdmin(user, workspaceId)) {
                return false;
            }

            const flagEnabled = workspace.generalConfigs?.enableEditProfileAllUsers;

            return flagEnabled && isUserAgent(user, workspaceId);
        })();

        if (shouldRestrictProfileEdit) {
            throw Exceptions.PROFILE_EDITING_DISABLED;
        }
        const file = await this.storageService.store(`avatars/${user._id}`, { contents: avatar });

        await this.cognitoIdentityService.userUpdateProfile(accessToken, {
            avatar: file.url,
            name: user.name,
            email: user.email,
        });

        const updatedUser = await this.update(castObjectIdToString(user._id), {
            ...(user?.toJSON?.({ minimize: false }) ?? user),
            avatar: file.url,
        });

        this.removeUserByEmailAndCognitoIdOnCache(user);

        updatedUser.password = undefined;
        return updatedUser;
    }

    public async _queryPaginate(query: any) {
        return await this.queryPaginate(query);
    }

    public async validateCredentials(email: string, password: string) {
        const user = await this.findOneByEmailAndPassword(email, password);
        if (!user) {
            throw Exceptions.USER_NOT_FOUND_BY_PASSWORD;
        }

        user.password = undefined;
        return user;
    }

    public async registryCognito(email: string, password: string, newPassword?: string) {
        const user = await this.findOneByEmailAndPassword(email, password);

        this.removeUserByEmailAndCognitoIdOnCache(user);

        if (!user) {
            throw Exceptions.USER_NOT_FOUND_BY_PASSWORD;
        }

        if (!user.cognitoUniqueId) {
            try {
                const response = await this.cognitoIdentityService.adminCreateUser(
                    {
                        email: user.email,
                        name: user.name,
                        avatar: user.avatar ?? '',
                    },
                    newPassword ?? password,
                );
                const subAttr = response.User.Attributes.find((userAttr) => userAttr.Name === 'sub');

                await this.model.updateOne(
                    { _id: user._id },
                    {
                        cognitoUniqueId: subAttr.Value,
                        // password: null,
                        loginMethod: LoginMethod.bot,
                    },
                );

                return await this.model.findOne({ _id: user._id }).exec();
            } catch (error) {
                console.log(error);
                if (error?.code === 'LimitExceededException') {
                    throw new BadRequestException('Too many requests', 'LIMIT_EXCEEDED');
                }
                throw new BadRequestException();
            }
        }
    }

    public async _getOne(userId: string) {
        const user = await this.getOne(userId);
        user.password = undefined;
        return user;
    }

    @CatchError()
    public async findLoginMethodByEmail(email: string) {
        const user = await this.model.findOne(
            { email },
            {
                loginMethod: 1,
                cognitoUniqueId: 1,
            },
        );
        if (!user) {
            throw Exceptions.USER_NOT_EXISTS_METHOD;
        }
        if (!user.cognitoUniqueId) {
            throw Exceptions.USER_EMPTY_COGNITO_ID;
        }
        return { loginMethod: user.loginMethod };
    }

    public async updatePassword(
        whoUserId: string | undefined,
        user: User,
        newPassword: string,
        incrementExpiration: boolean,
    ) {
        this.removeUserByEmailAndCognitoIdOnCache(user);

        const doc: Partial<User> = {
            ...(user.toJSON({ minimize: false }) as Partial<User>),
            password: SHA256(newPassword).toString(),
        };

        if (incrementExpiration) {
            doc.passwordExpires = moment().add(PASSWORD_EXPIRATION, 'days').endOf('day').valueOf();
        }

        if (whoUserId) {
            await this.usersHistoryService.create(whoUserId, user);
        }

        const updatedUser = await this.update(castObjectIdToString(user._id), doc);
        updatedUser.password = undefined;
        return updatedUser;
    }

    @CatchError()
    public async checkUserCount(workspaceId: string) {
        const users = await this.getAllActiveUsersByWorkspaceId(workspaceId);
        const planUserLimit = await this.workspaceBillingService.getWorkspacePlanUserLimit(workspaceId);
        return {
            userCount: users.length,
            planUserLimit,
        };
    }

    @CatchError()
    private async getAllActiveUsersByWorkspaceId(workspaceId: string) {
        return await this.model.find({
            roles: {
                $elemMatch: {
                    role: {
                        $in: ['WORKSPACE_ADMIN', 'WORKSPACE_AGENT'],
                    },
                    resourceId: workspaceId,
                },
            },
        });
    }

    async getUsers(
        usersId: string[],
        workspaceID: string,
        fields: string = '',
    ): Promise<{ _id: ObjectId; name: string; avatar: string }[]> {
        let result: { _id: ObjectId; name: string; avatar: string }[] = null;

        result = (await this.getModel()
            .find(
                {
                    _id: { $in: usersId },
                    deletedAt: { $exists: false },
                    'roles.resourceId': workspaceID,
                },
                fields,
            )
            .exec()) as { _id: ObjectId; name: string; avatar: string }[];

        return result;
    }

    async verifyEmail(token: string) {
        const verifyEmailRequest = await this.verifyEmailRequestService.findByToken(token);
        if (!verifyEmailRequest || verifyEmailRequest.verifiedAt) {
            throw Exceptions.VERIFY_EMAIL_REQUEST_NOT_FOUND;
        }

        if (verifyEmailRequest.expiresAt < new Date()) {
            throw Exceptions.VERIFY_EMAIL_REQUEST_EXPIRED;
        }

        const user = await this.getOne(verifyEmailRequest.userId);
        if (!user) {
            throw Exceptions.USER_NOT_FOUND;
        }
        if (user.isVerified) {
            throw Exceptions.USER_EMAIL_IS_VERIFIED;
        }
        if (!isAnyWorkspaceAdmin(user)) {
            throw Exceptions.USER_IS_NOT_ANY_WS_ADMIN;
        }

        await this.verifyEmailRequestService.finalizeVerifyEmailRequest(verifyEmailRequest);

        await this._update(user.id, user.id, { isVerified: true });
    }

    public async requestVerifyEmail(requestVerifyEmailDto: RequestVerifyEmailDto): Promise<{
        ok: boolean;
    }> {
        const user = await this.findOneByEmail(requestVerifyEmailDto.email);
        if (!user) {
            throw Exceptions.USER_NOT_FOUND;
        }
        const hasOpenResetRequest = await this.verifyEmailRequestService.hasOpenVerifyEmailRequest(user.id);
        if (hasOpenResetRequest) {
            throw Exceptions.HAS_OPEN_RESET_REQUEST;
        }
        if (user.isVerified) {
            throw Exceptions.USER_EMAIL_IS_VERIFIED;
        }
        const workspaceId = getAdminWorkspaceId(user);
        if (!workspaceId) {
            throw Exceptions.USER_IS_NOT_ANY_WS_ADMIN;
        }
        const verifyEmailRequest = await this.verifyEmailRequestService.create(user.id);

        const emailResponse = await this.externalDataService.sendVerifyEmailRequestEmail(
            workspaceId,
            requestVerifyEmailDto.email,
            verifyEmailRequest.id,
            verifyEmailRequest.token,
        );

        if (!emailResponse.ok) {
            throw new Error('Failed to send verify email');
        }
        return { ok: true };
    }

    public async updateUserPassword(updateUserPasswordDto: UpdateUserPasswordDto): Promise<{
        ok: boolean;
    }> {
        const { newPassword, token } = updateUserPasswordDto;
        const passwordResetRequest = await this.passwordResetRequestService.findByToken(token);
        if (!passwordResetRequest || passwordResetRequest.resetedAt) {
            throw Exceptions.PASSWORD_RESET_REQUEST_NOT_FOUND;
        }

        if (passwordResetRequest.expiresAt < new Date()) {
            throw Exceptions.PASSWORD_RESET_REQUEST_EXPIRED;
        }

        const user = await this.getOne(passwordResetRequest.userId);
        if (!user) {
            throw Exceptions.USER_NOT_FOUND;
        }

        if (!isAnyWorkspaceAdmin(user)) {
            throw Exceptions.USER_IS_NOT_ANY_WS_ADMIN;
        }

        if (user.roles?.some((role) => role.role === 'WORKSPACE_AGENT')) {
            throw Exceptions.USER_IS_NOT_ANY_WS_ADMIN;
        }

        await this.passwordResetRequestService.finalizePasswordResetRequest(passwordResetRequest);

        try {
            await this.removeUserByEmailAndCognitoIdOnCache(user);
            await this.cognitoIdentityService.adminSetUserPassword(user.email, newPassword);
            await this.getModel().updateOne({ _id: user._id }, { $set: { password: SHA256(newPassword).toString() } });
            await this.updatePasswordExpires(user);
            return { ok: true };
        } catch (error) {
            if (error?.code === 'NotAuthorizedException') {
                throw new BadRequestException('invalid current password', 'INVALID_CURRENT_PASSWORD');
            } else if (error?.code === 'LimitExceededException') {
                throw new BadRequestException('Too many requests', 'LIMIT_EXCEEDED');
            }
            throw new BadRequestException();
        }
    }
    public async updateUserMail(updateUserMailDto: UpdateUserMailDto): Promise<{
        ok: boolean;
    }> {
        const mailResetRequest = await this.mailResetRequestService.findByToken(updateUserMailDto.token);
        if (!mailResetRequest || mailResetRequest.resetedAt) {
            throw Exceptions.MAIL_RESET_REQUEST_NOT_FOUND;
        }

        if (mailResetRequest.expiresAt < new Date()) {
            throw Exceptions.MAIL_RESET_REQUEST_EXPIRED;
        }

        const user = await this.getOne(mailResetRequest.userId);
        if (!user) {
            throw Exceptions.USER_NOT_FOUND;
        }

        if (!isAnyWorkspaceAdmin(user)) {
            throw Exceptions.USER_IS_NOT_ANY_WS_ADMIN;
        }

        try {
            await this.removeUserByEmailAndCognitoIdOnCache(user);
            await this.cognitoIdentityService.adminUpdateUserEmail(user.email, mailResetRequest.email);
            await this.getModel().updateOne({ _id: user._id }, { $set: { email: mailResetRequest.email } });
            await this.mailResetRequestService.finalizeMailRequestService(mailResetRequest);

            return { ok: true };
        } catch (error) {
            console.log('SERVICEERROR:', error);
            if (error?.code === 'NotAuthorizedException') {
                throw new BadRequestException('invalid current mail', 'INVALID_CURRENT_MAIL');
            } else if (error?.code === 'LimitExceededException') {
                throw new BadRequestException('Too many requests', 'LIMIT_EXCEEDED');
            }
            throw new BadRequestException();
        }
    }

    public async requestUserPasswordReset(requestPasswordResetDto: RequestPasswordOrMailResetDto): Promise<{
        ok: boolean;
    }> {
        const user = await this.findOneByEmail(requestPasswordResetDto.email);
        if (!user) {
            throw Exceptions.USER_NOT_FOUND;
        }
        const hasOpenResetRequest = await this.passwordResetRequestService.hasOpenResetRequest(user.id);
        if (hasOpenResetRequest) {
            throw Exceptions.HAS_OPEN_RESET_REQUEST;
        }

        const workspaceId = getAdminWorkspaceId(user);

        if (!workspaceId) {
            throw Exceptions.USER_IS_NOT_ANY_WS_ADMIN;
        }

        const passwordResetRequest = await this.passwordResetRequestService.create(user.id);

        const emailResponse = await this.externalDataService.sendPasswordResetRequestEmail(
            workspaceId,
            requestPasswordResetDto.email,
            user.name,
            passwordResetRequest.id,
            passwordResetRequest.token,
        );

        if (!emailResponse.ok) {
            throw new Error('Failed to send password reset email');
        }
        return { ok: true };
    }

    public async requestUserMailReset(requestMailResetDto: RequestVerifyEmailDto): Promise<{
        ok: boolean;
    }> {
        const user = await this.findOneByEmail(requestMailResetDto.email);
        if (!user) {
            throw Exceptions.USER_NOT_FOUND;
        }
        const hasOpenResetRequest = await this.mailResetRequestService.hasOpenResetRequest(user.id);
        if (hasOpenResetRequest) {
            throw Exceptions.HAS_OPEN_RESET_REQUEST;
        }

        const newUserMailAlreadyExists = await this.findOneByEmail(requestMailResetDto.newMail);

        if (newUserMailAlreadyExists) {
            throw Exceptions.USER_EMAIL_ALREADY_EXISTS;
        }

        const workspaceId = getAdminWorkspaceId(user);
        if (!workspaceId) {
            throw Exceptions.USER_IS_NOT_ANY_WS_ADMIN;
        }
        const mailResetRequest = await this.mailResetRequestService.create(user.id, requestMailResetDto.newMail);

        const emailResponse = await this.externalDataService.sendMailResetRequestEmail(
            workspaceId,
            requestMailResetDto.email,
            requestMailResetDto.newMail,
            user.name,
            mailResetRequest.id,
            mailResetRequest.token,
        );

        if (!emailResponse.ok) {
            throw new Error('Failed to send mail reset email');
        }
        return { ok: true };
    }

    public async getUsersByIds(usersId: string[]) {
        const result = await this.getModel()
            .find({
                _id: { $in: usersId },
                deletedAt: { $exists: false },
            })
            .exec();

        return result;
    }
}
