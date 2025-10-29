import { Dispatch, FC, SetStateAction } from 'react';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { HealthEntityType } from 'kissbot-core';
import { IntegrationsType } from '../../../../../../model/Integrations';
import { Button } from 'antd';
import { BsArrowLeft } from 'react-icons/bs';
import { useHistory } from 'react-router-dom';
import Header from '../../../../../../shared-v2/Header/Header';

interface ListHeaderProps {
    entityType: HealthEntityType;
    onNewEntityClick: () => any;
    integrationId?: string;
    syncEntity: () => void;
    setModalCreateEntities: Dispatch<SetStateAction<boolean>>;
    integrationType: string;
    integrationName?: string;
    children?: React.ReactNode;
}

const ListHeader = ({
    getTranslation,
    entityType,
    onNewEntityClick,
    integrationId,
    syncEntity,
    setModalCreateEntities,
    integrationType,
    integrationName,
}: ListHeaderProps & I18nProps) => {
    const history = useHistory();
    
    const getHeaderTitle = () => {
        switch (entityType) {
            case HealthEntityType.appointmentType:
                return getTranslation('Appointment types');
            case HealthEntityType.doctor:
                return getTranslation('Doctors');
            case HealthEntityType.insurance:
                return getTranslation('Insurances');
            case HealthEntityType.organizationUnit:
                return getTranslation('Organization units');
            case HealthEntityType.procedure:
                return getTranslation('Procedures');
            case HealthEntityType.insurancePlan:
                return getTranslation('Plans');
            case HealthEntityType.planCategory:
                return getTranslation('Categories');
            case HealthEntityType.speciality:
                return getTranslation('Specialities');
            case HealthEntityType.group:
                return getTranslation('Group');
            case HealthEntityType.insuranceSubPlan:
                return getTranslation('Subplans');
            case HealthEntityType.organizationUnitLocation:
                return getTranslation('Location');
            case HealthEntityType.occupationArea:
                return getTranslation('Occupation area');
            case HealthEntityType.typeOfService:
                return getTranslation('Tipo de serviço');
            case HealthEntityType.laterality:
                return getTranslation('Lateralidade');
            case HealthEntityType.reason:
                return getTranslation('Motivos não agendamento');
        }
    };

    return (
        <Header
            title={
                <div>
                    <div style={{ fontSize: '20px', fontWeight: 600 }}>
                        {getHeaderTitle()}
                    </div>
                    {integrationName && (
                        <div style={{ 
                            fontSize: '14px', 
                            color: '#666', 
                            fontWeight: 400, 
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <BsArrowLeft 
                                style={{ 
                                    cursor: 'pointer', 
                                    fontSize: '12px',
                                    color: '#1890ff'
                                }}
                                onClick={() => {
                                    history.push('/integrations');
                                }}
                            />
                            {integrationName}
                        </div>
                    )}
                </div>
            }
            action={
                <>
                    {!!integrationId && (
                        <>
                            {integrationType === IntegrationsType.CUSTOM_IMPORT && (
                                <Button
                                    type='primary'
                                    className='antd-span-default-color'
                                    onClick={() => setModalCreateEntities(true)}
                                    children={getTranslation('Create entities')}
                                />
                            )}
                            <Button
                                type='link'
                                title={getTranslation(
                                    'Changes made must be published to be updated in the online schedule'
                                )}
                                onClick={syncEntity}
                                className='antd-span-default-color'
                                children={getTranslation('Publish changes')}
                            />
                            <Button
                                type='primary'
                                children={getTranslation('New entity')}
                                className='antd-span-default-color'
                                onClick={onNewEntityClick}
                            />
                        </>
                    )}
                </>
            }
        />
    );
};

export default i18n(ListHeader) as FC<ListHeaderProps>;
