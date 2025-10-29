import { Col, Form, Input, notification, Radio, Row, Space, Switch } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { Formik } from 'formik';
import { FC, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { IntegrationPatientNameCase, IntegrationsType } from '../../../../../../model/Integrations';
import CardWrapperForm from '../../../../../../shared-v2/CardWrapperForm/CardWrapperForm';
import Header from '../../../../../../shared-v2/Header/Header';
import { isSystemAdmin, isSystemDevAdmin } from '../../../../../../utils/UserPermission';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { ScrollView } from '../../../../../newChannelConfig/components/ScrollView';
import { HealthIntegrationFormRulesProps } from './props';

const StyledSwitch = styled(Switch)`
    margin-right: 8px;
`;

const StyledInput = styled(Input)`
    margin-right: 8px;
`;
const HealthIntegrationFormRules: FC<HealthIntegrationFormRulesProps & I18nProps> = (props) => {
    const { getTranslation, integration, onIntegrationSaved, onClose } = props;
    const [isFormDirty, setIsFormDirty] = useState(false);
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const [jsonError] = useState<string>('');
    const [customConfigJSON, setCustomConfigJSON] = useState<string>('');
    const disableForm = !isSystemAdmin(loggedUser);

    const rolesJsonConfigIntegrationRules = () => {
        return isSystemAdmin(loggedUser) || isSystemDevAdmin(loggedUser);
    };

    const getObjIntegrationRules = (rulesObject: any) => {
        if (!rulesObject?.rules || typeof rulesObject.rules !== 'object') {
            return rulesObject;
        }
        return getObjIntegrationRules(rulesObject.rules);
    };

    const validateJsonIntegrationRules = (value: string) => {
        if (!value.trim()) {
            return true;
        }
    };

    useEffect(() => {
        if (!customConfigJSON && integration?.rules) {
            const rulesObject = getObjIntegrationRules(integration.rules);
            setCustomConfigJSON(JSON.stringify(rulesObject, null, 2));
        }
    }, [integration]);

    return (
        <Formik
            initialValues={integration}
            onSubmit={(values) => {
                if (customConfigJSON.trim()) {
                    try {
                        const customConfig = JSON.parse(customConfigJSON);
                        values.rules = customConfig;
                    } catch (error) {
                        notification.error({
                            message: getTranslation('Error'),
                            description: getTranslation(
                                'Error processing the JSON. Please review your JSON and try again'
                            ),
                        });
                        return;
                    }
                }
                onIntegrationSaved(values);
            }}
            render={(formProps) => {
                const { values, submitForm, setFieldValue } = formProps;
                const handleUpdateChange = (fieldName, checked) => {
                    setFieldValue(fieldName, checked);
                    setIsFormDirty(true);

                    if (!customConfigJSON) return;

                    const json = JSON.parse(customConfigJSON);
                    json[fieldName.replace('rules.', '')] = checked;
                    setCustomConfigJSON(JSON.stringify(json, null, 2));
                };

                const updatedSwitcheWithJson = (jsonString: string) => {
                    const parsedJSON = JSON.parse(jsonString);
                    Object.keys(parsedJSON).forEach((key) => {
                        const fieldName = `rules.${key}`;
                        setFieldValue(fieldName, parsedJSON[key]);
                    });
                };
                const changeJsonIntegrationRules = (event: any) => {
                    const value = event.target.value;
                    setCustomConfigJSON(value);
                    validateJsonIntegrationRules(value);
                    setIsFormDirty(true);

                    if (validateJsonIntegrationRules(value) && value.trim()) {
                        updatedSwitcheWithJson(value);
                    }
                };

                return (
                    <>
                        <Header
                            title={getTranslation('Edit integrations rules')}
                            buttonBack={{ visible: true, onClick: onClose }}
                            buttonSave={{
                                visible: true,
                                onClick: () => isFormDirty && submitForm(),
                                disable: !isFormDirty || !!jsonError,
                            }}
                        />

                        <ScrollView minWidth='900px'>
                            <CardWrapperForm
                                title={getTranslation('Integrations rules')}
                                childrenHeader
                                children={
                                    <Row>
                                        <Col span={12}>
                                            <Space direction={'vertical'}>
                                                {(integration.type === IntegrationsType.CM ||
                                                    integration.type === IntegrationsType.FEEGOW ||
                                                    integration.type === IntegrationsType.BOTDESIGNER ||
                                                    integration.type === IntegrationsType.CLINIC ||
                                                    integration.type === IntegrationsType.TDSA ||
                                                    integration.type === IntegrationsType.MANAGER) && (
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={!!values.rules?.runInterAppointment}
                                                            onChange={(checked) => {
                                                                handleUpdateChange(
                                                                    'rules.runInterAppointment',
                                                                    checked
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation('Apply interquery in the timetable listing')}
                                                    </Form.Item>
                                                )}
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.listOnlyDoctorsWithAvailableSchedules}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.listOnlyDoctorsWithAvailableSchedules',
                                                                !values.rules?.listOnlyDoctorsWithAvailableSchedules
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('List only doctors with available schedules')}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={
                                                            !!values.rules?.requiredTypeOfServiceOnCreateAppointment
                                                        }
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.requiredTypeOfServiceOnCreateAppointment',
                                                                !values.rules?.requiredTypeOfServiceOnCreateAppointment
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('Send type of service on schedule')}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.sendGuidanceOnCreateSchedule}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.sendGuidanceOnCreateSchedule',
                                                                !values.rules?.sendGuidanceOnCreateSchedule
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation(
                                                        'Send instructions to the patient after scheduling'
                                                    )}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.sendObservationOnListSchedules}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.sendObservationOnListSchedules',
                                                                !values.rules?.sendObservationOnListSchedules
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation(
                                                        'Enviar observação no resumo (confirmação) do agendamento'
                                                    )}
                                                </Form.Item>
                                                <>
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={
                                                                !!values.rules?.useProcedureWithoutSpecialityRelation
                                                            }
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.useProcedureWithoutSpecialityRelation',
                                                                    !values.rules?.useProcedureWithoutSpecialityRelation
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation('Use procedure without speciality relation')}
                                                    </Form.Item>
                                                </>
                                                <>
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={
                                                                !!values.rules
                                                                    ?.useOccupationAreaAsInterAppointmentValidation
                                                            }
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.useOccupationAreaAsInterAppointmentValidation',
                                                                    !values.rules
                                                                        ?.useOccupationAreaAsInterAppointmentValidation
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation(
                                                            'Usar área de atuação na validação de interconsulta'
                                                        )}
                                                    </Form.Item>
                                                </>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.useProcedureWithCompositeCode}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.useProcedureWithCompositeCode',
                                                                !values.rules?.useProcedureWithCompositeCode
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('Uses composite code in procedures')}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.doNotAllowSameDayScheduling}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.doNotAllowSameDayScheduling',
                                                                !values.rules?.doNotAllowSameDayScheduling
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation(
                                                        'Does not allow patient scheduling for the same day'
                                                    )}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.doNotAllowSameDayAndDoctorScheduling}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.doNotAllowSameDayAndDoctorScheduling',
                                                                !values.rules?.doNotAllowSameDayAndDoctorScheduling
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation(
                                                        'Does not allow patient scheduling for the same day/doctor'
                                                    )}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.useScheduledSending}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.useScheduledSending',
                                                                !values.rules?.useScheduledSending
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('Enable scheduled sending routine')}
                                                </Form.Item>
                                                {integration.type === IntegrationsType.NETPACS && (
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={!!values.rules?.useNetpacsDoctorByProcedure}
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.useNetpacsDoctorByProcedure',
                                                                    !values.rules?.useNetpacsDoctorByProcedure
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation(
                                                            'Ativar obtenção de médicos por procedimento - (NetPACS)'
                                                        )}
                                                    </Form.Item>
                                                )}
                                            </Space>
                                        </Col>
                                        <Col span={12}>
                                            <Space direction={'vertical'}>
                                                <>
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={
                                                                !!values.rules?.useProcedureAsInterAppointmentValidation
                                                            }
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.useProcedureAsInterAppointmentValidation',
                                                                    !values.rules
                                                                        ?.useProcedureAsInterAppointmentValidation
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation(
                                                            'Use procedure instead of specialty in inter appointment validation'
                                                        )}
                                                    </Form.Item>
                                                </>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.updatePatientEmailBeforeCreateSchedule}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.updatePatientEmailBeforeCreateSchedule',
                                                                !values.rules?.updatePatientEmailBeforeCreateSchedule
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('Update patient email when scheduling')}
                                                </Form.Item>{' '}
                                                {integration.type === IntegrationsType.DOCTORALIA && (
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={!!values.rules?.splitInsuranceIntoInsurancePlans}
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.splitInsuranceIntoInsurancePlans',
                                                                    !values.rules?.splitInsuranceIntoInsurancePlans
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation('Split Insurance Into Insurance Plans')} -
                                                        (legacyid)
                                                    </Form.Item>
                                                )}
                                                {integration.type === IntegrationsType.DOCTORALIA && (
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={!!values.rules?.splitInsuranceIntoInsurancePlansV2}
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.splitInsuranceIntoInsurancePlansV2',
                                                                    !values.rules?.splitInsuranceIntoInsurancePlansV2
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation('Split Insurance Into Insurance Plans')} -
                                                        (tags)
                                                    </Form.Item>
                                                )}
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.updatePatientPhoneBeforeCreateSchedule}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.updatePatientPhoneBeforeCreateSchedule',
                                                                !values.rules?.updatePatientPhoneBeforeCreateSchedule
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('Update patient phone when scheduling')}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.updatePatientSexBeforeCreateSchedule}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.updatePatientSexBeforeCreateSchedule',
                                                                !values.rules?.updatePatientSexBeforeCreateSchedule
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('Update patient gender when scheduling')}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={
                                                            !!values.rules?.showFutureSearchInAvailableScheduleList
                                                        }
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.showFutureSearchInAvailableScheduleList',
                                                                !values.rules?.showFutureSearchInAvailableScheduleList
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation(
                                                        'Show option to search for future times in the timetable list'
                                                    )}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={
                                                            !!values.rules
                                                                ?.showAnotherDoctorInTheListOfAvailableAppointments
                                                        }
                                                        onChange={(checked) => {
                                                            handleUpdateChange(
                                                                'rules.showAnotherDoctorInTheListOfAvailableAppointments',
                                                                checked
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation(
                                                        'In the list of doctors, display an option at the end to change doctors'
                                                    )}
                                                </Form.Item>
                                                {integration.type === IntegrationsType.TDSA && (
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={
                                                                !!values.rules
                                                                    ?.listAvailableAppointmentFromAllActiveUnits
                                                            }
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.listAvailableAppointmentFromAllActiveUnits',
                                                                    !values.rules
                                                                        ?.listAvailableAppointmentFromAllActiveUnits
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation('Force time listing for all active units')}
                                                    </Form.Item>
                                                )}
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.usesNightTimeInTheSelectionOfPeriod}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.usesNightTimeInTheSelectionOfPeriod',
                                                                !values.rules?.usesNightTimeInTheSelectionOfPeriod
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('Exibir perído noturno na seleção de horários')}
                                                </Form.Item>
                                                {integration.type === IntegrationsType.CM && (
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={!!values.rules?.runFirstScheduleRule}
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.runFirstScheduleRule',
                                                                    !values.rules?.runFirstScheduleRule
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation('Run first schedule rule')}
                                                    </Form.Item>
                                                )}
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.useInsuranceSuggestion}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.useInsuranceSuggestion',
                                                                !values.rules?.useInsuranceSuggestion
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('Use the agreement suggestion step')}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.allowStepBack}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.allowStepBack',
                                                                !values.rules?.allowStepBack
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('Enable step to go back in the integrated flow')}
                                                </Form.Item>
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledSwitch
                                                        checked={!!values.rules?.useListInAllSteps}
                                                        onChange={() => {
                                                            handleUpdateChange(
                                                                'rules.useListInAllSteps',
                                                                !values.rules?.useListInAllSteps
                                                            );
                                                        }}
                                                    />
                                                    {getTranslation('Enable sending list for all steps')}
                                                </Form.Item>
                                                {integration.type === IntegrationsType.CLINIC && (
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={!!values.rules?.listConsultationTypesAsProcedure}
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.listConsultationTypesAsProcedure',
                                                                    !values.rules?.listConsultationTypesAsProcedure
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation('Import exams for confirmation')}
                                                    </Form.Item>
                                                )}
                                                {integration.type === IntegrationsType.NETPACS && (
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={!!values.rules?.useNetpacsGroupedSchedules}
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.useNetpacsGroupedSchedules',
                                                                    !values.rules?.useNetpacsGroupedSchedules
                                                                );
                                                            }}
                                                        />
                                                        {getTranslation(
                                                            'Ativar horários disponíveis agrupados - (NetPACS)'
                                                        )}
                                                    </Form.Item>
                                                )}
                                                {isSystemAdmin(loggedUser) && (
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={
                                                                !!values.rules
                                                                    ?.useReportProcessorAISpecialityAndProcedureDetection
                                                            }
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.useReportProcessorAISpecialityAndProcedureDetection',
                                                                    !values.rules
                                                                        ?.useReportProcessorAISpecialityAndProcedureDetection
                                                                );
                                                            }}
                                                        />
                                                        {
                                                            'Ativa uso de detecção de pedido médico com IA (Detecta especialidade e procedimento)'
                                                        }
                                                    </Form.Item>
                                                )}
                                                {isSystemAdmin(loggedUser) && (
                                                    <Form.Item
                                                        style={{ margin: 0 }}
                                                        labelCol={{ span: 24 }}
                                                        wrapperCol={{ span: 24 }}
                                                    >
                                                        <StyledSwitch
                                                            checked={
                                                                !!values.rules?.useReportProcessorAIProcedureDetection
                                                            }
                                                            onChange={() => {
                                                                handleUpdateChange(
                                                                    'rules.useReportProcessorAIProcedureDetection',
                                                                    !values.rules
                                                                        ?.useReportProcessorAIProcedureDetection
                                                                );
                                                            }}
                                                        />
                                                        {
                                                            'Ativa uso de detecção de pedido médico com IA (Detecta somente procedimento)'
                                                        }
                                                    </Form.Item>
                                                )}
                                            </Space>
                                        </Col>
                                    </Row>
                                }
                            />
                            {rolesJsonConfigIntegrationRules() && (
                                <CardWrapperForm
                                    title={getTranslation('Custom integration rules configuration via JSON')}
                                    childrenHeader
                                    children={
                                        <>
                                            <TextArea
                                                rows={14}
                                                placeholder={`Exemplo:\n{\n"novaRegra": true,\n"showConfig": false\n}`}
                                                value={customConfigJSON}
                                                onChange={changeJsonIntegrationRules}
                                                style={{
                                                    borderColor: jsonError ? '#ff4d4f' : undefined,
                                                    fontSize: '12px',
                                                }}
                                            />
                                            {jsonError && (
                                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                                                    {jsonError}
                                                </div>
                                            )}
                                            <div
                                                style={{
                                                    color: '#666',
                                                    fontSize: '12px',
                                                    marginTop: '8px',
                                                }}
                                            >
                                                {getTranslation(
                                                    'This JSON will be merged with the current integration rules configuration'
                                                )}
                                            </div>
                                        </>
                                    }
                                />
                            )}
                            <CardWrapperForm
                                linkHelpCenter={undefined}
                                title={getTranslation('Time limit rules')}
                                childrenHeader
                                children={
                                    <>
                                        <Space direction={'vertical'}>
                                            <Form.Item
                                                style={{ margin: 0 }}
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                            >
                                                <StyledInput
                                                    value={
                                                        values?.rules?.timeBeforeTheAppointmentThatConfirmationCanBeMade
                                                            ? values?.rules
                                                                  ?.timeBeforeTheAppointmentThatConfirmationCanBeMade /
                                                              60
                                                            : undefined
                                                    }
                                                    type='number'
                                                    min={1}
                                                    max={200}
                                                    style={{ width: '81px', marginRight: '10px' }}
                                                    onChange={(event) => {
                                                        const field =
                                                            'rules.timeBeforeTheAppointmentThatConfirmationCanBeMade';

                                                        const value = parseInt(event.target.value);
                                                        if (value > 0 && value < 201) {
                                                            return handleUpdateChange(field, value * 60);
                                                        } else {
                                                            return setFieldValue(field, undefined);
                                                        }
                                                    }}
                                                />
                                                {getTranslation('How long before can confirmation be made (Hours)')}
                                            </Form.Item>
                                            {values?.rules?.showFutureSearchInAvailableScheduleList && (
                                                <Form.Item
                                                    style={{ margin: 0 }}
                                                    labelCol={{ span: 24 }}
                                                    wrapperCol={{ span: 24 }}
                                                >
                                                    <StyledInput
                                                        value={values?.rules?.showListingFutureTimesFrom}
                                                        type='number'
                                                        min={1}
                                                        max={60}
                                                        style={{ width: '81px', marginRight: '10px' }}
                                                        onChange={(event) => {
                                                            const field = 'rules.showListingFutureTimesFrom';

                                                            const value = parseInt(event.target.value);
                                                            if (value > 0 && value < 61) {
                                                                return handleUpdateChange(field, value);
                                                            } else {
                                                                return setFieldValue(field, undefined);
                                                            }
                                                        }}
                                                    />
                                                    {getTranslation('Show times after (Days)')}
                                                </Form.Item>
                                            )}
                                            <Form.Item
                                                style={{ margin: 0 }}
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                            >
                                                <StyledInput
                                                    value={
                                                        values?.rules
                                                            ?.timeCacheFirstAppointmentAvailableForFutureSearches
                                                            ? values?.rules
                                                                  ?.timeCacheFirstAppointmentAvailableForFutureSearches
                                                            : undefined
                                                    }
                                                    type='number'
                                                    min={1}
                                                    max={200}
                                                    style={{ width: '81px', marginRight: '10px' }}
                                                    onChange={(event) => {
                                                        const field =
                                                            'rules.timeCacheFirstAppointmentAvailableForFutureSearches';
                                                        const value = parseInt(event.target.value);
                                                        if (value > 0 || value < 200) {
                                                            return handleUpdateChange(field, value);
                                                        } else {
                                                            return setFieldValue(field, undefined);
                                                        }
                                                    }}
                                                />
                                                {getTranslation(
                                                    'Time that the first schedule listing will be cached (Minutes)'
                                                )}
                                            </Form.Item>
                                            <Form.Item
                                                style={{ margin: 0 }}
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                            >
                                                <StyledInput
                                                    value={
                                                        values?.rules?.limitUntilDaySearchAppointments
                                                            ? values?.rules?.limitUntilDaySearchAppointments
                                                            : undefined
                                                    }
                                                    type='number'
                                                    min={0}
                                                    max={180}
                                                    style={{ width: '81px', marginRight: '10px' }}
                                                    onChange={(event) => {
                                                        const field = 'rules.limitUntilDaySearchAppointments';
                                                        const value = parseInt(event.target.value);
                                                        if (value >= 0 || value <= 180) {
                                                            return handleUpdateChange(field, value);
                                                        } else {
                                                            return setFieldValue(field, undefined);
                                                        }
                                                    }}
                                                />
                                                {getTranslation('Limit of days for listing appointments')}
                                            </Form.Item>
                                            <Form.Item
                                                style={{ margin: 0 }}
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                            >
                                                <StyledInput
                                                    value={
                                                        values?.rules?.limitUntilDaySearchAppointmentsWithDoctor
                                                            ? values?.rules?.limitUntilDaySearchAppointmentsWithDoctor
                                                            : undefined
                                                    }
                                                    type='number'
                                                    min={0}
                                                    max={180}
                                                    style={{ width: '81px', marginRight: '10px' }}
                                                    onChange={(event) => {
                                                        const field = 'rules.limitUntilDaySearchAppointmentsWithDoctor';
                                                        const value = parseInt(event.target.value);
                                                        if (value >= 0 || value <= 180) {
                                                            return handleUpdateChange(field, value);
                                                        } else {
                                                            return setFieldValue(field, undefined);
                                                        }
                                                    }}
                                                />
                                                {getTranslation(
                                                    'Limit of days to list appointments when you have a doctor selected'
                                                )}
                                            </Form.Item>
                                            <Form.Item
                                                style={{ margin: 0 }}
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                            >
                                                <StyledInput
                                                    value={
                                                        values?.rules?.timeFirstAvailableSchedule
                                                            ? values?.rules?.timeFirstAvailableSchedule
                                                            : undefined
                                                    }
                                                    type='number'
                                                    min={0}
                                                    max={180}
                                                    style={{ width: '81px', marginRight: '10px' }}
                                                    onChange={(event) => {
                                                        const field = 'rules.timeFirstAvailableSchedule';
                                                        const value = parseInt(event.target.value);
                                                        return handleUpdateChange(field, value);
                                                    }}
                                                />
                                                {getTranslation('How long in minutes to display first available time')}
                                            </Form.Item>
                                            <Form.Item
                                                style={{ margin: 0 }}
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                            >
                                                <StyledInput
                                                    value={
                                                        values?.rules?.limitDaysForListDoctorsWithAvailableSchedules
                                                            ? values?.rules
                                                                  ?.limitDaysForListDoctorsWithAvailableSchedules
                                                            : undefined
                                                    }
                                                    type='number'
                                                    min={0}
                                                    max={180}
                                                    style={{ width: '81px', marginRight: '10px' }}
                                                    onChange={(event) => {
                                                        const field =
                                                            'rules.limitDaysForListDoctorsWithAvailableSchedules';
                                                        const value = parseInt(event.target.value);
                                                        return handleUpdateChange(field, value);
                                                    }}
                                                />
                                                {getTranslation(
                                                    'Limit of days to list doctors with available appointments'
                                                )}
                                            </Form.Item>

                                            <Form.Item
                                                style={{ margin: 0 }}
                                                labelCol={{ span: 24 }}
                                                wrapperCol={{ span: 24 }}
                                            >
                                                <StyledInput
                                                    disabled={disableForm}
                                                    value={
                                                        values?.rules?.limitOfDaysToSplitRequestInScheduleSearch
                                                            ? values?.rules?.limitOfDaysToSplitRequestInScheduleSearch
                                                            : undefined
                                                    }
                                                    type='number'
                                                    min={0}
                                                    max={180}
                                                    style={{ width: '81px', marginRight: '10px' }}
                                                    onChange={(event) => {
                                                        const field = 'rules.limitOfDaysToSplitRequestInScheduleSearch';
                                                        const value = parseInt(event.target.value);
                                                        if (value >= 0) {
                                                            return handleUpdateChange(field, value);
                                                        }
                                                    }}
                                                />
                                                {getTranslation('Divide timetable search into periods of X days')}
                                            </Form.Item>
                                        </Space>
                                    </>
                                }
                            />
                            <CardWrapperForm
                                title={getTranslation('Formatting rules for case types in patient names')}
                                childrenHeader
                                children={
                                    <Form.Item style={{ margin: 0 }} labelCol={{ span: 24 }} wrapperCol={{ span: 24 }}>
                                        <Radio.Group
                                            value={values.rules?.patientNameCase || IntegrationPatientNameCase.NONE}
                                            onChange={(e) => {
                                                handleUpdateChange('rules.patientNameCase', e.target.value);
                                            }}
                                        >
                                            <Radio value={IntegrationPatientNameCase.UPPER}>
                                                {getTranslation('Uppercase')}
                                            </Radio>
                                            <Radio value={IntegrationPatientNameCase.LOWER}>
                                                {getTranslation('Lowercase')}
                                            </Radio>
                                            <Radio value={IntegrationPatientNameCase.CAPITALIZE}>
                                                {getTranslation('Capitalize the first letter of each word.')}
                                            </Radio>
                                            <Radio value={IntegrationPatientNameCase.NONE}>
                                                {getTranslation('None of the options')}
                                            </Radio>
                                        </Radio.Group>
                                    </Form.Item>
                                }
                            />
                        </ScrollView>
                    </>
                );
            }}
        />
    );
};

export default i18n(HealthIntegrationFormRules) as FC<HealthIntegrationFormRulesProps>;
