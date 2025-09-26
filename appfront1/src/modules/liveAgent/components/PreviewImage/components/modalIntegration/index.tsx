import jwt_decode from 'jwt-decode';
import moment from 'moment';
import { FC, useState } from 'react';
import Cookies from 'universal-cookie';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import FileType from '../fileType';
import IntegrationForm, { MANAGER_TOKEN } from '../integrationForm';
import PatientAppointments from '../patientAppointments';
import PatientInfo from '../patientInfo';
import { ModalIntegrationProps } from './props';
import { Content, Who } from './styled';

const cookies = new Cookies();

export interface IntegrationPatient {
    name: string;
    cpf: string;
    email: string;
    id: string;
    bornDate: string;
}

export interface ImageTypeSelected {
    code: number;
    name: string;
}

const ModalIntegration: FC<ModalIntegrationProps & I18nProps> = ({
    getTranslation,
    conversation,
    addNotification,
    attachmentId,
    cropping,
    workspaceId,
}) => {
    const getDefaultValue = () => {
        const data = cookies.get(MANAGER_TOKEN);

        if (typeof data === 'string') {
            return data;
        }
    };

    const [authenticated, setAuthenticated] = useState(!!getDefaultValue());
    const [patientToken, setPatientToken] = useState<string | undefined>(undefined);
    const [patient, setPatient] = useState<IntegrationPatient | undefined>(undefined);
    const [imageTypeSelected, setImageTypeSelected] = useState<ImageTypeSelected>({ name: '', code: -1 });

    const exit = () => {
        setAuthenticated(false);
        cookies.remove(MANAGER_TOKEN);
    };

    const who = () => {
        const value = getDefaultValue();
        if (!value) {
            return;
        }

        try {
            const decoded: any = jwt_decode(value);
            if (!decoded) {
                setAuthenticated(false);
                cookies.remove(MANAGER_TOKEN);
            }

            const expires = moment();
            expires.add(2, 'hours');
            cookies.set(MANAGER_TOKEN, value, {
                expires: expires.toDate(),
            });

            return decoded?.name;
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Content>
            {!authenticated ? (
                <IntegrationForm
                    addNotification={addNotification}
                    onAuthenticated={() => setAuthenticated(true)}
                    workspaceId={workspaceId}
                />
            ) : (
                <Who>
                    <span style={{ fontWeight: 600 }}>{`${who()} `}</span>
                    <span onClick={exit}>{getTranslation('Exit')}</span>
                </Who>
            )}

            {authenticated && (
                <PatientInfo
                    patient={patient}
                    authenticated={!!authenticated}
                    onPatientTokenFetched={setPatientToken}
                    resetPatient={() => {
                        setPatient(undefined);
                        setPatientToken(undefined);
                    }}
                    attributes={conversation.attributes}
                    patientToken={patientToken}
                    onPatientFetched={setPatient}
                    addNotification={addNotification}
                    workspaceId={workspaceId}
                />
            )}

            {authenticated && patient && (
                <FileType
                    onChange={(type) => {
                        setImageTypeSelected(type);
                    }}
                    imageTypeSelected={imageTypeSelected.code}
                    addNotification={addNotification}
                    workspaceId={workspaceId}
                />
            )}

            {authenticated && (
                <PatientAppointments
                    addNotification={addNotification}
                    patient={patient}
                    imageTypeSelected={imageTypeSelected}
                    cropping={cropping}
                    attachmentId={attachmentId}
                    conversationId={conversation._id}
                    workspaceId={workspaceId}
                />
            )}
        </Content>
    );
};

export default i18n(ModalIntegration) as FC<ModalIntegrationProps>;
