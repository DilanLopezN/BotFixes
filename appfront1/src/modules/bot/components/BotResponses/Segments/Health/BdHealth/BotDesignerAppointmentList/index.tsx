import { Component } from 'react';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerAppointmentListProps } from './props';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { GetArrayWords } from '../../../../../../../i18n/interface/i18n.interface';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import i18n from '../../../../../../../i18n/components/i18n';
import { BDAppointmentListActionType, IResponseElementBDAppointmentList } from 'kissbot-core';
import { Row, Col50, Col100, CenterDiv, WrapperValueLeft, WrapperValueRight } from './styled';
import { CustomSelect } from '../../../../../../../../shared/StyledForms/CustomSelect/CustomSelect';
import isEmpty from 'lodash/isEmpty';
import { dispatchSentryError } from '../../../../../../../../utils/Sentry';
import { WrapperFieldAttr } from '../WrapperField';
import { FormItemInteraction } from '../../../../../../../../shared-v2/FormItemInteraction';

export default class BotDesignerAppointmentListClass extends Component<BotDesignerAppointmentListProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotDesignerAppointmentListProps>) {
        super(props);
        this.translation = this.props.getArray([
            'Required field',
            'Birth date',
            'Service endpoint',
            'Fill in with equivalent attributes',
            'Fill in with equivalent attributes for rescheduling',
            'According to the answer, redirect to',
            'Empty result',
            'If the received result is empty',
            'Select a interaction',
            'Integration',
            'Name',
            'Account not exists',
            'CPF',
            'Patient code',
            'Error',
            'Action',
            'view',
            'cancel',
            'confirm',
            'Select an action',
            'Ignored action',
            'rescheduled',
            'Reschedule attribute code',
            'Insurance',
            'Insurance plan',
            'Category',
            'Procedure',
            'Procedure type',
            'Unit',
            'Doctor',
            'Choose doctor',
            'Appointment',
            'Period of day',
            'Subplan',
            'Specialty',
            'schedule',
            'Occupation area',
            'Location',
            'Date limit',
            'Type of service',
            'return',
            'Telephone',
            'Cannot do action',
            'Skin color',
            'laterality'
        ]);
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            attrNameCpf: Yup.string().required(this.translation['Required field']),
            isErrorGoto: Yup.string().required(this.translation['Required field']),
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    getOptions = () => {
        return Object.keys(BDAppointmentListActionType).map((item) => ({
            label: this.translation[item] || item,
            value: item,
        }));
    };

    getOptionsAppointmentStatus = () => {
        return ['finished', 'all', 'future'].map((item) => ({
            label: this.translation[item] || item,
            value: item,
        }));
    };

    render() {
        return (
            <Formik
                initialValues={{
                    ...(this.props.response.elements[0] as IResponseElementBDAppointmentList),
                }}
                onSubmit={() => {}}
                validationSchema={this.getValidationSchema()}
                render={({ values, submitForm, validateForm, setFieldValue, touched, errors, setFieldTouched }) => {
                    const submit = () => {
                        validateForm()
                            .then((validatedValues: any) => {
                                if (validatedValues.isCanceled) {
                                    submit();
                                    return;
                                }
                                if (Object.keys(validatedValues).length != 0) {
                                    this.onChange(values, false);
                                } else {
                                    this.onChange(values, true);
                                }
                                submitForm();
                            })
                            .catch((e) => dispatchSentryError(e));
                    };

                    return (
                        <Form>
                            <Row>
                                <LabelWrapper
                                    label={this.translation['Service endpoint']}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'url',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Service endpoint']}
                                >
                                    <StyledFormikField
                                        type='text'
                                        onBlur={submit}
                                        name={`url`}
                                        placeholder={this.translation['Service endpoint']}
                                    />
                                </LabelWrapper>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <LabelWrapper
                                            label={this.translation['Integration']}
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'integrationId',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip={this.translation['Integration']}
                                        >
                                            <StyledFormikField
                                                type='text'
                                                onBlur={submit}
                                                name={`integrationId`}
                                                placeholder={this.translation['Integration']}
                                            />
                                        </LabelWrapper>
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <LabelWrapper
                                            label={this.translation['Action']}
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'integrationId',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip={this.translation['Action']}
                                        >
                                            <CustomSelect
                                                options={[...this.getOptions()]}
                                                value={
                                                    this.getOptions().find(
                                                        (item) => item.value === values.attrNameActionType
                                                    ) || this.getOptions()[0]
                                                }
                                                placeholder={this.translation['Select an action']}
                                                onChange={(ev) => {
                                                    if (ev === null || isEmpty(ev)) {
                                                        return this.getOptions()[0];
                                                    }
                                                    values.attrNameActionType = ev.value;
                                                    setFieldValue('attrNameActionType', ev.value);
                                                    submit();
                                                }}
                                            />
                                        </LabelWrapper>
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <LabelWrapper
                                            label={'Buscar a partir de X dias'}
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'fromDay',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip={'Buscar a partir de X dias'}
                                        >
                                            <StyledFormikField
                                                type='text'
                                                onBlur={submit}
                                                name={`fromDay`}
                                                placeholder={'Buscar a partir de X dias'}
                                            />
                                        </LabelWrapper>
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <LabelWrapper
                                            label={'Status do agendamento'}
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'appointmentStatus',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip={'Status do agendamento'}
                                        >
                                            <CustomSelect
                                                options={[...this.getOptionsAppointmentStatus()]}
                                                value={
                                                    this.getOptionsAppointmentStatus().find(
                                                        (item) => item.value === values.appointmentStatus
                                                    ) || null
                                                }
                                                placeholder={this.translation['Select an action']}
                                                onChange={(ev) => {
                                                    if (ev === null || isEmpty(ev)) {
                                                        return this.getOptionsAppointmentStatus()[0];
                                                    }
                                                    values.appointmentStatus = ev.value;
                                                    setFieldValue('appointmentStatus', ev.value);
                                                    submit();
                                                }}
                                            />
                                        </LabelWrapper>
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <CenterDiv>{this.translation['Fill in with equivalent attributes']}:</CenterDiv>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameName'
                                            fieldDescription={this.translation['Name']}
                                            fieldTitle={this.translation['Name']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNamePhone'
                                            fieldDescription={this.translation['Telephone']}
                                            fieldTitle={this.translation['Telephone']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameBornDate'
                                            fieldDescription={this.translation['Birth date']}
                                            fieldTitle={this.translation['Birth date']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameCpf'
                                            fieldDescription={this.translation['CPF']}
                                            fieldTitle={this.translation['CPF']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameColor'
                                            fieldDescription={this.translation['Skin color']}
                                            fieldTitle={this.translation['Skin color']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameMotherName'
                                            fieldDescription={'Nome da mãe'}
                                            fieldTitle={'Nome da mãe'}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <CenterDiv>
                                {this.translation['Fill in with equivalent attributes for rescheduling']}:
                            </CenterDiv>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameInsurance'
                                            fieldDescription={this.translation['Insurance']}
                                            fieldTitle={this.translation['Insurance']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameInsurancePlan'
                                            fieldDescription={this.translation['Insurance plan']}
                                            fieldTitle={this.translation['Insurance plan']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNamePlanCategory'
                                            fieldDescription={this.translation['Category']}
                                            fieldTitle={this.translation['Category']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameInsuranceSubPlan'
                                            fieldDescription={this.translation['Subplan']}
                                            fieldTitle={this.translation['Subplan']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameAppointmentType'
                                            fieldDescription={this.translation['Procedure type']}
                                            fieldTitle={this.translation['Procedure type']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameOrganizationUnit'
                                            fieldDescription={this.translation['Unit']}
                                            fieldTitle={this.translation['Unit']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameSpeciality'
                                            fieldDescription={this.translation['Specialty']}
                                            fieldTitle={this.translation['Specialty']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameProcedure'
                                            fieldDescription={this.translation['Procedure']}
                                            fieldTitle={this.translation['Procedure']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameOccupationArea'
                                            fieldDescription={this.translation['Occupation area']}
                                            fieldTitle={this.translation['Occupation area']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameOrganizationUnitLocation'
                                            fieldDescription={this.translation['Location']}
                                            fieldTitle={this.translation['Location']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameChooseDoctor'
                                            fieldDescription={this.translation['Choose doctor']}
                                            fieldTitle={this.translation['Choose doctor']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameDoctor'
                                            fieldDescription={this.translation['Doctor']}
                                            fieldTitle={this.translation['Doctor']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNamePeriodOfDay'
                                            fieldDescription={this.translation['Period of day']}
                                            fieldTitle={this.translation['Period of day']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameScheduleToCancelCode'
                                            fieldDescription={this.translation['Reschedule attribute code']}
                                            fieldTitle={this.translation['Reschedule attribute code']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNamePatientId'
                                            fieldDescription={this.translation['Patient code']}
                                            fieldTitle={this.translation['Patient code']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameTypeOfService'
                                            fieldDescription={this.translation['Type of service']}
                                            fieldTitle={this.translation['Type of service']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameDateLimit'
                                            fieldDescription={this.translation['Date limit']}
                                            fieldTitle={this.translation['Date limit']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50>
                                    <WrapperValueLeft>
                                        <WrapperFieldAttr
                                            errors={errors}
                                            values={values}
                                            setFieldTouched={setFieldTouched}
                                            setFieldValue={setFieldValue}
                                            submit={submit}
                                            submitted={this.props.submitted}
                                            touched={touched}
                                            fieldName='attrNameLaterality'
                                            fieldDescription={this.translation['laterality']}
                                            fieldTitle={this.translation['laterality']}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <CenterDiv>{this.translation['According to the answer, redirect to']}:</CenterDiv>
                            <Col100>
                                <FormItemInteraction
                                    interaction={values.isSheduledGoto}
                                    label={this.translation['schedule']}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `isSheduledGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['schedule']}
                                >
                                    <InteractionSelect
                                        name='isSheduledGoto'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.isSheduledGoto}
                                        placeholder={this.translation['Select a interaction']}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('isSheduledGoto');
                                            if (!ev) return;
                                            values.isSheduledGoto = ev.value;
                                            setFieldValue('isSheduledGoto', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </Col100>
                            <Col100>
                                <FormItemInteraction
                                    interaction={values.isRescheduledGoto}
                                    label={this.translation['rescheduled']}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `isRescheduledGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['rescheduled']}
                                >
                                    <InteractionSelect
                                        name='isRescheduledGoto'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.isRescheduledGoto}
                                        placeholder={this.translation['Select a interaction']}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('isRescheduledGoto');
                                            if (!ev) return;
                                            values.isRescheduledGoto = ev.value;
                                            setFieldValue('isRescheduledGoto', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </Col100>
                            <Col100>
                                <FormItemInteraction
                                    interaction={values.isErrorGoto}
                                    label={this.translation['Error']}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `isErrorGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Error']}
                                >
                                    <InteractionSelect
                                        name='isErrorGoto'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.isErrorGoto}
                                        placeholder={this.translation['Select a interaction']}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('isErrorGoto');
                                            if (!ev) return;
                                            values.isErrorGoto = ev.value;
                                            setFieldValue('isErrorGoto', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </Col100>
                            <Col100>
                                <FormItemInteraction
                                    interaction={values.cannotDoActionGoto}
                                    label={this.translation['Cannot do action']}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `cannotDoActionGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Cannot do action']}
                                >
                                    <InteractionSelect
                                        name='cannotDoActionGoto'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.cannotDoActionGoto}
                                        placeholder={this.translation['Select a interaction']}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('cannotDoActionGoto');
                                            if (!ev) return;
                                            values.cannotDoActionGoto = ev.value;
                                            setFieldValue('cannotDoActionGoto', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </Col100>
                            <Col100>
                                <FormItemInteraction
                                    interaction={values.isEmptyGoto}
                                    label={this.translation['Empty result']}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `isEmptyGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['If the received result is empty']}
                                >
                                    <InteractionSelect
                                        name='isEmptyGoto'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.isEmptyGoto}
                                        placeholder={this.translation['Select a interaction']}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('isEmptyGoto');
                                            if (!ev) return;
                                            values.isEmptyGoto = ev.value;
                                            setFieldValue('isEmptyGoto', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </Col100>
                            <Col100>
                                <FormItemInteraction
                                    interaction={values.actionIgnoredGoto}
                                    label={this.translation['Ignored action']}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `actionIgnoredGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['If the received result is empty']}
                                >
                                    <InteractionSelect
                                        name='actionIgnoredGoto'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.actionIgnoredGoto}
                                        placeholder={this.translation['Ignored action']}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('actionIgnoredGoto');
                                            if (!ev) return;
                                            values.actionIgnoredGoto = ev.value;
                                            setFieldValue('actionIgnoredGoto', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </Col100>
                            <Col100>
                                <FormItemInteraction
                                    interaction={values.accountNotExistsGoto}
                                    label={this.translation['Account not exists']}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `accountNotExistsGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Account not exists']}
                                >
                                    <InteractionSelect
                                        name='accountNotExistsGoto'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.accountNotExistsGoto}
                                        placeholder={this.translation['Select a interaction']}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('accountNotExistsGoto');
                                            if (!ev) return;
                                            values.accountNotExistsGoto = ev.value;
                                            setFieldValue('accountNotExistsGoto', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </Col100>
                        </Form>
                    );
                }}
            />
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    entitiesList: state.entityReducer.entitiesList,
    botAttributes: state.botReducer.botAttributes,
    interactionList: state.botReducer.interactionList,
});

export const BotDesignerAppointmentList = i18n(
    withRouter(connect(mapStateToProps, {})(BotDesignerAppointmentListClass))
);
