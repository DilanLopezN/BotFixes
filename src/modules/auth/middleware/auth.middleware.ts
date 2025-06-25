import * as jwt from 'jsonwebtoken';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtPayload } from '../jwt-payload.interface';
import { AuthService } from '../auth.service';
import { Exceptions } from '../exceptions';
import { CreateSSOUserData, User } from './../../users/interfaces/user.interface';
import { KissbotRequest } from '../../../common/interfaces/interfaces';
import * as jwkToPem from 'jwk-to-pem';

export const validateJwt = (token, jwks): JwtPayload => {
    const decoded = jwt.decode(token, {
        json: true,
        complete: true,
    });

    const jwk = JSON.parse(jwks)?.keys.find((k) => k.kid === decoded.header.kid);
    if (!jwk) throw 'invalid token';

    var pem = jwkToPem(jwk as any);

    return jwt.verify(token, pem) as JwtPayload;
};

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    jwks: any = process.env.COGNITO_AUTHORIZATION_JWK;
    constructor(private authService: AuthService) {}

    async use(req: KissbotRequest, res: Response, next: (...params) => any) {
        const request = req;
        const bearerHeader = request.headers['authorization'];

        if (bearerHeader) {
            const headerContent = bearerHeader.split(' ');
            const bearerToken = headerContent[0];
            const token = headerContent[1];
            if (!token || bearerToken != 'Bearer') {
                throw Exceptions.INVALID_TOKEN;
            }

            if (token == process.env.API_TOKEN) {
                req.user = {
                    roles: [
                        {
                            resource: 'ANY',
                            resourceId: null,
                            role: 'SYSTEM_ADMIN',
                        },
                    ],
                    name: 'API_USER',
                    email: 'api@botdesigner.io',
                } as User;
                next();
                return;
            }

            let userFromToken: JwtPayload;

            try {
                userFromToken = validateJwt(token, this.jwks);
            } catch (e) {
                throw Exceptions.INVALID_TOKEN;
            }

            try {
                let user: User;

                user = await this.authService.findOneUserByEmailAndCognitoUniqueId(
                    userFromToken.email,
                    userFromToken.sub,
                );
                //Se o usuario não existe é login via sso(saml)
                if (!user) {
                    const cognitoGroup = userFromToken['cognito:groups']?.[0];
                    // Se o token não tem grupo então é de login com senha
                    // Logo não pode criar usuario assim, usuário só pode ser criado via login sso
                    if (!cognitoGroup) {
                        throw Exceptions.USER_CANNOT_SIGNIN_WITH_SSO;
                    }
                    const newUser: CreateSSOUserData = {
                        name: userFromToken.name || userFromToken.given_name,
                        email: userFromToken.email,
                        avatar: userFromToken.picture,
                        cognitoUniqueId: userFromToken.sub,
                    };
                    user = (await this.authService.createSsoUser(newUser, cognitoGroup)) as any;
                }

                if (user.cognitoUniqueId !== userFromToken.sub) {
                    throw Exceptions.USER_CANNOT_SIGNIN_IDP;
                }

                if (typeof user != 'object') {
                    throw Exceptions.USER_NOT_FOUND;
                }

                req.user = user;
                next();
            } catch (error) {
                throw error;
            }
            return;
        }
        next();
    }
}
