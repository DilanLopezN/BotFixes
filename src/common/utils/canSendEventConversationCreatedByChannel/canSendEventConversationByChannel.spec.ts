import { ChannelIdConfig } from 'kissbot-core';
import { Conversation } from 'kissbot-entities';
import { v4 } from 'uuid';
import { canSendEventConversationCreatedByChannel } from '.';

describe('canSendEventConversationCreatedByChannel', () => {
    it('valida se uma conversa criada através do canal (gupshup) pode enviar o evento socket', () => {
        const conversation: Conversation = {
            assignedToTeamId: undefined,
            createdByChannel: ChannelIdConfig.gupshup,
        } as any;

        const result = canSendEventConversationCreatedByChannel(conversation);

        expect(result).toBe(true);
    });

    it('valida se uma conversa criada através do canal (gupshup) e que esta assinada para um time pode enviar o evento socket', () => {
        const conversation: Conversation = {
            assignedToTeamId: v4(),
            createdByChannel: ChannelIdConfig.gupshup,
        } as any;

        const result = canSendEventConversationCreatedByChannel(conversation);

        expect(result).toBe(true);
    });

    it('valida se uma conversa criada através do canal (confirmation) pode enviar o evento socket', () => {
        const conversation: Conversation = {
            assignedToTeamId: undefined,
            createdByChannel: ChannelIdConfig.confirmation,
        } as any;

        const result = canSendEventConversationCreatedByChannel(conversation);

        expect(result).toBe(false);
    });

    it('valida se uma conversa criada através do canal (nps) pode enviar o evento socket', () => {
        const conversation: Conversation = {
            assignedToTeamId: undefined,
            createdByChannel: ChannelIdConfig.nps,
        } as any;

        const result = canSendEventConversationCreatedByChannel(conversation);

        expect(result).toBe(false);
    });

    it('valida se uma conversa criada através do canal (reminder) e que esta assinada para um time pode enviar o evento socket', () => {
        const conversation: Conversation = {
            assignedToTeamId: v4(),
            createdByChannel: ChannelIdConfig.reminder,
        } as any;

        const result = canSendEventConversationCreatedByChannel(conversation);

        expect(result).toBe(true);
    });
});
