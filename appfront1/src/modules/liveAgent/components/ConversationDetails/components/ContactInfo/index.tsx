import { FC, useState } from 'react';
import { Wrapper, UserAvatar } from '../../../../../../ui-kissbot-v2/common';
import { ContactInfoProps } from './props';
import ContactEdit from '../ContactEdit';
import I18n from '../../../../../i18n/components/i18n';
import EmptyContact from '../EmptyContact';
import './style.scss';
import ContactHistoryItems from '../ContactHistoryItems';
import BlockedContact from '../../../BlockedContact';

const ContactInfo: FC<ContactInfoProps> = ({
    contact,
    getTranslation,
    workspaceId,
    conversation,
    onOpenConversation,
    updateContact,
    conversationDisabled,
}) => {
    const [editing, setEdit] = useState(false);

    if (contact?.ddi && contact?.phone?.startsWith(contact.ddi)) {
        contact.phone = contact.phone.slice(contact.ddi.length);
    }

    return contact?._id ? (
        <Wrapper
            width='100%'
            height='100%'
            padding='10px'
            className='ContactInfo'
            overflowY='auto'
            overflowX='hidden'
            flexBox
            column
        >
            {!editing ? (
                <Wrapper>
                    <Wrapper position='relative' margin='0 0 10px 0'>
                        <Wrapper flexBox justifyContent='center' margin='10px 0'>
                            <UserAvatar hashColor={contact._id} user={contact} size={40} />
                        </Wrapper>
                        <div
                            style={{
                                wordWrap: 'break-word',
                                fontSize: '16px',
                                margin: '3px 0',
                                justifyContent: 'center',
                                display: 'flex',
                            }}
                        >
                            <b>{contact.name}</b>
                        </div>
                        {contact.phone ? (
                            <Wrapper flexBox fontSize='13px' color='#777' justifyContent='center'>
                                {`+${contact?.ddi ? contact.ddi + contact.phone : '' + contact.phone}`}
                            </Wrapper>
                        ) : null}
                        {contact.email ? (
                            <Wrapper flexBox fontSize='13px' color='#777' justifyContent='center'>
                                {contact.email}
                            </Wrapper>
                        ) : null}
                        {!conversationDisabled && (
                            <>
                                <Wrapper right='10px' top='0' position='absolute'>
                                    <span
                                        title={getTranslation('Edit')}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEdit(true);
                                        }}
                                        style={{ color: '#666', cursor: 'pointer' }}
                                        className='mdi mdi-12px mdi-pencil edit-tag'
                                    />
                                </Wrapper>
                                <BlockedContact
                                    updateContact={updateContact}
                                    contact={contact}
                                    workspaceId={workspaceId}
                                />
                            </>
                        )}
                    </Wrapper>
                    <Wrapper borderTop='1px #dcdcdc solid' margin='0 25px' />
                    <Wrapper flexBox margin='8px 0 0 0' justifyContent='center' color='#777' fontSize='14px'>
                        {getTranslation('Historic')}
                    </Wrapper>
                    <Wrapper margin='12px 0 0 0'>
                        <ContactHistoryItems
                            contact={contact}
                            conversation={conversation}
                            onSelectConversation={onOpenConversation}
                            workspaceId={workspaceId}
                            getTranslation={getTranslation}
                        />
                    </Wrapper>
                </Wrapper>
            ) : (
                <ContactEdit
                    onCreate={(contact) => {
                        setEdit(false);
                        updateContact(contact);
                    }}
                    onCancel={() => !conversationDisabled && setEdit(false)}
                    workspaceId={workspaceId}
                    contact={contact}
                />
            )}
        </Wrapper>
    ) : (
        <EmptyContact />
    );
};

export default I18n(ContactInfo);
