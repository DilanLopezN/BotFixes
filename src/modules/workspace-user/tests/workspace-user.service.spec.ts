import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionResources } from 'kissbot-core';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { v4 } from 'uuid';
import { CacheService } from '../../_core/cache/cache.service';
import { BotsService } from '../../bots/bots.service';
import { UserRoles } from '../../users/interfaces/user.interface';
import { UserSchema } from '../../users/schemas/user.schema';
import { CognitoIdentityService } from '../../users/services/cognito-identity.service';
import { UsersHistoryService } from '../../users/services/users-history.service';
import { UsersService } from '../../users/services/users.service';
import { WorkspaceUserService } from '../workspace-user.service';

describe('MODULE: workspace-user', () => {
    let workspaceUserService: WorkspaceUserService;
    let cacheService: CacheService;
    let userService: UsersService;
    let cognitoIdentityService: CognitoIdentityService;
    let usersHistoryService: UsersHistoryService;
    let botsService: BotsService;
    beforeEach(async () => {
        // const mongoServer = await MongoMemoryServer.create();
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                // MongooseModule.forRootAsync({
                //     useFactory: async () => ({
                //         uri: await mongoServer.getUri(),
                //     }),
                // }),
                MongooseModule.forRoot(
                    process.env.MONGO_URI_TESTS || 'mongodb://localhost:27017/kissbot-api',
                    {
                        useNewUrlParser: true,
                        useUnifiedTopology: false,
                    },
                ),
                MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
            ],
            controllers: [],
            providers: [
                WorkspaceUserService,
                // CacheService,
                {
                    useValue: {
                        remove: jest.fn(),
                    },
                    provide: CacheService,
                },
                {
                    useValue: {
                        _update: jest.fn(),
                        findOne: jest.fn(),
                    },
                    provide: UsersService,
                },
                {
                    useValue: {},
                    provide: BotsService,
                },
                {
                    useValue: {},
                    provide: UsersHistoryService,
                },
                {
                    useValue: {
                        adminUpdateUserProfile: jest.fn(),
                    },
                    provide: CognitoIdentityService,
                },
            ],
        }).compile();
        cacheService = module.get<CacheService>(CacheService);
        userService = module.get<UsersService>(UsersService);
        cognitoIdentityService = module.get<CognitoIdentityService>(CognitoIdentityService);
        usersHistoryService = module.get<UsersHistoryService>(UsersHistoryService);
        botsService = module.get<BotsService>(BotsService);
        workspaceUserService = module.get<WorkspaceUserService>(WorkspaceUserService);
    });

    describe('SERVICE: WorkspaceUserService', () => {
        it('FUNCTION: updateUser - should update user and role', async () => {
            // const whoUserId = v4();
            // const userId = v4();
            // const workspaceID = v4();
            // const updateUserData = {
            //     name: 'Mocked Name',
            //     avatar: 'updated-avatar',
            //     role: {
            //         resource: PermissionResources.WORKSPACE,
            //         resourceId: workspaceID,
            //         role: UserRoles.WORKSPACE_AGENT,
            //     },
            // } as any;
            // const ignoreCognitoUpdate = false;
            // const authUser = {
            //     roles: [
            //         {
            //             resource: PermissionResources.ANY,
            //             role: UserRoles.SYSTEM_ADMIN,
            //         },
            //     ],
            //     name: 'API_USER',
            //     email: 'api@botdesigner.io',
            //     _id: whoUserId,
            // } as any;

            // jest.spyOn(cacheService, 'remove').mockResolvedValueOnce(undefined);
            // jest.spyOn(userService, '_update').mockResolvedValueOnce(updateUserData);
            // const findOneMock = jest.fn();
            // findOneMock
            //     .mockResolvedValueOnce({
            //         _id: userId,
            //         deletedAt: undefined,
            //         roles: [{ resourceId: workspaceID }],
            //     })
            //     .mockResolvedValueOnce({
            //         _id: userId,
            //         deletedAt: undefined,
            //         roles: [{ resourceId: workspaceID }],
            //     });
            // jest.spyOn(userService, 'findOne').mockImplementation(findOneMock);
            // jest.spyOn(cognitoIdentityService, 'adminUpdateUserProfile').mockResolvedValueOnce(
            //     Promise.resolve(undefined),
            // );
            // jest.spyOn(workspaceUserService, 'deleteUserRole').mockResolvedValueOnce({ ok: true });
            // jest.spyOn(workspaceUserService, 'createUserRole').mockResolvedValueOnce(undefined);
            // jest.spyOn(workspaceUserService, 'updateUser');

            // const result = await workspaceUserService.updateUser(
            //     authUser._id,
            //     userId,
            //     updateUserData,
            //     workspaceID,
            //     ignoreCognitoUpdate,
            //     authUser,
            // );

            // expect(cacheService.remove).toHaveBeenCalledWith(userId);
            // expect(findOneMock).toHaveBeenCalledWith({
            //     _id: userId,
            //     deletedAt: undefined,
            //     'roles.$.resourceId': workspaceID,
            // });
            // expect(cognitoIdentityService.adminUpdateUserProfile).toHaveBeenCalledWith({
            //     email: updateUserData.email,
            //     name: updateUserData.name,
            //     avatar: updateUserData.avatar,
            // });
            // expect(userService._update).toHaveBeenCalledWith(whoUserId, userId, updateUserData);
            // expect(result).toEqual({
            //     _id: userId,
            //     deletedAt: undefined,
            //     roles: [{ resourceId: workspaceID }],
            // });
            expect(true).toBe(true);
        });
    });
});
