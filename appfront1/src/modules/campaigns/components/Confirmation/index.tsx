import { FC } from 'react';
import { ConfirmationProps } from './props';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import i18n from '../../../i18n/components/i18n';
import ConfirmationSettingList from './components/ConfimationSettingList';

const Confirmation: FC<ConfirmationProps & I18nProps> = (props) => {
    const { getTranslation, loggedUser, selectedWorkspace } = props;

    return (
        <>
            <ConfirmationSettingList selectedWorkspace={selectedWorkspace} loggedUser={loggedUser} />
        </>
    );
};

export default i18n(Confirmation);
