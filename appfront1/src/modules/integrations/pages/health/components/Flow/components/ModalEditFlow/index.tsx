import { FC } from 'react';
import { ModalEditFlowProps } from './props';
import i18n from '../../../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import { ModalPortal } from '../../../../../../../../shared/ModalPortal/ModalPortal';
import { Wrapper } from '../../../../../../../../ui-kissbot-v2/common';
import { ModalPosition } from '../../../../../../../../shared/ModalPortal/ModalPortalProps';
import { DiscardBtn } from '../../../../../../../../shared/StyledForms/DiscardBtn/DiscardBtn';
import { DoneBtn } from '../../../../../../../../shared/StyledForms/DoneBtn/DoneBtn';
import { useFormik } from 'formik-latest';
import { connect } from 'react-redux';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import FlowTypeSelector from '../FlowTypeSelector';
import FlowStepSelector from '../FlowStepSelector';
import { DatePicker, Input, InputNumber, TimePicker } from 'antd';
import FlowPeriodOfDaySelector from '../FlowPeriodOfDaySelector';
import FlowStringArray from '../FlowStringArray';
import EntitySelector from '../EntitySelector';
import Header from '../../../../../../../newChannelConfig/components/Header';
import moment from 'moment';
import { FlowType } from 'kissbot-core';
import FlowTriggerSelector from '../FlowTriggerSelector';
import locale from 'antd/es/date-picker/locale/pt_BR';

const { TextArea } = Input;

const ModalEditFlow: FC<ModalEditFlowProps & I18nProps> = ({
    getTranslation,
    isOpened,
    onClose,
    flow,
    updateFlow,
    fields,
    entities,
    integrationType,
}) => {
    const formik = useFormik({
        initialValues: { ...flow },
        onSubmit: (values) => {
            if (formik.isValid) {
                updateFlow(values);
            } else {
                return;
            }
        },
    });

    const disabledDate = (current) => {
        return current && current < moment().startOf('day');
    };

    const getComponentDate = (label: string, field: string) => (
        <LabelWrapper label={getTranslation(label)}>
            <DatePicker
                format='DD-MM-YYYY'
                locale={locale}
                disabledDate={disabledDate}
                disabled={formik.values.type === FlowType.correlation}
                value={formik.values[field] ? moment(Number(formik.values[field])) : undefined}
                onChange={(date) => {
                    if (date === null) {
                        return formik.setFieldValue(field, null);
                    }
                    formik.setFieldValue(field, moment(date).valueOf());
                }}
            />
            <TimePicker
                format='HH:mm'
                placeholder={getTranslation('Hour')}
                disabled={formik.values.type === FlowType.correlation}
                defaultValue={
                    formik.values[field]
                        ? moment(moment(Number(formik.values[field])).format('HH:mm'), 'HH:mm')
                        : moment(0, 'HH:mm')
                }
                value={
                    formik.values[field]
                        ? moment(moment(Number(formik.values[field])).format('HH:mm'), 'HH:mm')
                        : undefined
                }
                onChange={(date) => {
                    if (date === null) {
                        return formik.setFieldValue(field, null);
                    }
                    const toFormat = moment(date).format('HH:mm');

                    const value = moment(
                        `${
                            formik.values[field]
                                ? moment(formik.values[field]).format('DD-MM-YYYY')
                                : moment().format('DD-MM-YYYY')
                        } ${toFormat}`,
                        'DD-MM-YYYY HH:mm'
                    );

                    formik.setFieldValue(field, value.valueOf());
                }}
            />
        </LabelWrapper>
    );

    const getComponentHour = (label: string, field: string) => (
        <LabelWrapper label={getTranslation(label)}>
            <TimePicker
                format='HH:mm'
                placeholder={getTranslation('Hour')}
                disabled={formik.values.type === FlowType.correlation}
                value={formik.values[field] ? moment(moment.utc(Number(formik.values[field])), 'HH:mm') : undefined}
                onChange={(date) => {
                    if (date === null) {
                        return formik.setFieldValue(field, null);
                    }
                    const toFormat = moment(date).format('HH:mm');

                    formik.setFieldValue(field, moment.duration(toFormat).valueOf());
                }}
            />
        </LabelWrapper>
    );

    return (
        <ModalPortal isOpened={isOpened} position={ModalPosition.center} width='700px' height='90vh' maxHeight='650px'>
            <form
                style={{
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexDirection: 'column',
                }}
            >
                <Header style={{ height: '50px', borderRadius: '5px' }} title={getTranslation('Flow')} />
                <Wrapper height='550px' overflowY='auto' padding='20px'>
                    {fields.map((field) => {
                        if (field === 'typeText') {
                            return (
                                <LabelWrapper label={getTranslation('Type')}>
                                    <FlowTypeSelector
                                        integrationType={integrationType}
                                        initialValue={formik.values.type}
                                        onChange={(value) => formik.setFieldValue('type', value)}
                                    />
                                </LabelWrapper>
                            );
                        }
                        if (field === 'stepText') {
                            return (
                                <LabelWrapper label={getTranslation('Step')}>
                                    <FlowStepSelector
                                        disabled={formik.values.type === FlowType.correlation}
                                        initialValue={formik.values.step}
                                        onChange={(value) => formik.setFieldValue('step', value)}
                                    />
                                </LabelWrapper>
                            );
                        }
                        if (field === 'opposeStepText') {
                            return (
                                <LabelWrapper label={getTranslation('opposeStepText')}>
                                    <FlowStepSelector
                                        disabled={formik.values.type === FlowType.correlation}
                                        initialValue={formik.values.opposeStep}
                                        onChange={(value) => formik.setFieldValue('opposeStep', value)}
                                    />
                                </LabelWrapper>
                            );
                        }
                        if (field === 'triggerText') {
                            return (
                                <LabelWrapper label={getTranslation('Trigger')}>
                                    <FlowTriggerSelector
                                        disabled={formik.values.type === FlowType.correlation}
                                        initialValue={formik.values.trigger}
                                        onChange={(value) => formik.setFieldValue('trigger', value)}
                                    />
                                </LabelWrapper>
                            );
                        }
                        if (field === 'minimumAge') {
                            return (
                                <LabelWrapper label={getTranslation('Minimum age')}>
                                    <InputNumber
                                        min={0}
                                        max={200}
                                        disabled={formik.values.type === FlowType.correlation}
                                        value={formik.values.minimumAge}
                                        onChange={(value) => formik.setFieldValue('minimumAge', value)}
                                    />
                                </LabelWrapper>
                            );
                        }
                        if (field === 'maximumAge') {
                            return (
                                <LabelWrapper label={getTranslation('Maximum age')}>
                                    <InputNumber
                                        min={0}
                                        max={200}
                                        disabled={formik.values.type === FlowType.correlation}
                                        value={formik.values.maximumAge}
                                        onChange={(value) => formik.setFieldValue('maximumAge', value)}
                                    />
                                </LabelWrapper>
                            );
                        }
                        if (field === 'periodOfDayText') {
                            return (
                                <LabelWrapper label={getTranslation('Period of day')}>
                                    <FlowPeriodOfDaySelector
                                        initialValue={formik.values.periodOfDay}
                                        disabled={formik.values.type === FlowType.correlation}
                                        onChange={(value) => formik.setFieldValue('periodOfDay', value)}
                                    />
                                </LabelWrapper>
                            );
                        }
                        if (field === 'sex') {
                            return (
                                <LabelWrapper label={getTranslation('Genre')}>
                                    <Input
                                        value={formik.values.sex}
                                        disabled={formik.values.type === FlowType.correlation}
                                        onChange={(event) => formik.setFieldValue('sex', event.target.value)}
                                    />
                                </LabelWrapper>
                            );
                        }
                        if (field === 'cpfsText') {
                            return (
                                <LabelWrapper label={getTranslation('Blocked patient cpfs')}>
                                    <FlowStringArray
                                        initialValue={formik.values.cpfs}
                                        disabled={formik.values.type === FlowType.correlation}
                                        onChange={(value) => formik.setFieldValue('cpfs', value)}
                                    />
                                </LabelWrapper>
                            );
                        }
                        if (field === 'description') {
                            return (
                                <LabelWrapper label={getTranslation('Description')}>
                                    <TextArea
                                        value={formik.values.description}
                                        disabled={formik.values.type === FlowType.correlation}
                                        onChange={(event) => formik.setFieldValue('description', event.target.value)}
                                    />
                                </LabelWrapper>
                            );
                        }

                        return (
                            <LabelWrapper label={getTranslation(`${field}`)}>
                                <EntitySelector
                                    selectAll
                                    value={{ value: formik.values[`${field}Id`] || [] }}
                                    initialValue={formik.values[`${field}Id`] || []}
                                    entities={entities[field] ? [...entities[field]] : []}
                                    onChange={(value) => formik.setFieldValue(`${field}Id`, value)}
                                />
                            </LabelWrapper>
                        );
                    })}
                    {getComponentDate('Execute from of', 'executeFrom')}
                    {getComponentDate('Execute until', 'executeUntil')}
                    {getComponentHour('Execute from this time', 'runBetweenStart')}
                    {getComponentHour('Execute until time', 'runBetweenEnd')}
                </Wrapper>
                <Wrapper
                    flexBox
                    width='100%'
                    padding='10px'
                    borderRadius='0 0 5px 5px'
                    bgcolor='#f2f4f8'
                    justifyContent='flex-end'
                >
                    <DiscardBtn
                        style={{ marginRight: '10px' }}
                        onClick={() => {
                            formik.resetForm();
                            onClose();
                        }}
                    >
                        {getTranslation('Cancel')}
                    </DiscardBtn>
                    <DoneBtn
                        onClick={() => {
                            formik.handleSubmit();
                        }}
                    >
                        {getTranslation('Save')}
                    </DoneBtn>
                </Wrapper>
            </form>
        </ModalPortal>
    );
};

const mapStateToProps = (state: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default i18n(connect(mapStateToProps)(ModalEditFlow)) as FC<ModalEditFlowProps>;
