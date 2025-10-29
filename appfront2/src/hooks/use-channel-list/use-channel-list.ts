import { ChannelIdConfig } from '~/constants/channel-id-config';
import { useAuth } from '../use-auth';
import { useSelectedWorkspace } from '../use-selected-workspace';
import { getChannelAttributesMap } from './constants';
import type { ChannelList } from './interfaces';

export const useChannelList = () => {
  const { user } = useAuth();
  const selectedWorkspace = useSelectedWorkspace();

  if (!user) {
    return [];
  }

  const channelAttributesMap = getChannelAttributesMap(selectedWorkspace, user);

  const channelOptions = Object.values(ChannelIdConfig).reduce<ChannelList>(
    (previousValue, currentValue) => {
      const attributes = channelAttributesMap[currentValue];

      if (!attributes.hasPermission) {
        return previousValue;
      }

      return previousValue.concat({ key: currentValue, name: attributes.label });
    },
    []
  );

  return channelOptions;
};
