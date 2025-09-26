import { FC } from 'react';
import { BotdesignerContact } from 'kissbot-core';
import { UserAvatar, Wrapper } from '../../../../ui-kissbot-v2/common';
import { NameContainer, ContactInfo, ComercialAccountWrapper } from './styled';
import I18nWrapper from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';

interface ActivityContactProps {
    contact: BotdesignerContact;
}

const ActivityContact: FC<ActivityContactProps & I18nProps> = ({ getTranslation, contact }) => {
    if (!contact) {
        return (
            <Wrapper bgcolor='#cfe9ba' padding='10px 20px'>
                <Wrapper flexBox justifyContent='space-between' alignItems='center'>
                    <UserAvatar user={{ name: '?' }} />
                    <Wrapper margin='0 0 0 10px'>{getTranslation('Unable to display contact information')}</Wrapper>
                </Wrapper>
            </Wrapper>
        );
    }
    return (
        <Wrapper bgcolor='#cfe9ba' padding='10px'>
            <Wrapper flexBox justifyContent='space-between' alignItems='center'>
                <UserAvatar user={{ name: contact.name?.formatted_name }} />
                <Wrapper margin='0 0 0 10px'>
                    <NameContainer>{contact.name?.formatted_name}</NameContainer>
                    {!!contact.org?.company ? (
                        <ComercialAccountWrapper>{getTranslation('Comercial account')}</ComercialAccountWrapper>
                    ) : null}
                    {!!contact.phones?.[0]?.phone ? <ContactInfo>{contact.phones[0]?.phone}</ContactInfo> : null}
                    {!!contact.emails?.[0]?.email ? <ContactInfo>{contact.emails[0]?.email}</ContactInfo> : null}
                </Wrapper>
            </Wrapper>
        </Wrapper>
    );
};

export default I18nWrapper(ActivityContact) as FC<ActivityContactProps>;
