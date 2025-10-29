import { FC, useCallback, useEffect, useState } from 'react';
import { ContactInfoProps } from './props';
import { Wrapper, UserAvatar, PrimaryButton } from '../../../../ui-kissbot-v2/common';
import './style.scss';
import I18n from '../../../i18n/components/i18n';
import ContactHistoryItems from '../ConversationDetails/components/ContactHistoryItems';
import ChannelSelector from '../ChannelSelector';
import { Contact } from '../../interfaces/contact.interface';
import { ContactService } from '../../service/Contact.service';
import { SkeletonLines } from './skeleton-lines';
import BlockedContact from '../BlockedContact';
import { useContactContext } from '../../context/contact.context';

const ContactInfoSlide: FC<ContactInfoProps> = ({
    contactSelectedId,
    workspaceId,
    onSelectConversation,
    getTranslation,
    conversation,
    createNewConversation,
}) => {
    const { setContactSelected } = useContactContext();
    const [contact, setContact] = useState<Contact | undefined>(undefined);

    const getContact = useCallback(async () => {
        const contact = await ContactService.getContact(contactSelectedId, workspaceId);
        setContact(contact);
    }, [contactSelectedId, workspaceId]);

    useEffect(() => {
        getContact();
    }, [getContact]);

    const updateContactByConversation = (newContact) => {
        const existConversation = contact?.conversations?.find(
            (conversationId) => conversationId === conversation?._id
        );

        if (existConversation) {
            // seta contato atualizado se for o mesmo contato da conversa selecionada
            setContactSelected({ ...newContact });
        }
        setContact({ ...newContact });
    };

    if (contact?.ddi && contact?.phone?.startsWith(contact.ddi)) {
        contact.phone = contact.phone.slice(contact.ddi.length);
    }

    return (
        <Wrapper
            width='100%'
            height='calc(100% - 65px)'
            flexBox
            padding='15px'
            overflowY='auto'
            className='ContactInfoSlide'
            column
        >
            {contact ? (
                <>
                    <Wrapper position='relative' margin='0 10px 10px 10px' alignItems='center' flexBox>
                        <Wrapper>
                            <UserAvatar user={contact} size={50} />
                        </Wrapper>
                        <Wrapper margin='0 0 0 10px'>
                            <Wrapper margin='5px 0' color='#666' fontSize='1.15em' fontWeight='600'>
                                {contact?.name}
                            </Wrapper>
                            <Wrapper fontSize='13px' color='#777'>
                                +{contact?.ddi ? contact.ddi : ''}{contact?.phone}
                            </Wrapper>
                            <Wrapper fontSize='13px' color='#777'>
                                {contact?.email}
                            </Wrapper>
                        </Wrapper>
                        <BlockedContact
                            workspaceId={workspaceId}
                            contact={contact}
                            updateContact={(newContact) => {
                                updateContactByConversation(newContact);
                            }}
                            style={{ left: 'auto', right: 0 }}
                        />
                    </Wrapper>
                    <Wrapper flexBox justifyContent='flex-end' margin='7px 0 12px 0'>
                        <ChannelSelector
                            onChannelSelected={({ channelConfig, team }) => {
                                if (!team || !channelConfig) {
                                    return;
                                }

                                createNewConversation({
                                    channel: channelConfig,
                                    teamId: team._id,
                                    contactId: contactSelectedId,
                                });
                            }}
                            contactPhone={contact?.phone || null}
                            ddi={'55'}
                            workspaceId={workspaceId}
                        >
                            <PrimaryButton disabled={!!contact?.blockedAt}>
                                {getTranslation('New conversation')}
                            </PrimaryButton>
                        </ChannelSelector>
                    </Wrapper>
                    <Wrapper borderTop='1px #dcdcdc solid' margin='0 25px' />
                    {contact.conversations && contact?.conversations?.length > 0 ? (
                        <div>
                            <Wrapper textAlign='center' padding='10px 0 6px 0'>
                                {`${getTranslation('Historic')}`}
                            </Wrapper>
                            <ContactHistoryItems
                                contact={contact}
                                onSelectConversation={onSelectConversation}
                                workspaceId={workspaceId}
                                conversation={conversation}
                                getTranslation={getTranslation}
                            />
                        </div>
                    ) : (
                        <div style={{ fontSize: '14px', marginTop: '20px', textAlign: 'center' }}>
                            {getTranslation('No attendance so far')}
                        </div>
                    )}
                </>
            ) : (
                <SkeletonLines />
            )}
        </Wrapper>
    );
};

export default I18n(ContactInfoSlide);
