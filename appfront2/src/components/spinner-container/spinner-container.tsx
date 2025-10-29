import { Flex, Spin } from 'antd';
import type { SpinnerContainerProps } from './interfaces';
import { MessageText } from './styles';

export const SpinnerContainer = ({ message, height }: SpinnerContainerProps) => {
  return (
    <Flex
      flex={1}
      align='center'
      justify='center'
      vertical
      style={{ height: height || `30vh` }}
      gap={16}
    >
      <Spin />
      <MessageText>{message || 'Carregando...'}</MessageText>
    </Flex>
  );
};
