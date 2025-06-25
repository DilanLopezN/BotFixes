import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CatchError, Exceptions } from './../../../auth/exceptions';
import { CreateTemplateGroupInterface } from '../interfaces/create-template-group.interface';
import { TemplateGroup } from '../interfaces/template-group.interface';
import { UpdateTemplateGroupInterface } from '../interfaces/update-template-group.interface';
import { isAnySystemAdmin } from '../../../../common/utils/roles';
import { User } from '../../../../modules/users/interfaces/user.interface';

@Injectable()
export class TemplateGroupService {
    constructor(@InjectModel('TemplateGroup') protected readonly model: Model<TemplateGroup>) {}

    @CatchError()
    async create(data: CreateTemplateGroupInterface | CreateTemplateGroupInterface[]) {
        return await this.model.insertMany(data);
    }

    @CatchError()
    async update(data: UpdateTemplateGroupInterface, user: User) {
        const group = await this.getById(data.id);
        if (!group.globalEditable && group.ownerId != user._id && !isAnySystemAdmin(user)) {
            throw Exceptions.ONLY_CAN_UPDATE_TEMPLATE_GROUP_OWNER;
        }
        return await this.model.updateOne(
            {
                _id: data.id,
            },
            {
                shared: data.shared,
                globalEditable: data.globalEditable,
                name: data.name,
            },
        );
    }

    @CatchError()
    async listByWorkspace(workspaceId: string, user: User) {
        let query: any = {
            workspaceId,
        };
        if (!isAnySystemAdmin(user)) {
            query = {
                ...query,
                $or: [{ ownerId: { $eq: user._id } }, { shared: { $eq: true } }],
            };
        }
        return await this.model.find(query);
    }

    @CatchError()
    async getById(id: string) {
        return await this.model.findOne({
            _id: id,
        });
    }

    @CatchError()
    async deleteTemplateGroupById(id: string) {
        return await this.model.deleteOne({ _id: new Types.ObjectId(id) });
    }
}
