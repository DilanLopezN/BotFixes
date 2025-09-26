import { FC } from 'react';
import { ContactCardProps } from './props';
import { Wrapper, UserAvatar } from '../../../../ui-kissbot-v2/common';
import { ColorType, getColor, ColorVariation } from '../../../../ui-kissbot-v2/theme';
import I18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Card, LockIcon } from './styled';

const ContactCard: FC<ContactCardProps & I18nProps> = ({ contact, setContactSelected, contactSelected, getTranslation }) => {
    return (
        <Card
            style={contactSelected && contact.refId === contactSelected._id ? { background: '#e9ebeb' } : {}}
            onClick={() => {
                setContactSelected(contact);
            }}
        >
            <Wrapper padding='8px 0 8px 8px'>
                <UserAvatar user={{ name: contact.name }} size={45} hashColor={contact.refId} />
            </Wrapper>
            {
                contact?.blockedAt && (
                    <LockIcon title={getTranslation('Blocked contact')} />
                )
            }

            <Wrapper flex minWidth='80px' padding='8px 8px 8px 0' borderBottom='1px solid #F0F0F0'>
                <Wrapper flex margin='0 0 0 8px'>
                    <Wrapper flex flexBox>
                        <Wrapper
                            color='#484848'
                            truncate
                            fontSize='15px'
                            fontWeight={getColor(ColorType.text, ColorVariation.dark)}
                        >
                            {contact?.name ?? '--'}
                        </Wrapper>
                    </Wrapper>
                </Wrapper>

                <Wrapper flexBox justifyContent='space-between'>
                    <Wrapper margin='6px 0 6px 12px' color='#777' fontSize='12px'>
                        +{contact?.ddi ? contact.ddi : ''}{contact?.phone}
                    </Wrapper>
                </Wrapper>
            </Wrapper>
        </Card>
    );
};

export default I18n(ContactCard) as FC<ContactCardProps>;
