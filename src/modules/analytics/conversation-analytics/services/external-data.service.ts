import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { castObjectIdToString } from '../../../../common/utils/utils';
import { UsersService } from '../../../../modules/users/services/users.service';

@Injectable()
export class ExternalDataService {
    private usersService: UsersService;

    constructor(private readonly moduleRef: ModuleRef) {}

    async onApplicationBootstrap() {
        this.usersService = this.moduleRef.get<UsersService>(UsersService, { strict: false });
    }

    async getUsersByIds(userIds: string[]) {
        const result = await this.usersService.getUsersByIds(userIds);

        return result?.map((user) => ({ _id: castObjectIdToString(user._id), name: user.name }));
    }
}
