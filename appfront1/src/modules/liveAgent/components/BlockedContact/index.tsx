import { CSSProperties, FC, useEffect, useState } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import I18n from '../../../i18n/components/i18n';
import { Popconfirm } from 'antd';
import { ContactService } from '../../service/Contact.service';
import { addNotification } from '../../../../utils/AddNotification';
import { dispatchSentryError } from '../../../../utils/Sentry';
import { isAnySystemAdmin, isWorkspaceAdmin } from '../../../../utils/UserPermission';
import HelpCenterLink from '../../../../shared/HelpCenterLink';
import { useSelector } from 'react-redux';
import { Contact } from '../../interfaces/contact.interface';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { LockClosedIcon, LockOpenIcon } from './styles';

export interface BlockedContactProps {
    contact: Contact;
    workspaceId: string;
    updateContact?: (contact: Contact) => void;
    style?: CSSProperties;
}
const BlockedContact: FC<BlockedContactProps & I18nProps> = ({
    contact,
    getTranslation,
    workspaceId,
    updateContact,
    style,
}) => {
    const { settings, loggedUser } = useSelector((state: any) => state.loginReducer);

    const [blocked, setBlocked] = useState(!!contact?.blockedAt);

    useEffect(() => {
        setBlocked(!!contact?.blockedAt);
    }, [contact?.blockedAt]);

    const isAdmin = isWorkspaceAdmin(loggedUser, workspaceId) || isAnySystemAdmin(loggedUser);

    const blockContact = async (block: boolean) => {
        if (!contact || !isAdmin) {
            return;
        }
        await ContactService.blockContact(workspaceId, contact._id)
            .then(() => {
                addNotification({
                    message: getTranslation(block ? 'Contact blocked successfully!' : 'Contact unlocked successfully!'),
                    type: 'success',
                    duration: 3000,
                    title: getTranslation('Success'),
                });
                const updatedContact = { ...contact, blockedAt: block ? 123 : undefined };

                setBlocked(block);

                updateContact?.(updatedContact);
            })
            .catch((err) => {
                dispatchSentryError(err);
                addNotification({
                    message: getTranslation('We get an error, try again'),
                    type: 'danger',
                    duration: 3000,
                    title: getTranslation('Error'),
                });
            });
    };

    const getTitlePopover = () => {
        return (
            <Wrapper flexBox flexDirection='column'>
                {getTranslation(
                    blocked
                        ? 'Are you sure you want to unblock this contact?'
                        : 'Are you sure you want to block this contact?'
                )}
                <HelpCenterLink
                    text={getTranslation('Click here for more details')}
                    textStyle={{ color: '#1890ff', textDecoration: 'underline' }}
                    article={settings?.helpCenter?.articles?.['bloqueio-de-contato']}
                />
            </Wrapper>
        );
    };

    return (
        <>
            {isAdmin && (
                <>
                    {blocked ? (
                        <Popconfirm
                            title={getTitlePopover()}
                            onConfirm={() => blockContact(false)}
                            okButtonProps={{ className: 'antd-span-default-color' }}
                            cancelText={getTranslation('Cancel')}
                        >
                            <LockClosedIcon style={style} title={getTranslation('Unblock contact')} />
                        </Popconfirm>
                    ) : (
                        <Popconfirm
                            title={getTitlePopover()}
                            onConfirm={() => blockContact(true)}
                            okButtonProps={{ className: 'antd-span-default-color' }}
                            cancelText={getTranslation('Cancel')}
                        >
                            <LockOpenIcon style={style} title={getTranslation('Block contact')} />
                        </Popconfirm>
                    )}
                </>
            )}
        </>
    );
};

export default I18n(BlockedContact) as FC<BlockedContactProps>;
