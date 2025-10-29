import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { castObjectIdToString } from '../../../../common/utils/utils';
import { UsersService } from '../../../../modules/users/services/users.service';

@Injectable()
export class ExternalDataService {
    private _usersService: UsersService;

    constructor(private readonly moduleRef: ModuleRef) {}

    private get usersService(): UsersService {
        if (!this._usersService) {
            this._usersService = this.moduleRef.get<UsersService>(UsersService, { strict: false });
        }
        return this._usersService;
    }

    async getUsersByIds(userIds: string[]) {
        const result = await this.usersService.getUsersByIds(userIds);

        return result?.map((user) => ({ _id: castObjectIdToString(user._id), name: user.name }));
    }
}
