import { FC, useState } from 'react';
import { Wrapper, UserAvatar, PrimaryButton } from '../../../../../../ui-kissbot-v2/common';
import { CreateContactProps } from './props';
import CreateContactForm from './components/createContactForm';
import { ChannelIdConfig } from 'kissbot-core';
import I18n from '../../../../../i18n/components/i18n';
import { ColorType } from '../../../../../../ui-kissbot-v2/theme';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { ContactService } from '../../../../service/Contact.service';

const CreateContact: FC<CreateContactProps & I18nProps> = ({
    onClose,
    notification,
    getTranslation,
    workspaceId,
    onContactInfo,
    onContactSelected,
}) => {
    const [existContact, setExist] = useState<any>(undefined);
    const [creationContact, setContactCreation] = useState<any>(undefined);

    const onCreate = async (contact) => {
        try {
            const contactCreated = await ContactService.createContact(
                {
                    ...contact,
                    whatsapp: parseInt(contact.whatsapp, 10),
                    createdByChannel: ChannelIdConfig.liveagent,
                    phone: parseInt(contact.phone, 10),
                },
                workspaceId
            );
            setContactCreation(contact);

            if (contactCreated?._id) {
                notification({
                    title: getTranslation('Success'),
                    message: `${getTranslation('Contact create')}.`,
                    type: 'success',
                    duration: 3000,
                });
                return onContactSelected(contactCreated._id), onContactInfo();
            } else if (contactCreated && contactCreated.exist) {
                return setExist(contactCreated.exist);
            }
        } catch (error) {
            notification({
                title: getTranslation('Error'),
                message: `${getTranslation('An error has occurred. Try again')}.`,
                type: 'danger',
                duration: 3000,
            });
        }
    };

    const updateContact = async () => {
        const updated = await ContactService.updateContact(
            {
                ...creationContact,
                _id: existContact._id,
            },
            workspaceId
        );

        if (updated) {
            notification({
                title: getTranslation('Success'),
                message: `${getTranslation('Contact updated')}.`,
                type: 'success',
                duration: 3000,
            });
            return onClose();
        }

        notification({
            title: getTranslation('Error'),
            message: `${getTranslation('An error has occurred. Try again')}.`,
            type: 'danger',
            duration: 3000,
        });
    };

    return (
        <Wrapper flexBox padding='15px' height='100%' flexDirection='column'>
            {!existContact ? (
                <CreateContactForm
                    onContactInfo={onContactInfo}
                    onContactSelected={onContactSelected}
                    initial={creationContact}
                    onCreate={onCreate}
                    onClose={onClose}
                    workspaceId={workspaceId}
                    notification={notification}
                />
            ) : (
                <Wrapper>
                    <Wrapper margin='0 0 15px 0'>
                        <Wrapper flexBox justifyContent='center' margin='10px 0'>
                            <UserAvatar user={existContact} size={50} />
                        </Wrapper>
                        <Wrapper flexBox margin='2px 0' fontSize='15px' justifyContent='center'>
                            <b>{existContact && existContact.name}</b>
                        </Wrapper>
                        <Wrapper flexBox fontSize='13px' color='#777' justifyContent='center'>
                            {existContact && existContact.phone}
                        </Wrapper>
                        <Wrapper flexBox fontSize='13px' color='#777' justifyContent='center'>
                            {existContact && existContact.email}
                        </Wrapper>
                    </Wrapper>
                    <Wrapper textAlign='center' margin='25px 0'>
                        {getTranslation(
                            'A contact already exists with the data entered. Do you want to update with the information already entered?'
                        )}
                    </Wrapper>
                    <Wrapper margin='20px 0' justifyContent='space-between' flexBox>
                        <PrimaryButton colorType={ColorType.text} onClick={() => setExist(undefined)}>
                            {getTranslation('Back and edit')}
                        </PrimaryButton>
                        <PrimaryButton onClick={updateContact}>{getTranslation('Yes, update')}</PrimaryButton>
                    </Wrapper>
                </Wrapper>
            )}
        </Wrapper>
    );
};

export default I18n(CreateContact);
