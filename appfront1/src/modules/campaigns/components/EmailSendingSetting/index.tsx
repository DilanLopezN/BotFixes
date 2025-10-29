import { FC } from 'react';
import { EmailSendingSettingProps } from './props';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import EmailSendingSettingList from './components/EmailSendingSettingList';

const EmailSendingSetting: FC<EmailSendingSettingProps & I18nProps> = (props) => {
    const { getTranslation, loggedUser, selectedWorkspace } = props;

    return (
        <>
            <EmailSendingSettingList selectedWorkspace={selectedWorkspace} loggedUser={loggedUser} />
        </>
    );
};

export default i18n(EmailSendingSetting);
