import { FC, useEffect, useState } from 'react';
import { Input } from 'antd';
import isEmpty from 'lodash/isEmpty';
import { PrimaryButton } from '../../../../../../ui-kissbot-v2/common';
import { ManagerService } from '../modalIntegration/integration.service';
import { PatientInfoProps } from './props';
import { Content, Actions, PatientDetails, SwitchIcon, Loading } from './styled';
import moment from 'moment';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

const PatientInfo: FC<PatientInfoProps & I18nProps> = ({
    patient,
    onPatientFetched,
    attributes,
    resetPatient,
    patientToken,
    onPatientTokenFetched,
    authenticated,
    getTranslation,
    addNotification,
    workspaceId,
}) => {
    const [form, setForm] = useState({
        bornDate: '',
        cpf: '',
    });
    const [fetchingPatient, setFetchingPatient] = useState(true);

    useEffect(() => {
        if (authenticated) {
            validateAttributes();
        }
    }, [authenticated]);

    const validateAttributes = () => {
        let cpf: string = '';
        let bornDate: string = '';

        (attributes ?? []).forEach((attribute) => {
            if (attribute.type === '@sys.cpf') {
                cpf = attribute.value;
            } else if (attribute.type === '@sys.date') {
                bornDate = attribute.value;
            }
        });

        if (!isEmpty(cpf) && !isEmpty(bornDate)) {
            setForm({ cpf, bornDate });
            authenticatePatient(cpf, bornDate);
        } else {
            setFetchingPatient(false);
        }
    };

    const searchPatient = () => {
        if (isEmpty(form.bornDate) || isEmpty(form.cpf)) {
            return;
        }

        setFetchingPatient(true);
        authenticatePatient(form.cpf, form.bornDate);
    };

    const handleChangeForm = (field: string, value: any) => {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    useEffect(() => {
        if (!!patientToken && patientToken !== '') {
            getPatient();
        }
    }, [patientToken]);

    const authenticatePatient = async (cpf: string, bornDate: string) => {
        try {
            const response = await ManagerService.authPatient(workspaceId, { cpf, bornDate });

            if (response.data) {
                onPatientTokenFetched(response.data.token);
            }
        } catch (error) {
            setFetchingPatient(false);

            if (!!error?.response?.data) {
                if (error.response.data?.error === 'UNAUTHORIZED') {
                    return addNotification({
                        title: getTranslation('Error'),
                        message: getTranslation('User not registered'),
                        type: 'warning',
                        duration: 4000,
                    });
                }

                // Parece ridiculo, mas a api do cliente tem 2 tipos de erro: UNAUTHORIZED e Unauthorized
                if (error.response.data?.error === 'Unauthorized') {
                    return addNotification({
                        title: getTranslation('Error'),
                        message: getTranslation('Authentication error, try log in again'),
                        type: 'warning',
                        duration: 4000,
                    });
                }

                if (error.response.data?.error === 'NOT_FOUND') {
                    return addNotification({
                        title: getTranslation('Error'),
                        message: getTranslation('CPF or birthdate invalid'),
                        type: 'warning',
                        duration: 4000,
                    });
                }

                return addNotification({
                    title: getTranslation('Error'),
                    message: error.response.data.message,
                    type: 'warning',
                    duration: 4000,
                });
            }

            addNotification({
                title: getTranslation('Error'),
                message: getTranslation('An error has occurred. Try again'),
                type: 'warning',
                duration: 4000,
            });
        }
    };

    const getPatient = async () => {
        try {
            const response = await ManagerService.getPatient(workspaceId, { token: patientToken });
            if (response.data) {
                const { data } = response;
                setFetchingPatient(false);
                onPatientFetched({
                    name: data.nome,
                    cpf: data.cpf,
                    email: data.email,
                    bornDate: data.dataNascimento,
                    id: data.handle,
                });
            }
        } catch (error) {
            setFetchingPatient(false);
        }
    };

    return (
        <Content>
            {fetchingPatient ? (
                <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                    <Loading src={'/assets/img/loading.gif'} />
                </div>
            ) : !patient ? (
                <>
                    <p>{getTranslation('Find patient')}</p>
                    <Input
                        placeholder='CPF'
                        value={form.cpf}
                        autoFocus
                        onChange={(ev) => handleChangeForm('cpf', ev.target.value)}
                    />
                    <Input
                        style={{
                            margin: '6px 0 10px 0',
                        }}
                        placeholder={getTranslation('Born date')}
                        type='date'
                        value={form.bornDate}
                        onKeyPress={(event) => {
                            if (event.key === 'Enter') {
                                searchPatient();
                            }
                        }}
                        onChange={(ev) => handleChangeForm('bornDate', ev.target.value)}
                    />
                    <Actions>
                        <PrimaryButton onClick={searchPatient}>{getTranslation('Search')}</PrimaryButton>
                    </Actions>
                </>
            ) : (
                <PatientDetails>
                    <div>
                        <p>{patient.name}</p>
                        <p>{moment(patient.bornDate).format('DD/MM/YYYY')}</p>
                        <p>{patient.cpf?.replace('-', '')}</p>
                    </div>
                    <SwitchIcon onClick={resetPatient} title={getTranslation('Search another patient')} />
                </PatientDetails>
            )}
        </Content>
    );
};

export default i18n(PatientInfo) as FC<PatientInfoProps>;
