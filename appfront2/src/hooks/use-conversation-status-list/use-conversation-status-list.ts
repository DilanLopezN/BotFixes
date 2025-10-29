import { ConversationStatus } from '~/constants/conversation-status';
import { getConversationStatusAttributesMap } from './constants';
import type { ConversationStatusList } from './interfaces';

export const useConversationStatusList = () => {
  const conversationStatusAttributesMap = getConversationStatusAttributesMap();

  const channelOptions = Object.values(ConversationStatus).reduce<ConversationStatusList>(
    (previousValue, currentValue) => {
      const attributes = conversationStatusAttributesMap[currentValue];

      if (!attributes.hasPermission) {
        return previousValue;
      }

      return previousValue.concat({ key: currentValue, name: attributes.label });
    },
    []
  );

  return channelOptions;
};
