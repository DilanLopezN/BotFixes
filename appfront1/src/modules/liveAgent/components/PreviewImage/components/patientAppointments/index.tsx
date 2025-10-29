import React, { FC, useEffect, useState } from 'react';
import CardAppointment from '../cardAppointment';
import { ManagerService } from '../modalIntegration/integration.service';
import { PatientAppointmentsProps } from './props';
import { Content, AppointmentsArea, Loading, ReloadAppointments } from './styled';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { Icon } from '../../../../../../ui-kissbot-v2/common';

const PatientAppointments: FC<PatientAppointmentsProps & I18nProps> = ({
    patient,
    addNotification,
    conversationId,
    attachmentId,
    getTranslation,
    cropping,
    imageTypeSelected,
    workspaceId,
}) => {
    const [patientAppointments, setPatientAppointments] = useState<any[]>([]);
    const [fetching, setFetching] = useState(false);

    useEffect(() => {
        if (!!patient) {
            getPatientAppointments();
        }
    }, [patient]);

    const getPatientAppointments = async () => {
        setFetching(true);
        try {
            const response = await ManagerService.getPatientAppointments(workspaceId, { patientId: patient?.id });
            if (response.data) {
                const { data } = response;
                setFetching(false);
                setPatientAppointments(data);
            }
        } catch (error) {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (!patient) {
            setFetching(false);
        }
    }, [patient]);

    return !!patient ? (
        <Content>
            <h6>{getTranslation('Appointments')}</h6>

            <AppointmentsArea>
                {!fetching ? (
                    patientAppointments.length > 0 ? (
                        <>
                            {patientAppointments.map((appointment) => (
                                <CardAppointment
                                    imageTypeSelected={imageTypeSelected}
                                    cropping={cropping}
                                    attachmentId={attachmentId}
                                    conversationId={conversationId}
                                    addNotification={addNotification}
                                    appointment={appointment}
                                    key={appointment.handle}
                                    workspaceId={workspaceId}
                                />
                            ))}
                        </>
                    ) : (
                        <ReloadAppointments>
                            {getTranslation('Nothing')}
                            {patient && <Icon name='refresh' onClick={getPatientAppointments} />}
                        </ReloadAppointments>
                    )
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
                        <Loading src={'/assets/img/loading.gif'} />
                    </div>
                )}
            </AppointmentsArea>
        </Content>
    ) : null;
};

export default i18n(PatientAppointments) as FC<PatientAppointmentsProps>;
