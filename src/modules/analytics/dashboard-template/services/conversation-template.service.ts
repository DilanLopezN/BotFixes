import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { CatchError, Exceptions } from './../../../auth/exceptions';
import { ConversationTemplate } from '../interfaces/conversation-template.interface';
import { CreateConversationTemplateData } from '../interfaces/create-conversation-template-data.interface';
import { TemplateGroupService } from './template-group.service';
import { isAnySystemAdmin } from '../../../../common/utils/roles';
import { User } from '../../../../modules/users/interfaces/user.interface';

@Injectable()
export class ConversationTemplateService {
    constructor(
        @InjectModel('ConversationTemplate') protected readonly model: Model<ConversationTemplate>,
        private readonly templateGroupService: TemplateGroupService,
    ) {}

    @CatchError()
    async findOneById(templateId: string) {
        return await this.model.findById(templateId);
    }

    @CatchError()
    async create(data: CreateConversationTemplateData | CreateConversationTemplateData[]) {
        return await this.model.insertMany(data);
    }

    @CatchError()
    async listByWorkspaceId(workspaceId: string, groupId: string, user: User) {
        const group = await this.templateGroupService.getById(groupId);

        if (!group.shared && group.ownerId != user._id && !isAnySystemAdmin(user)) {
            throw Exceptions.ONLY_CAN_LIST_TEMPLATE_GROUP_OWNER;
        }
        return await this.model.find({
            workspaceId,
            groupId,
        });
    }

    @CatchError()
    async update(conversationTemplate: CreateConversationTemplateData, templateId: string, user: User) {
        const group = await this.templateGroupService.getById(conversationTemplate.groupId);

        if (!group.globalEditable && group.ownerId != user._id && !isAnySystemAdmin(user)) {
            throw Exceptions.ONLY_CAN_UPDATE_DASHBOARD_OWNER;
        }
        return await this.model.updateOne({ _id: templateId }, conversationTemplate);
    }

    @CatchError()
    async deleteConversationTemplate(templateId: string) {
        return await this.model.deleteOne({ _id: new Types.ObjectId(templateId) });
    }

    @CatchError()
    async find(filter: FilterQuery<CreateConversationTemplateData>): Promise<CreateConversationTemplateData[]> {
        return this.model.find(filter).exec();
    }
}
