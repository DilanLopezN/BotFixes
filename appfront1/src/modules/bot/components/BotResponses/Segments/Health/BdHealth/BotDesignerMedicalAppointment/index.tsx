import { Component } from 'react';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import styled from 'styled-components';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerMedicalAppointmentProps } from './props';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { GetArrayWords } from '../../../../../../../i18n/interface/i18n.interface';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import i18n from '../../../../../../../i18n/components/i18n';
import Toggle from '../../../../../../../../shared/Toggle/Toggle';
import { IResponseElementBDMedicalAppointment, StepsBDMedicalAppointment } from 'kissbot-core';
import { Wrapper } from '../../../../../../../../ui-kissbot-v2/common';
import isArray from 'lodash/isArray';
import SortType from './sortType';
import { DragSelect } from '../../../../../../../../shared/DragSelect';
import { dispatchSentryError } from '../../../../../../../../utils/Sentry';
import { WrapperFieldAttr } from '../WrapperField';
import { FormItemInteraction } from '../../../../../../../../shared-v2/FormItemInteraction';

const CenterDiv = styled('div')`
    width: 100%;
    display: flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    padding: 8px 0;
    margin: 7px 0;
    border-bottom: 1px #dcdcdc solid;
`;

const Row = styled('div')`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const Col = styled('div')`
    align-items: center;
    justify-content: center;
    display: flex;
`;

const Col50 = styled(Col)`
    width: 50%;
`;

const Col100 = styled(Col)`
    width: 100%;
`;

const Col33 = styled(Col)`
    width: 33%;
`;

const Col66 = styled(Col)`
    width: 66%;
`;

const WrapperValueRight = styled('div')`
    padding-right: 6px;
    width: 100%;
`;

const WrapperValueLeft = styled('div')`
    padding-left: 6px;
    width: 100%;
`;

export default class BotDesignerResponseMedicalAppointmentClass extends Component<BotDesignerMedicalAppointmentProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotDesignerMedicalAppointmentProps>) {
        super(props);
        this.translation = this.props.getArray([
            ...Object.values(StepsBDMedicalAppointment),
            'Required field',
            'Birth date',
            'Telephone',
            'Service endpoint',
            'Specialty',
            'Fill in with equivalent attributes',
            'According to the answer, redirect to',
            'Empty result',
            'If the received result is empty',
            'Select a interaction',
            'In case of error redirect to',
            'If filled will lead to an transboard interaction',
            'Error',
            'Transboard',
            'Transfer to an transboard interaction',
            'Integration',
            'Insurance',
            'Insurance plan',
            'Category',
            'Procedure',
            'Procedure type',
            'Organization unit',
            'Check account',
            'Parameters to search for available times',
            'Days from today',
            'Until day',
            'Number of days from the initial date informed',
            'Result limit',
            'Randomize',
            'Select the steps to be performed',
            'Steps',
            'Started appointment',
            'Ended appointment',
            'Restart appointment',
            'Appointment step',
            'Jump speciality',
            'Doctor',
            'Choose doctor',
            'Appointment',
            'Appointment not confirmed goto',
            'Type',
            'Period of day',
            'Subplan',
            'Date limit',
            'Reschedule attribute code',
            'Gender',
            'Insurance number',
            'Occupation area',
            'Location',
            'Type of service',
            'Name',
            'Cannot do action',
            'Weight',
            'Height',
            'laterality',
        ]);
    }

    stepsToLabel = () => {
        const keys = Object.values(StepsBDMedicalAppointment);

        return keys.map((key) => ({
            label: this.translation[key],
            value: key,
        }));
    };

    renderLabelsView = (values: any) => {
        return isArray(values)
            ? values.map((item) => ({
                  value: item,
                  label: this.translation[item],
              }))
            : [];
    };

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            attrNameCpf: Yup.string().required(this.translation['Required field']),
            isEmptyGoto: Yup.string().required(this.translation['Required field']),
            isErrorGoto: Yup.string().required(this.translation['Required field']),
            steps: Yup.array().of(Yup.string()).min(1, 'This field requires at least one entry!'),
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render() {
        return (
            <Formik
                initialValues={{
                    ...(this.props.response.elements[0] as IResponseElementBDMedicalAppointment),
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
                                <Col50 />
                            </Row>
                            <CenterDiv>{this.translation['Select the steps to be performed']}:</CenterDiv>
                            <Wrapper margin='0'>
                                <LabelWrapper
                                    label={this.translation['Steps']}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'steps',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Steps']}
                                >
                                    <DragSelect
                                        disabled={false}
                                        options={this.stepsToLabel().sort((a, b) => a.label.localeCompare(b.label))}
                                        onChange={(event: any[]) => {
                                            setFieldValue(
                                                'steps',
                                                event.map((e) => e.value)
                                            );
                                            values.steps = event.map((e) => e.value);
                                            submit();
                                        }}
                                        value={this.renderLabelsView(values.steps)}
                                    />
                                </LabelWrapper>
                            </Wrapper>

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
                                            fieldName='attrNamePhone'
                                            fieldDescription={this.translation['Telephone']}
                                            fieldTitle={this.translation['Telephone']}
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
                                            fieldName='attrNameBornDate'
                                            fieldDescription={this.translation['Birth date']}
                                            fieldTitle={this.translation['Birth date']}
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
                                            fieldName='attrNameCpf'
                                            fieldDescription={'CPF'}
                                            fieldTitle={'CPF'}
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
                                            fieldName='attrNameEmail'
                                            fieldDescription={'Email'}
                                            fieldTitle={'Email'}
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
                                            fieldName='attrNameSex'
                                            fieldDescription={this.translation['Gender']}
                                            fieldTitle={this.translation['Gender']}
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
                                            fieldName='attrNameInsuranceNumber'
                                            fieldDescription={this.translation['Insurance number']}
                                            fieldTitle={this.translation['Insurance number']}
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
                                            fieldName='attrNameWeight'
                                            fieldDescription={this.translation['Weight']}
                                            fieldTitle={this.translation['Weight']}
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
                                            fieldName='attrNameMotherName'
                                            fieldDescription={'Nome da mãe'}
                                            fieldTitle={'Nome da mãe'}
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
                                            fieldName='attrNameHeight'
                                            fieldDescription={this.translation['Height']}
                                            fieldTitle={this.translation['Height']}
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
                                            fieldDescription={'Código'}
                                            fieldTitle={'Código'}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50 />
                            </Row>
                            <CenterDiv />
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
                                            fieldDescription={this.translation['Organization unit']}
                                            fieldTitle={this.translation['Organization unit']}
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
                                            fieldName='attrNameAppointment'
                                            fieldDescription={this.translation['Appointment']}
                                            fieldTitle={this.translation['Appointment']}
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
                                            fieldName='attrNamePeriodOfDay'
                                            fieldDescription={this.translation['Period of day']}
                                            fieldTitle={this.translation['Period of day']}
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
                                            fieldName='attrNameLaterality'
                                            fieldDescription={this.translation['laterality']}
                                            fieldTitle={this.translation['laterality']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50 />
                            </Row>
                            <CenterDiv />
                            <Row>
                                <WrapperValueLeft>
                                    <LabelWrapper
                                        label='Jump speciality'
                                        tooltip={'Jump speciality step when exists only one item'}
                                    >
                                        <Toggle
                                            checked={values.jumpSpecialityOneItem || false}
                                            onChange={(value) => {
                                                setFieldTouched('jumpSpecialityOneItem', value);
                                                values.jumpSpecialityOneItem = value;
                                                submit();
                                            }}
                                        />
                                    </LabelWrapper>
                                </WrapperValueLeft>
                            </Row>
                            <CenterDiv />
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
                                            fieldName='attrNameStartedAppointment'
                                            fieldDescription={this.translation['Started appointment']}
                                            fieldTitle={this.translation['Started appointment']}
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
                                            fieldName='attrNameRestartAppointment'
                                            fieldDescription={this.translation['Restart appointment']}
                                            fieldTitle={this.translation['Restart appointment']}
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
                                            fieldName='attrNameFinishedAppointment'
                                            fieldDescription={this.translation['Ended appointment']}
                                            fieldTitle={this.translation['Ended appointment']}
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
                                            fieldName='attrNameStep'
                                            fieldDescription={this.translation['Appointment step']}
                                            fieldTitle={this.translation['Appointment step']}
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
                                            fieldName='attrNameScheduleToCancelCode'
                                            fieldDescription={this.translation['Reschedule attribute code']}
                                            fieldTitle={this.translation['Reschedule attribute code']}
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
                            <CenterDiv>{this.translation['Parameters to search for available times']}:</CenterDiv>
                            <Row>
                                <Col33>
                                    <WrapperValueRight>
                                        <LabelWrapper
                                            label={this.translation['Days from today']}
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'fromDay',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip={this.translation['Days from today']}
                                        >
                                            <StyledFormikField
                                                type='text'
                                                onBlur={submit}
                                                name={`fromDay`}
                                                placeholder={this.translation['Days from today']}
                                            />
                                        </LabelWrapper>
                                    </WrapperValueRight>
                                </Col33>
                                <Col33>
                                    <WrapperValueRight>
                                        <LabelWrapper
                                            label={this.translation['Until day']}
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'untilDay',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip={this.translation['Number of days from the initial date informed']}
                                        >
                                            <StyledFormikField
                                                type='number'
                                                onBlur={submit}
                                                name={`untilDay`}
                                                placeholder={this.translation['Until day']}
                                            />
                                        </LabelWrapper>
                                    </WrapperValueRight>
                                </Col33>
                                <Col33>
                                    <WrapperValueLeft>
                                        <LabelWrapper
                                            label={this.translation['Result limit']}
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'limit',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip={this.translation['Result limit']}
                                        >
                                            <StyledFormikField
                                                type='number'
                                                onBlur={submit}
                                                name={`limit`}
                                                placeholder={this.translation['Result limit']}
                                            />
                                        </LabelWrapper>
                                    </WrapperValueLeft>
                                </Col33>
                            </Row>
                            <Row>
                                <Wrapper width='46%'>
                                    <WrapperValueLeft>
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
                                    </WrapperValueLeft>
                                </Wrapper>
                                <Col33>
                                    <WrapperValueLeft style={{ paddingLeft: '12px' }}>
                                        <LabelWrapper
                                            label={this.translation['Randomize']}
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'randomize',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip={this.translation['Randomize']}
                                        >
                                            <Wrapper margin='8px 0 8px 5px'>
                                                <Toggle
                                                    checked={values.randomize || false}
                                                    onChange={(value) => {
                                                        setFieldTouched('randomize', value);
                                                        values.randomize = value;
                                                        submit();
                                                    }}
                                                />
                                            </Wrapper>
                                        </LabelWrapper>
                                    </WrapperValueLeft>
                                </Col33>
                                <Col66>
                                    {values.randomize && (
                                        <LabelWrapper
                                            label={this.translation['Type']}
                                            tooltip={this.translation['Type']}
                                        >
                                            <SortType
                                                value={values.sortMethod}
                                                onChange={(itemSelected) => {
                                                    setFieldTouched('sortMethod');
                                                    setFieldValue('sortMethod', itemSelected.value);
                                                    values.sortMethod = itemSelected.value;
                                                    submit();
                                                }}
                                            />
                                        </LabelWrapper>
                                    )}
                                </Col66>
                            </Row>
                            <CenterDiv>{this.translation['According to the answer, redirect to']}:</CenterDiv>
                            <Col100>
                                <WrapperValueRight>
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
                                </WrapperValueRight>
                            </Col100>
                            <Col100>
                                <WrapperValueRight>
                                    <FormItemInteraction
                                        interaction={values.isErrorGoto}
                                        label={this.translation['Error']}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `isErrorGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={this.translation['In case of error redirect to']}
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
                                </WrapperValueRight>
                            </Col100>
                            <Col100>
                                <WrapperValueRight>
                                    <FormItemInteraction
                                        interaction={values?.cannotDoActionGoto}
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
                                            defaultValue={values?.cannotDoActionGoto}
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
                                </WrapperValueRight>
                            </Col100>
                            <Col100>
                                <WrapperValueRight>
                                    <FormItemInteraction
                                        interaction={values.checkAccountGoto}
                                        label={this.translation['Check account']}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `checkAccountGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={this.translation['Check account']}
                                    >
                                        <InteractionSelect
                                            name='checkAccountGoto'
                                            options={this.props.interactionList}
                                            interactionTypeToShow={['interaction', 'fallback']}
                                            defaultValue={values.checkAccountGoto}
                                            placeholder={this.translation['Select a interaction']}
                                            style={{ width: '100%' }}
                                            onChange={(ev) => {
                                                setFieldTouched('checkAccountGoto');
                                                if (!ev) return;
                                                values.checkAccountGoto = ev.value;
                                                setFieldValue('checkAccountGoto', ev.value);
                                                submit();
                                            }}
                                        />
                                    </FormItemInteraction>
                                </WrapperValueRight>
                            </Col100>
                            <Col100>
                                <WrapperValueRight>
                                    <FormItemInteraction
                                        interaction={values.isAgendamentoNaoConfirmadoGoto}
                                        label={this.translation['Appointment not confirmed goto']}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `isAgendamentoNaoConfirmadoGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={this.translation['Appointment not confirmed goto']}
                                    >
                                        <InteractionSelect
                                            name='isAgendamentoNaoConfirmadoGoto'
                                            options={this.props.interactionList}
                                            interactionTypeToShow={['interaction', 'fallback']}
                                            defaultValue={values.isAgendamentoNaoConfirmadoGoto}
                                            placeholder={this.translation['Select a interaction']}
                                            style={{ width: '100%' }}
                                            onChange={(ev) => {
                                                setFieldTouched('isAgendamentoNaoConfirmadoGoto');
                                                if (!ev) return;
                                                values.isAgendamentoNaoConfirmadoGoto = ev.value;
                                                setFieldValue('isAgendamentoNaoConfirmadoGoto', ev.value);
                                                submit();
                                            }}
                                        />
                                    </FormItemInteraction>
                                </WrapperValueRight>
                            </Col100>
                            <Col100>
                                <WrapperValueRight>
                                    <FormItemInteraction
                                        interaction={values.onRejectAppointmentValueGoto}
                                        label={'Recusou preço do agendamento'}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `onRejectAppointmentValueGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={'Recusou preço do agendamento'}
                                    >
                                        <InteractionSelect
                                            name='onRejectAppointmentValueGoto'
                                            options={this.props.interactionList}
                                            interactionTypeToShow={['interaction', 'fallback']}
                                            defaultValue={values.onRejectAppointmentValueGoto}
                                            placeholder={this.translation['Select a interaction']}
                                            style={{ width: '100%' }}
                                            onChange={(ev) => {
                                                setFieldTouched('onRejectAppointmentValueGoto');
                                                if (!ev) return;
                                                values.onRejectAppointmentValueGoto = ev.value;
                                                setFieldValue('onRejectAppointmentValueGoto', ev.value);
                                                submit();
                                            }}
                                        />
                                    </FormItemInteraction>
                                </WrapperValueRight>
                            </Col100>
                            <Col100>
                                <WrapperValueRight>
                                    <FormItemInteraction
                                        interaction={values.onConfirmAppointmentValueGoto}
                                        label={'Confirmou preço do agendamento'}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `onConfirmAppointmentValueGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={'Confirmou preço do agendamento'}
                                    >
                                        <InteractionSelect
                                            name='onConfirmAppointmentValueGoto'
                                            options={this.props.interactionList}
                                            interactionTypeToShow={['interaction', 'fallback']}
                                            defaultValue={values.onConfirmAppointmentValueGoto}
                                            placeholder={this.translation['Select a interaction']}
                                            style={{ width: '100%' }}
                                            onChange={(ev) => {
                                                setFieldTouched('onConfirmAppointmentValueGoto');
                                                if (!ev) return;
                                                values.onConfirmAppointmentValueGoto = ev.value;
                                                setFieldValue('onConfirmAppointmentValueGoto', ev.value);
                                                submit();
                                            }}
                                        />
                                    </FormItemInteraction>
                                </WrapperValueRight>
                            </Col100>
                            <Col100>
                                <WrapperValueRight>
                                    <FormItemInteraction
                                        interaction={values.onEmptySearchRestartGoto}
                                        label={'Se entidade vazia, reiniciar deve direcionar para:'}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `onEmptySearchRestartGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={'Se entidade vazia, reiniciar deve direcionar para:'}
                                    >
                                        <InteractionSelect
                                            name='onEmptySearchRestartGoto'
                                            options={this.props.interactionList}
                                            interactionTypeToShow={['interaction', 'fallback']}
                                            defaultValue={values.onEmptySearchRestartGoto}
                                            placeholder={this.translation['Select a interaction']}
                                            style={{ width: '100%' }}
                                            onChange={(ev) => {
                                                setFieldTouched('onEmptySearchRestartGoto');
                                                if (!ev) return;
                                                values.onEmptySearchRestartGoto = ev.value;
                                                setFieldValue('onEmptySearchRestartGoto', ev.value);
                                                submit();
                                            }}
                                        />
                                    </FormItemInteraction>
                                </WrapperValueRight>
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

export const BotDesignerResponseMedicalAppointment = i18n(
    withRouter(connect(mapStateToProps, {})(BotDesignerResponseMedicalAppointmentClass))
);
