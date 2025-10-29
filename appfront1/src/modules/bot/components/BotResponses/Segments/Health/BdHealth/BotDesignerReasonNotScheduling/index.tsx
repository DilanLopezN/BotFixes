import { Component } from 'react';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import styled from 'styled-components';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerReasonNotSchedulingProps } from './props';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { GetArrayWords } from '../../../../../../../i18n/interface/i18n.interface';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import i18n from '../../../../../../../i18n/components/i18n';
import { IResponseElementBDMedicalAppointment, StepsBDMedicalAppointment } from 'kissbot-core';
import isArray from 'lodash/isArray';
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

const WrapperValueRight = styled('div')`
    padding-right: 6px;
    width: 100%;
`;

const WrapperValueLeft = styled('div')`
    padding-left: 6px;
    width: 100%;
`;

export default class BotDesignerReasonNotSchedulingClass extends Component<BotDesignerReasonNotSchedulingProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotDesignerReasonNotSchedulingProps>) {
        super(props);
        this.translation = this.props.getArray([
            ...Object.values(StepsBDMedicalAppointment),
            'Required field',
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
            'Integration',
            'Insurance',
            'Insurance plan',
            'Category',
            'Procedure',
            'Procedure type',
            'Organization unit',
            'Parameters to search for available times',
            'Select the steps to be performed',
            'Steps',
            'Started appointment',
            'Ended appointment',
            'Restart appointment',
            'Appointment step',
            'Doctor',
            'Choose doctor',
            'Appointment',
            'Appointment not confirmed goto',
            'Type',
            'Period of day',
            'Subplan',
            'Occupation area',
            'Location',
            'Type of service',
            'Cannot do action',
            'Telephone',
            'Name',
            'Birth date',
            'Skin color',
            'CPF',
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
            isEmptyGoto: Yup.string().required(this.translation['Required field']),
            isErrorGoto: Yup.string().required(this.translation['Required field']),
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
                                        fieldName: 'integrationUrl',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Service endpoint']}
                                >
                                    <StyledFormikField
                                        type='text'
                                        onBlur={submit}
                                        name={`integrationUrl`}
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
                                            fieldName='attrNameMotherName'
                                            fieldDescription={'Nome da mãe'}
                                            fieldTitle={'Nome da mãe'}
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
                                            fieldName='attrNameTypeOfService'
                                            fieldDescription={this.translation['Type of service']}
                                            fieldTitle={this.translation['Type of service']}
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
                                            fieldName='attrNameReason'
                                            fieldDescription={'Motivo não agendamento'}
                                            fieldTitle={'Motivo não agendamento'}
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
                                            fieldName='attrNameReasonText'
                                            fieldDescription={'Motivo não agendamento (Aberto)'}
                                            fieldTitle={'Motivo não agendamento (Aberto)'}
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
                                            fieldName='attrNameStep'
                                            fieldDescription={this.translation['Appointment step']}
                                            fieldTitle={this.translation['Appointment step']}
                                        />
                                    </WrapperValueRight>
                                </Col50>
                                <Col50 />
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
                                                if (!ev ) return;
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
                                                if (!ev ) return;
                                                values.isErrorGoto = ev.value;
                                                setFieldValue('isErrorGoto', ev.value);
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

export const BotDesignerReasonNotScheduling = i18n(
    withRouter(connect(mapStateToProps, {})(BotDesignerReasonNotSchedulingClass))
);
