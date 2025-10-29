import { Avatar, Popover, Space } from 'antd';
import { capitalizeText } from '~/utils/capitalize-text';
import { avatarBackgroundColorList } from './constants';
import type { AvatarListProps } from './interfaces';
import { AvatarListContainer, AvatarTootipContainer } from './styles';

export const AvatarList = ({ data, hiddenCount }: AvatarListProps) => {
  const hasHiddenCount = Boolean(hiddenCount);

  const tooltipContainer = (
    <AvatarTootipContainer direction='vertical'>
      {data.map((user, index) => {
        const backgroundColor = avatarBackgroundColorList[index % avatarBackgroundColorList.length];
        return (
          <Space key={user._id}>
            <Avatar
              src={user.avatar}
              style={{ backgroundColor: user.avatar ? undefined : backgroundColor }}
            >
              {user.name ? capitalizeText(user.name[0]) : ''}
            </Avatar>
            <span>{user.name}</span>
          </Space>
        );
      })}
      {hasHiddenCount && (
        <Space>
          <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>+{hiddenCount}</Avatar>
          <span>+{hiddenCount === 1 ? `${hiddenCount} usuário` : `${hiddenCount} usuários`}</span>
        </Space>
      )}
    </AvatarTootipContainer>
  );

  return (
    <Popover content={tooltipContainer}>
      <AvatarListContainer>
        <Avatar.Group>
          {data.map((user, index) => {
            const backgroundColor =
              avatarBackgroundColorList[index % avatarBackgroundColorList.length];
            return (
              <Avatar
                key={user._id}
                src={user.avatar}
                style={{ backgroundColor: user.avatar ? undefined : backgroundColor }}
              >
                {user.name ? capitalizeText(user.name[0]) : ''}
              </Avatar>
            );
          })}
          {hasHiddenCount && (
            <Avatar style={{ backgroundColor: '#fde3cf', color: '#f56a00' }}>+{hiddenCount}</Avatar>
          )}
        </Avatar.Group>
      </AvatarListContainer>
    </Popover>
  );
};
