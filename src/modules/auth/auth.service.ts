import { AuthApiTokenDto } from '../auth-api-token/dto/authApiToken.dto';
import * as jwt from 'jsonwebtoken';
import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { UsersService } from '../users/services/users.service';
import { JwtPayload } from './jwt-payload.interface';
import { ConfigService } from '../../config/config.service';
import { LoginDto } from './dtos/loginDto.dto';
import { PermissionResources, User, UserRoles } from '../users/interfaces/user.interface';
import { CatchError, Exceptions } from './exceptions';
import { TeamService } from '../team/services/team.service';
import { StreamUrlData } from 'kissbot-core';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../common/utils/roles';
import { castObjectIdToString } from '../../common/utils/utils';

@Injectable()
export class AuthService {
    constructor(
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        private config: ConfigService,
        private teamService: TeamService,
    ) {}

    async createToken(user: JwtPayload, expiresIn?: number) {
        return jwt.sign(
            {
                email: user.email,
                name: user.name,
                userId: user.userId,
            },
            this.config.envConfig.JWT_SECRET_KEY,
            {
                expiresIn: expiresIn ? `${expiresIn} days` : this.config.envConfig.JWT_EXPIRATION_TOKEN,
            },
        );
    }

    async findOneUserByEmailAndCognitoUniqueId(email: string, cognitoUniqueId: string): Promise<User> {
        return await this.usersService.findOneByEmailAndCognitoUniqueId(email, cognitoUniqueId);
    }

    async findOneUserByEmail(email: string): Promise<User> {
        return await this.usersService.findOneByEmail(email);
    }

    async validateUserById(id: string): Promise<User> {
        return await this.usersService.getOne(id);
    }

    async doLogin(loginDto: LoginDto) {
        if (loginDto.token) {
            return this.doTokenLogin(loginDto);
        }
        return this.doDefaultLogin(loginDto);
    }

    async doTokenLogin(loginDto: LoginDto) {
        const jwtPayload: JwtPayload = jwt.verify(loginDto.token, this.config.envConfig.JWT_SECRET_KEY) as JwtPayload;
        const user = await this.usersService.findOneByEmail(jwtPayload.email);
        if (!user) {
            throw Exceptions.USER_NOT_FOUND;
        }
        return await this.commomDispatchUser(user);
    }

    async doDefaultLogin(loginDto: LoginDto) {
        const login = { email: '', password: '' };
        Object.assign(login, loginDto);
        const user = await this.usersService.findOneByEmailAndPassword(login.email.toLowerCase(), login.password);
        if (!user) {
            throw Exceptions.INVALID_CREDENTIALS;
        }

        this.checkInactiveUser(user);

        return await this.commomDispatchUser(user);
    }

    private checkInactiveUser(user: User): void {
        const isUserInactive = user.roles.some(
            (role) => role.resource === PermissionResources.WORKSPACE && role.role === UserRoles.WORKSPACE_INACTIVE,
        );

        if (isUserInactive) {
            throw Exceptions.INACTIVE_USER;
        }
    }

    async commomDispatchUser(user: User, expiresIn?: number) {
        const userJwt: JwtPayload = {
            name: user.name,
            email: user.email,
            userId: user._id,
        } as JwtPayload;

        const prevUser = user?.toJSON?.({minimize: false}) ?? user;

        return {
            ...prevUser,
            language: user.language || 'en',
            token: await this.createToken(userJwt, expiresIn),
            streamUrl: await this.getStreamUrl(user),
            password: undefined,
        };
    }

    /**
     * Se é sysadmin pega todos os channels que são do workspace ou senão tiver workspaceId busca os que são channel config agent
     * Se é workspaceadmin pega todos os channels que são do workspace ou senão tiver workspaceId busca os que são channel config agent
     * Se não é nem sysadmin nem workspaceadmin pega os que são channelconfig agent
     * @param user
     * @param workspaceId
     */
    public async getStreamUrl(user: User, workspaceId?: string) {
        const streamUrl = process.env.CHAT_SOCKET_URI || 'http://localhost:3004';

        const workspaceAdmin = isWorkspaceAdmin(user, workspaceId);
        const anySystemAdmin = isAnySystemAdmin(user);

        const socketData: StreamUrlData = {
            rooms: [],
        };
        if (workspaceAdmin || anySystemAdmin) {
            socketData.rooms.push(workspaceId);
        }

        // Pega os times que o usuario participa em dado workspace
        const teams = await this.teamService.getTeamsByWorkspaceAndUser(workspaceId, castObjectIdToString(user._id));
        const teamsIds = teams.reduce((total, team) => {
            total.push(team._id);
            return total;
        }, []);

        // Pega os times que o usuario participa em dado workspace
        socketData.rooms = [...socketData.rooms, ...teamsIds];
        socketData.id = castObjectIdToString(user._id);

        const urlHash = await this.createStreamUrlHash(JSON.stringify(socketData));
        return { streamUrl: streamUrl + `?hash=${urlHash}` };
    }

    private async createStreamUrlHash(data: string) {
        return jwt.sign(data, this.config.envConfig.JWT_SECRET_KEY);
    }

    async genTokenRegister(user: User) {
        return await this.commomDispatchUser(user);
    }

    async doLoginApiToken(authApiTokenApiDto: AuthApiTokenDto) {
        const user: User = await this.usersService.findOneByEmail(authApiTokenApiDto.email);

        if (!!user) {
            return this.commomDispatchUser(user, authApiTokenApiDto.expiresIn);
        }
        return Exceptions.USER_NOT_FOUND;
    }

    @CatchError()
    createSsoUser(userData, cognitoGroup: string) {
        return this.usersService.createSsoUser(userData, cognitoGroup);
    }
}
