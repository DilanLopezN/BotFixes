import { Injectable } from '@nestjs/common';
import { CognitoIdentityServiceProvider } from 'aws-sdk';

interface UserAttributes {
    email: string;
    name: string;
    avatar: string;
}

@Injectable()
export class CognitoIdentityService {
    private cognitoIdentityService: CognitoIdentityServiceProvider;
    constructor() {
        this.cognitoIdentityService = new CognitoIdentityServiceProvider({
            region: process.env.AWS_WORKSPACE_BUCKET_REGION_NAME || 'sa-east-1',
        });
    }

    private getPoolParams() {
        return {
            poolId: process.env.COGNITO_POOL_ID,
            poolWebClientId: process.env.COGNITO_POOL_CLIENT_ID,
        };
    }

    private getUserAttributes({ email, name, avatar }: UserAttributes) {
        return [
            { Name: 'name', Value: name },
            { Name: 'email', Value: email },
            { Name: 'picture', Value: avatar ?? '' },
        ];
    }

    public adminGetUser(email: string) {
        return new Promise<CognitoIdentityServiceProvider.AdminGetUserResponse>((resolve, reject) =>
            this.cognitoIdentityService.adminGetUser(
                {
                    UserPoolId: this.getPoolParams().poolId,
                    Username: email,
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                },
            ),
        );
    }

    public adminCreateUser(data: UserAttributes, password: string) {
        return new Promise<CognitoIdentityServiceProvider.Types.AdminCreateUserResponse>((resolve, reject) =>
            this.cognitoIdentityService.adminCreateUser(
                {
                    UserPoolId: this.getPoolParams().poolId,
                    Username: data.email,
                    UserAttributes: this.getUserAttributes(data),
                    TemporaryPassword: password,
                    MessageAction: 'SUPPRESS',
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                },
            ),
        );
    }

    public adminSetUserPassword(email: string, password: string) {
        return new Promise<CognitoIdentityServiceProvider.Types.AdminSetUserPasswordResponse>((resolve, reject) =>
            this.cognitoIdentityService.adminSetUserPassword(
                {
                    Password: password,
                    Permanent: true,
                    Username: email,
                    UserPoolId: this.getPoolParams().poolId,
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                },
            ),
        );
    }
    public adminUpdateUserEmail(oldEmail: string, newEmail: string) {
        return new Promise<CognitoIdentityServiceProvider.AdminUpdateUserAttributesResponse>((resolve, reject) =>
            this.cognitoIdentityService.adminUpdateUserAttributes(
                {
                    UserPoolId: this.getPoolParams().poolId,
                    Username: oldEmail,
                    UserAttributes: [
                        { Name: 'email', Value: newEmail },
                        { Name: 'email_verified', Value: 'true' },
                    ],
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(data);
                    }
                },
            ),
        );
    }

    public userChangePassword(accessToken: string, oldPassword: string, newPassword: string) {
        return new Promise<CognitoIdentityServiceProvider.ChangePasswordResponse>((resolve, reject) =>
            this.cognitoIdentityService.changePassword(
                {
                    AccessToken: accessToken,
                    PreviousPassword: oldPassword,
                    ProposedPassword: newPassword,
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                },
            ),
        );
    }

    public userUpdateProfile(accessToken: string, data: UserAttributes) {
        return new Promise<CognitoIdentityServiceProvider.ChangePasswordResponse>((resolve, reject) =>
            this.cognitoIdentityService.updateUserAttributes(
                {
                    AccessToken: accessToken,
                    UserAttributes: this.getUserAttributes(data).filter((attr) => !!attr.Value),
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                },
            ),
        );
    }

    public adminUpdateUserProfile(data: UserAttributes) {
        return new Promise<CognitoIdentityServiceProvider.ChangePasswordResponse>((resolve, reject) =>
            this.cognitoIdentityService.adminUpdateUserAttributes(
                {
                    UserPoolId: this.getPoolParams().poolId,
                    Username: data.email,
                    UserAttributes: this.getUserAttributes(data).filter((attr) => !!attr.Value),
                },
                (err, data) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(data);
                },
            ),
        );
    }
}
