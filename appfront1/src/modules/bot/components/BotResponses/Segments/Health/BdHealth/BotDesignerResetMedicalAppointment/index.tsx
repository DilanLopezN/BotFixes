import { Component } from 'react';
import { Formik, Form } from 'formik';
import styled from 'styled-components';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerResetMedicalAppointmentProps } from './props';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { GetArrayWords } from '../../../../../../../i18n/interface/i18n.interface';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { BotAttrs } from '../../../../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import i18n from '../../../../../../../i18n/components/i18n';
import { IResponseElementBDResetMedicalAppointment, StepsBDMedicalAppointment } from 'kissbot-core';
import isArray from 'lodash/isArray';
import { Wrapper } from '../../../../../../../../ui-kissbot-v2/common';
import { DragSelect } from '../../../../../../../../shared/DragSelect';
import { dispatchSentryError } from '../../../../../../../../utils/Sentry';

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

const WrapperValueRight = styled('div')`
    padding-right: 6px;
    width: 100%;
`;

const WrapperValueLeft = styled('div')`
    padding-left: 6px;
    width: 100%;
`;

const WrapperFieldAttr = ({
    values,
    setFieldTouched,
    setFieldValue,
    submit,
    submitted,
    touched,
    errors,
    fieldDescription,
    fieldName,
    fieldTitle,
}) => {
    return (
        <LabelWrapper
            label={fieldTitle}
            validate={{
                touched,
                errors,
                fieldName,
                isSubmitted: submitted,
            }}
            tooltip={fieldDescription}
        >
            <BotAttrs
                value={{
                    value: values[fieldName] ? values[fieldName] : '',
                    label: values[fieldName] ? values[fieldName] : '',
                }}
                onCreateOption={(event) => {
                    setFieldTouched(fieldName);
                    values[fieldName] = event;
                    setFieldValue(fieldName, event);
                    submit();
                }}
                onChange={(event) => {
                    setFieldTouched(fieldName);
                    values[fieldName] = event.value;
                    setFieldValue(fieldName, event.value);
                    submit();
                }}
                showOnly={['entity', 'others']}
                creatable
            />
        </LabelWrapper>
    );
};

export default class BotDesignerResponseResetMedicalAppointmentClass extends Component<BotDesignerResetMedicalAppointmentProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotDesignerResetMedicalAppointmentProps>) {
        super(props);
        this.translation = this.props.getArray([
            ...Object.values(StepsBDMedicalAppointment),
            'Service endpoint',
            'Integration',
            'Integration code',
            'Birth date',
            'Telephone',
            'Specialty',
            'Fill in with equivalent attributes',
            'Error',
            'Transboard',
            'Insurance',
            'Insurance plan',
            'Category',
            'Procedure',
            'Procedure type',
            'Organization unit',
            'Started appointment',
            'Ended appointment',
            'Restart appointment',
            'Appointment step',
            'Jump speciality',
            'Doctor',
            'Choose doctor',
            'Appointment',
            'Type',
            'Period of day',
            'Subplan',
            'Date limit',
            'Gender',
            'Insurance number',
            'Occupation area',
            'Location',
            'Type of service',
            'Name',
            'Patient code',
            'Week day',
            'Select the steps to be performed',
            'Steps',
            'Weight',
            'laterality'
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
                    ...(this.props.response.elements[0] as IResponseElementBDResetMedicalAppointment),
                }}
                onSubmit={() => {}}
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
                                            label={this.translation['Integration code']}
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'integrationCode',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip={this.translation['Integration code']}
                                        >
                                            <StyledFormikField
                                                type='text'
                                                onBlur={submit}
                                                name={`integrationCode`}
                                                placeholder={this.translation['Integration code']}
                                            />
                                        </LabelWrapper>
                                    </WrapperValueLeft>
                                </Col50>
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
                                            fieldName='attrNameWeekDay'
                                            fieldDescription={this.translation['Week day']}
                                            fieldTitle={this.translation['Week day']}
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
                                            fieldName='attrNameScheduleToCancelCode'
                                            fieldDescription={'Código para reagendamento'}
                                            fieldTitle={'Código para reagendamento'}
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

export const BotDesignerResponseResetMedicalAppointment = i18n(
    withRouter(connect(mapStateToProps, {})(BotDesignerResponseResetMedicalAppointmentClass))
);
