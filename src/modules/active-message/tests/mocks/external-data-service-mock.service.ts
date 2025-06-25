import { Injectable } from '@nestjs/common';
import { ConversationCloseType, IdentityType } from 'kissbot-core';
import * as mongoose from 'mongoose';
import { type } from 'os';
import { v4 } from 'uuid';

@Injectable()
export class ExternalDataServiceMock {
    static workspaceId = new mongoose.Types.ObjectId();

    //ContactData
    static contactId = '1';
    static contactPhone = '1';
    static contactName = 'contactName1';
    static templateContent = v4();
    static botId = v4();
    static phoneExistsConversation = v4();

    static bot = {
        name: ExternalDataServiceMock.botId,
        _id: ExternalDataServiceMock.botId,
    };

    static tagNameA = 'AA';
    static whatsappExpiration = 100;
    static privateData = {
        data: 'AAA',
    };

    static enableChannelConfigToken = '1';
    static notEnableChannelConfigToken = '2';

    static openedConversationPhoneNumber1 = '1';

    private channelConfigs = {
        // enabled
        '1': {
            enable: true,
            workspaceId: ExternalDataServiceMock.workspaceId,
            token: ExternalDataServiceMock.enableChannelConfigToken,
            botId: ExternalDataServiceMock.botId,
        },
        // not enabled
        '2': {
            enable: false,
            workspaceId: ExternalDataServiceMock.workspaceId,
            token: ExternalDataServiceMock.notEnableChannelConfigToken,
            botId: ExternalDataServiceMock.botId,
        },
    };

    static conversations = {
        //opened conversation
        '1': {
            state: 'open',
            _id: new mongoose.Types.ObjectId(),
            workspace: {
                _id: ExternalDataServiceMock.workspaceId,
            },
            members: [],
            activities: [],
            attributes: [],
        },
        '2': {
            state: 'open',
            _id: new mongoose.Types.ObjectId(),
            workspace: {
                _id: ExternalDataServiceMock.workspaceId,
            },
            members: [],
            activities: [],
            attributes: [],
        },
        '3': {
            state: 'open',
            _id: new mongoose.Types.ObjectId(),
            workspace: {
                _id: ExternalDataServiceMock.workspaceId,
            },
            members: [{ type: IdentityType.bot }, { type: IdentityType.user }],
            activities: [],
            attributes: [],
        },
        '4': {
            state: 'open',
            _id: new mongoose.Types.ObjectId(),
            workspace: {
                _id: ExternalDataServiceMock.workspaceId,
            },
            members: [{ type: IdentityType.bot }, { type: IdentityType.user }],
            activities: [],
            attributes: [],
        },
        '6': {
            state: 'open',
            _id: new mongoose.Types.ObjectId(),
            workspace: {
                _id: ExternalDataServiceMock.workspaceId,
            },
            members: [{ type: IdentityType.bot }, { type: IdentityType.user }, { type: IdentityType.agent, name: IdentityType.agent }],
            activities: [],
            attributes: [],
        },
        '7': {
            state: 'open',
            _id: new mongoose.Types.ObjectId(),
            workspace: {
                _id: ExternalDataServiceMock.workspaceId,
            },
            members: [{ type: IdentityType.bot }, { type: IdentityType.user }, { type: IdentityType.agent, name: IdentityType.agent }],
            activities: [],
            attributes: [{}],
        },
    };

    async getCanValidateLoggedInWrapperChannelConfig() {
        // const result = (await this.channelConfigService.getCanValidateLoggedInWrapperChannelConfig());
        // return result;
    }

    async getOneBtIdOrToken(channelConfigToken: string) {
        return this.channelConfigs[channelConfigToken];
    }

    async findOneContact(data) {
        return {
            _id: ExternalDataServiceMock.contactId,
            phone: ExternalDataServiceMock.contactPhone,
            name: ExternalDataServiceMock.contactName,
        };
        // const result = await this.conversationContactService.findOne(data);
        // return result;
    }

    async findOpenedConversationByMemberIdAndChannelId(parsedNumber: string, channelId: string, workspaceId: string) {
        if (parsedNumber == '1') {
            return ExternalDataServiceMock.conversations['1'];
        }
        if (parsedNumber == '2') {
            return ExternalDataServiceMock.conversations['2'];
        }
        if (parsedNumber == '3') {
            return ExternalDataServiceMock.conversations['3'];
        }
        if (parsedNumber == '4') {
            return ExternalDataServiceMock.conversations['4'];
        }
        if (parsedNumber == '6') {
            return ExternalDataServiceMock.conversations['6'];
        }
        if (parsedNumber == '7') {
            return ExternalDataServiceMock.conversations['7'];
        }
        return;
    }

    async getConversationByMemberIdListAndChannelConfig(parsedNumberList: string[], channelConfigToken: string) {
        const parsedNumber = parsedNumberList.find(number => (typeof number == 'string' || typeof number == 'number'))
        if (parsedNumber == '1') {
            return ExternalDataServiceMock.conversations['1'];
        }
        if (parsedNumber == '2') {
            return ExternalDataServiceMock.conversations['2'];
        }
        if (parsedNumber == '3') {
            return ExternalDataServiceMock.conversations['3'];
        }
        if (parsedNumber == '4') {
            return ExternalDataServiceMock.conversations['4'];
        }
        if (parsedNumber == '6') {
            return ExternalDataServiceMock.conversations['6'];
        }
        if (parsedNumber == '7') {
            return ExternalDataServiceMock.conversations['7'];
        }
        return;
    }

    getChannelConfigPrivateData(channelConfig) {
        return ExternalDataServiceMock.privateData;
    }

    async createConversation(conversationToSave) {
        const userMember = conversationToSave.members?.find((mem) => mem.type == IdentityType.user);
        if (userMember.id) {
            ExternalDataServiceMock.conversations[userMember.id] = {
                ...conversationToSave,
                state: 'open',
                _id: new mongoose.Types.ObjectId(),
                workspace: {
                    _id: ExternalDataServiceMock.workspaceId,
                },
                activities: [],
            };
        }
        return ExternalDataServiceMock.conversations[userMember.id];
    }

    async addAttributesToConversation(conversationId: string, attributes) {
        const conv = Object.values(ExternalDataServiceMock.conversations).find((conv) => {
            return conv._id.equals(conversationId);
        });
        if (conv) {
            conv.attributes = attributes;
        }
        // await this.conversationService.addAttributesToConversation(conversationId, attributes);
    }

    async addMember(conversationId: string, systemMember, sendActivity: boolean) {
        const conv = Object.values(ExternalDataServiceMock.conversations).find((conv) => {
            return conv._id.equals(conversationId);
        });
        if (conv) {
            conv.members.push(systemMember);
        }
        // await this.conversationService.addMember(conversationId, systemMember, sendActivity);
    }

    async dispatchMessageActivity(conversation, activity) {
        const conv = Object.values(ExternalDataServiceMock.conversations).find((conv) => {
            return conv._id.equals(conversation._id);
        });
        if (conv) {
            conv.activities.push(activity);
        }
    }

    async closeConversation(conversation, conversationId, systemMember, type: ConversationCloseType) {
        const conv = Object.values(ExternalDataServiceMock.conversations).find((conv) => {
            return conv._id.equals(conversation._id);
        });
        if (conv) {
            conv.state = 'closed';
        }
    }

    async hasOpenedConversationByPhoneNumberAndWorkspaceId(phoneNumber, workspaceId) {
        return phoneNumber == ExternalDataServiceMock.phoneExistsConversation
    }

    async findSessionByWorkspaceAndNumberAndChannelConfigId(workspaceId, parsedNumber, channelConfig) {
        return {
            whatsappExpiration: ExternalDataServiceMock.whatsappExpiration,
        };
    }

    async getOneBot(botId) {
        return ExternalDataServiceMock.bot;
    }

    async getParsedTemplate(data, values) {
        return ExternalDataServiceMock.templateContent;
    }

    async getTemplateVariableValues(data, values) {
        return values.map(val => val.value)
    }

    async getWorkspaceTags(workspaceId) {
        return [{ name: ExternalDataServiceMock.tagNameA }];
    }
}
