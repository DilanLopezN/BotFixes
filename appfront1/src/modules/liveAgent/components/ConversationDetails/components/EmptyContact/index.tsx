import React, { FC } from 'react';
import { Wrapper, UserAvatar } from '../../../../../../ui-kissbot-v2/common';
import { CreateNewContactProps } from './props';
import I18n from '../../../../../i18n/components/i18n';

const EmptyContact: FC<CreateNewContactProps> = ({
  getTranslation,
}) => {

  return <Wrapper
    padding='10px'
  >
    <Wrapper
      margin='20px'
      flexBox
      justifyContent='center'>
      <UserAvatar user={{}} size={60} hashColor={`anonymous`} />
    </Wrapper>
    <Wrapper
      flexBox
      justifyContent='center'
      alignItems='center'
      margin='20px 0'>
      {`${getTranslation('This conversation did not generate a contact')}.`}
    </Wrapper>
  </Wrapper>
}

export default I18n(EmptyContact);