import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { omit } from 'lodash';
import { Model, Types } from 'mongoose';
import { UserHistory } from '../interfaces/user.history';
import { User } from '../interfaces/user.interface';

@Injectable()
export class UsersHistoryService {
    constructor(@InjectModel('UserHistory') protected readonly model: Model<UserHistory>) {}

    public getModel() {
        return this.model;
    }

    public async create(whoUserId: string, user: User) {
        const oldUser = omit(user?.toJSON?.({ minimize: false }) ?? user, ['updatedBy', 'createdAt', 'updatedAt']) as UserHistory;


        return await this.model.create({
            ...oldUser,
            userId: user._id,
            updatedByUserId: whoUserId,
            _id: new Types.ObjectId(),
        });
    }
}
