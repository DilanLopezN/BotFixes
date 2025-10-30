import React, { Component } from 'react'
import { BotResponseMedicalAppointmentProps } from './BotResponseMedicalAppointmentProps'
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import { LabelWrapper } from '../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { BotAttrs } from '../../../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import styled from 'styled-components';
import { StyledFormikField } from '../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { GetArrayWords } from '../../../../../../i18n/interface/i18n.interface';
import I18n from '../../../../../../i18n/components/i18n';
import { InteractionSelect } from '../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { IResponseElementMedicalAppointment } from 'kissbot-core';
import Toggle from '../../../../../../../shared/Toggle/Toggle';
import { dispatchSentryError } from '../../../../../../../utils/Sentry';
import { FormItemInteraction } from '../../../../../../../shared-v2/FormItemInteraction';

const CenterDiv = styled("div")`
    width: 100%;
    display:flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    padding: 8px 0;
    margin: 7px 0;
    border-bottom: 1px #dcdcdc solid;
`;

const Row = styled("div")`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const Col50 = styled("div")`
    width: 50%;
    align-items: center;
    justify-content: center;
    display: flex;
`;

const Col100 = styled("div")`
    width: 100%;
    align-items: center;
    justify-content: center;
    display: flex;
`;

const WrapperValueRight = styled("div")`
    padding-right: 6px;
    width:100%;
`;

const WrapperValueLeft = styled("div")`
    padding-left: 6px;
    width:100%;
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
    return <LabelWrapper
        label={fieldTitle}
        validate={{
            touched, errors,
            fieldName,
            isSubmitted: submitted
        }}
        tooltip={fieldDescription}>
        <BotAttrs
            value={{
                value: values[fieldName] ? values[fieldName] : '',
                label: values[fieldName] ? values[fieldName] : ''
            }}
            onCreateOption={event => {
                setFieldTouched(fieldName);
                values[fieldName] = event;
                setFieldValue(fieldName, event);
                submit();
            }}
            onChange={event => {
                setFieldTouched(fieldName);
                values[fieldName] = event.value;
                setFieldValue(fieldName, event.value);
                submit();
            }}
            showOnly={['entity', 'others']}
            creatable
        />
    </LabelWrapper>
}

export default class BotResponseMedicalAppointmentClass extends Component<BotResponseMedicalAppointmentProps> {
    private translation: GetArrayWords;
    constructor(props: Readonly<BotResponseMedicalAppointmentProps>) {
        super(props);
        this.translation = this.props.getArray([
            'Required field',
            'Service username',
            'Service password',
            'Birth date',
            'Procedure name',
            'Medical covenant',
            'Telephone',
            'Service endpoint',
            'Specialty',
            'Resource',
            'Fill in with equivalent attributes',
            'According to the answer, redirect to',
            'Empty result',
            'If the received result is empty',
            'Select a interaction',
            'In case of error redirect to',
            'If filled will lead to an transboard interaction',
            'If you do not have an account send to',
            'No account',
            'Error',
            'Transboard',
            'Transfer to an transboard interaction',
            'Appointment type',
            'Unity filial',
            'Service group',
            'Day period',
            'Week day',
            'Started appointment',
            'Ended appointment',
            'Restart appointment',
            'Appointment step',
            'Appointment not confirmed goto',
            'Weigth',
            'Plan',
            'If this option is activated, the most recent times of the base will be shown',
            'show recent times',
        ])
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            serviceEndpointAttrName: Yup.string()
                .required(this.translation['Required field']),
            attrNameCpf: Yup.string()
                .required(this.translation['Required field']),
            attrNameDataNascimento: Yup.string()
                .required(this.translation['Required field']),
            isEmptyGoto: Yup.string()
                .required(this.translation['Required field']),
            isErrorGoto: Yup.string()
                .required(this.translation['Required field']),
            notAccountGoto: Yup.string()
                .required(this.translation['Required field']),
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render() {
        return <Formik
            initialValues={{
                ...this.props.response.elements[0] as IResponseElementMedicalAppointment,
            }}
            onSubmit={() => { }}
            validationSchema={this.getValidationSchema()}
            render={({ values, submitForm, validateForm, setFieldValue, touched, errors, setFieldTouched }) => {
                const submit = () => {
                    validateForm().then((validatedValues: any) => {
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
                    }).catch(e => dispatchSentryError(e))
                };
                return <Form>
                    <CenterDiv>
                        {this.translation['Fill in with equivalent attributes']}:
                    </CenterDiv>
                    <Row>
                        <LabelWrapper
                            label={this.translation['Service endpoint']}
                            validate={{
                                touched, errors,
                                fieldName: 'serviceEndpointAttrName',
                                isSubmitted: this.props.submitted,
                            }}
                            tooltip={this.translation['Service endpoint']}>
                            <StyledFormikField
                                type="text"
                                onBlur={submit}
                                name={`serviceEndpointAttrName`}
                                placeholder={this.translation['Service endpoint']}
                            />
                        </LabelWrapper>
                    </Row>
                    <Row>
                        <Col50>
                            <WrapperValueRight>
                                <LabelWrapper
                                    label={this.translation['Service username']}
                                    validate={{
                                        touched, errors,
                                        fieldName: 'serviceUsernameAttrName',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Service username']}>
                                    <StyledFormikField
                                        type="text"
                                        onBlur={submit}
                                        name={`serviceUsernameAttrName`}
                                        placeholder={this.translation['Service username']}
                                    />
                                </LabelWrapper>
                            </WrapperValueRight>
                        </Col50>
                        <Col50>
                            <WrapperValueLeft>
                                <LabelWrapper
                                    label={this.translation['Service password']}
                                    validate={{
                                        touched, errors,
                                        fieldName: 'servicePasswordAttrName',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Service password']}>
                                    <StyledFormikField
                                        type="text"
                                        onBlur={submit}
                                        name={`servicePasswordAttrName`}
                                        placeholder={this.translation['Service password']}
                                    />
                                </LabelWrapper>
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
                                    fieldName='attrNameTipoAgendamento'
                                    fieldDescription={this.translation['Appointment type']}
                                    fieldTitle={this.translation['Appointment type']}
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
                                    fieldName='attrNameUnidadeHandler'
                                    fieldDescription={this.translation['Unity filial']}
                                    fieldTitle={this.translation['Unity filial']}
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
                                    fieldName='attrNameConvenioHandler'
                                    fieldDescription={this.translation['Medical covenant']}
                                    fieldTitle={this.translation['Medical covenant']}
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
                                    fieldName='attrNameProcedimentoHandler'
                                    fieldDescription={this.translation['Procedure name']}
                                    fieldTitle={this.translation['Procedure name']}
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
                                    fieldName='attrNameEspecialidadeHandler'
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
                                    fieldName='attrNameRecursoHandler'
                                    fieldDescription={this.translation['Resource']}
                                    fieldTitle={this.translation['Resource']}
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
                                    fieldName='attrNameGrupoServicoHendler'
                                    fieldDescription={this.translation['Service group']}
                                    fieldTitle={this.translation['Service group']}
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
                                    fieldName='attNamePeso'
                                    fieldDescription={this.translation['Weigth']}
                                    fieldTitle={this.translation['Weigth']}
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
                                    fieldName='attrNamePlanoHandler'
                                    fieldDescription='Plano'
                                    fieldTitle='Plano'
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
                                    fieldName='attrNameDiaSemana'
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
                                    fieldName='attrNamePeriodoDia'
                                    fieldDescription={this.translation['Day period']}
                                    fieldTitle={this.translation['Day period']}
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
                                    fieldName='attrNameAgendamentoIniciado'
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
                                    fieldName='attrNameAgendamentoFinalizado'
                                    fieldDescription={this.translation['Ended appointment']}
                                    fieldTitle={this.translation['Ended appointment']}
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
                                    fieldName='attrNameReiniciarAgendamento'
                                    fieldDescription={this.translation['Restart appointment']}
                                    fieldTitle={this.translation['Restart appointment']}
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

                    <Col50>
                        <WrapperValueRight>
                            <LabelWrapper
                                validate={{
                                    touched, errors,
                                    fieldName: `appointmentsOrderByRecent`,
                                    isSubmitted: this.props.submitted
                                }}
                                label={this.translation['show recent times']}
                                tooltip={this.translation['If this option is activated, the most recent times of the base will be shown']}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Toggle
                                        tabIndex='52'
                                        checked={values?.appointmentsOrderByRecent === undefined ? false : values?.appointmentsOrderByRecent}
                                        onChange={() => {
                                            setFieldValue('appointmentsOrderByRecent', !values.appointmentsOrderByRecent)
                                            values['appointmentsOrderByRecent'] = !values.appointmentsOrderByRecent;
                                            submit()
                                        }}
                                    />
                                </div>
                            </LabelWrapper>
                        </WrapperValueRight>
                    </Col50>

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
                                    fieldDescription={'Attribute with name'}
                                    fieldTitle={'Name'}
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
                                    fieldName='attrNameSex'
                                    fieldDescription={'Attribute with name sex'}
                                    fieldTitle={'Sexo'}
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
                                    fieldDescription='CPF'
                                    fieldTitle='CPF'
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
                                    fieldName='attrNameDataNascimento'
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
                                    fieldName='attrNameEmail'
                                    fieldDescription='Email'
                                    fieldTitle='Email'
                                />
                            </WrapperValueLeft>
                        </Col50>
                    </Row>
                    <CenterDiv>
                        {this.translation['According to the answer, redirect to']}:
                    </CenterDiv>
                    <Col100>
                        <WrapperValueRight>
                            <FormItemInteraction
                                  interaction={values.isEmptyGoto}
                                label={this.translation['Empty result']}
                                validate={{
                                    touched, errors,
                                    fieldName: `isEmptyGoto`,
                                    isSubmitted: this.props.submitted
                                }}
                                tooltip={this.translation['If the received result is empty']}
                            >
                                <InteractionSelect
                                    name="isEmptyGoto"
                                    options={this.props.interactionList}
                                    interactionTypeToShow={['interaction', 'fallback']}
                                    defaultValue={values.isEmptyGoto}
                                    placeholder={this.translation['Select a interaction']}
                                    style={{ width: "100%" }}
                                    onChange={(ev) => {
                                        setFieldTouched('isEmptyGoto');
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
                                    touched, errors,
                                    fieldName: `isErrorGoto`,
                                    isSubmitted: this.props.submitted
                                }}
                                tooltip={this.translation['In case of error redirect to']}
                            >
                                <InteractionSelect
                                    name="isErrorGoto"
                                    options={this.props.interactionList}
                                    interactionTypeToShow={['interaction', 'fallback']}
                                    defaultValue={values.isErrorGoto}
                                    placeholder={this.translation['Select a interaction']}
                                    style={{ width: "100%" }}
                                    onChange={(ev) => {
                                        setFieldTouched('isErrorGoto');
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
                                  interaction={values.notAccountGoto}
                                label={this.translation['No account']}
                                validate={{
                                    touched, errors,
                                    fieldName: `notAccountGoto`,
                                    isSubmitted: this.props.submitted
                                }}
                                tooltip={this.translation['If you do not have an account send to']}
                            >
                                <InteractionSelect
                                    name="notAccountGoto"
                                    options={this.props.interactionList}
                                    interactionTypeToShow={['interaction', 'fallback']}
                                    defaultValue={values.notAccountGoto}
                                    placeholder={this.translation['Select a interaction']}
                                    style={{ width: "100%" }}
                                    onChange={(ev) => {
                                        setFieldTouched('notAccountGoto');
                                        values.notAccountGoto = ev.value;
                                        setFieldValue('notAccountGoto', ev.value);
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
                                    touched, errors,
                                    fieldName: `isAgendamentoNaoConfirmadoGoto`,
                                    isSubmitted: this.props.submitted
                                }}
                                tooltip={this.translation['Appointment not confirmed goto']}
                            >
                                <InteractionSelect
                                    name="isAgendamentoNaoConfirmadoGoto"
                                    options={this.props.interactionList}
                                    interactionTypeToShow={['interaction', 'fallback']}
                                    defaultValue={values.isAgendamentoNaoConfirmadoGoto}
                                    placeholder={this.translation['Select a interaction']}
                                    style={{ width: "100%" }}
                                    onChange={(ev) => {
                                        setFieldTouched('isAgendamentoNaoConfirmadoGoto');
                                        values.isAgendamentoNaoConfirmadoGoto = ev.value;
                                        setFieldValue('isAgendamentoNaoConfirmadoGoto', ev.value);
                                        submit();
                                    }}
                                />
                            </FormItemInteraction>
                        </WrapperValueRight>
                    </Col100>
                    <CenterDiv>
                        {this.translation['If filled will lead to an transboard interaction']}:
                    </CenterDiv>
                    <FormItemInteraction
                          interaction={values.transferToHumanGoto}
                        label={this.translation['Transboard']}
                        validate={{
                            touched, errors,
                            fieldName: `transferToHumanGoto`,
                            isSubmitted: this.props.submitted
                        }}
                        tooltip={this.translation['Transfer to an transboard interaction']}
                    >
                        <InteractionSelect
                            name="transferToHumanGoto"
                            options={this.props.interactionList}
                            interactionTypeToShow={['interaction', 'fallback']}
                            defaultValue={values.transferToHumanGoto}
                            placeholder={this.translation['Select a interaction']}
                            style={{ width: "100%" }}
                            onChange={(ev) => {
                                setFieldTouched('transferToHumanGoto');
                                values.transferToHumanGoto = ev.value;
                                setFieldValue('transferToHumanGoto', ev.value);
                                submit();
                            }}
                        />
                    </FormItemInteraction>
                </Form>
            }}
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    entitiesList: state.entityReducer.entitiesList,
    botAttributes: state.botReducer.botAttributes,
    interactionList: state.botReducer.interactionList,
});

export const BotResponseMedicalAppointment = I18n(withRouter(connect(
    mapStateToProps,
    {}
)(BotResponseMedicalAppointmentClass)));