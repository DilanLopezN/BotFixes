import React, { Component } from 'react'
import { BotResponseMngsCheckAppointmentProps } from './BotResponseMngsCheckAppointmentProps'
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
import { dispatchSentryError } from '../../../../../../../utils/Sentry';
import { FormItemInteraction } from '../../../../../../../shared-v2/FormItemInteraction';

const CenterDiv = styled("div")`
    width: 100%;
    display:flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    padding: 6px 0;
    margin: 5px 0;
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

export default class BotResponseMngsCheckAppointmentClass extends Component<BotResponseMngsCheckAppointmentProps> {
    private translation: GetArrayWords;
    constructor(props: Readonly<BotResponseMngsCheckAppointmentProps>) {
        super(props);
        this.translation = this.props.getArray([
            'Required field',
            'Service username',
            'Service password',
            'Service endpoint',
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
            'Attribute with name',
            'Save token in attribute',
            'Attribute with name sex',
            'Name',
            'If the account was created, go to the interaction',
            'if the account does not exist, go to the interaction',
            'if the account exists, go to the interaction',
            'if an error occurs, go to the interaction',
            'Account does not exist',
            'Account exists',
            'Id',
            'Birth date',
            'Telephone',
            'Action ignored goto',
            'When empty will go to interaction',
            'Is empty goto',
        ])
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            serviceEndpointAttrName: Yup.string()
                .required(this.translation['Required field']),
            attrNameCpf: Yup.string()
                .required(this.translation['Required field']),
            serviceUsernameAttrName: Yup.string()
                .required(this.translation['Required field']),
            servicePasswordAttrName: Yup.string()
                .required(this.translation['Required field']),
            isErrorGoto: Yup.string()
                .required(this.translation['Required field']),
            accountNotExistsGoto: Yup.string()
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
                ...this.props.response.elements[0]
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
                        <WrapperValueRight>
                            <WrapperFieldAttr
                                errors={errors}
                                values={values}
                                setFieldTouched={setFieldTouched}
                                setFieldValue={setFieldValue}
                                submit={submit}
                                submitted={this.props.submitted}
                                touched={touched}
                                fieldName='attrNameId'
                                fieldDescription={this.translation['Id']}
                                fieldTitle={this.translation['Id']}
                            />
                        </WrapperValueRight>
                        <WrapperValueRight>
                            <WrapperFieldAttr
                                errors={errors}
                                values={values}
                                setFieldTouched={setFieldTouched}
                                setFieldValue={setFieldValue}
                                submit={submit}
                                submitted={this.props.submitted}
                                touched={touched}
                                fieldName='attrNameTypeCheck'
                                fieldDescription={'Type of view'}
                                fieldTitle={'Type of view'}
                            />
                        </WrapperValueRight>
                    </Row>
                    <CenterDiv>
                        {this.translation['When empty will go to interaction']}:
                    </CenterDiv>
                    <FormItemInteraction    
                        interaction={values.isEmptyGoto}
                        label={this.translation['Is empty goto']}
                        validate={{
                            touched, errors,
                            fieldName: `isEmptyGoto`,
                            isSubmitted: this.props.submitted
                        }}
                        tooltip={this.translation['Is empty goto']}
                    >
                        <InteractionSelect
                            name="isEmptyGoto"
                            key={`isEmptyGoto`}
                            options={this.props.interactionList}
                            placeholder={this.translation['Select a interaction']}
                            interactionTypeToShow={['interaction', 'fallback']}
                            style={{ width: "100%" }}
                            defaultValue={values.isEmptyGoto}
                            onChange={event => {
                                setFieldTouched('isEmptyGoto');
                                values.isEmptyGoto = event.value;
                                setFieldValue('isEmptyGoto', event.value);
                                submit();
                            }}
                        />
                    </FormItemInteraction>

                    <CenterDiv>
                        {this.translation['if an error occurs, go to the interaction']}:
                    </CenterDiv>
                    <FormItemInteraction
                        interaction={values.isErrorGoto}
                        label={this.translation['Error']}
                        validate={{
                            touched, errors,
                            fieldName: `isErrorGoto`,
                            isSubmitted: this.props.submitted
                        }}
                        tooltip={this.translation['if an error occurs, go to the interaction']}
                    >
                        <InteractionSelect
                            name="isErrorGoto"
                            key={`isErrorGoto`}
                            options={this.props.interactionList}
                            interactionTypeToShow={['interaction', 'fallback']}
                            defaultValue={values.isErrorGoto}
                            placeholder={this.translation['Select a interaction']}
                            style={{ width: "100%" }}
                            onChange={event => {
                                setFieldTouched('isErrorGoto');
                                if (!event) return;
                                values.isErrorGoto = event.value;
                                setFieldValue('isErrorGoto', event.value);
                                submit();
                            }}
                        />
                    </FormItemInteraction>
                    <CenterDiv>
                        {this.translation['if the account does not exist, go to the interaction']}:
                    </CenterDiv>

                    <FormItemInteraction
                        interaction={values.accountNotExistsGoto}
                        label={this.translation['Account does not exist']}
                        validate={{
                            touched, errors,
                            fieldName: `accountNotExistsGoto`,
                            isSubmitted: this.props.submitted
                        }}
                        tooltip={this.translation['if the account does not exist, go to the interaction']}
                    >
                        <InteractionSelect
                            name="accountNotExistsGoto"
                            key={`accountNotExistsGoto`}
                            options={this.props.interactionList}
                            placeholder={this.translation['Select a interaction']}
                            interactionTypeToShow={['interaction', 'fallback']}
                            style={{ width: "100%" }}
                            defaultValue={values.accountNotExistsGoto}
                            onChange={event => {
                                setFieldTouched('accountNotExistsGoto');
                                values.accountNotExistsGoto = event.value;
                                setFieldValue('accountNotExistsGoto', event.value);
                                submit();
                            }}
                        />
                    </FormItemInteraction>
                    <CenterDiv />
                    <FormItemInteraction
                        interaction={values.actionIgnoredGoto}
                        label={this.translation['Action ignored goto']}
                        validate={{
                            touched, errors,
                            fieldName: `actionIgnoredGoto`,
                            isSubmitted: this.props.submitted
                        }}
                        tooltip={this.translation['Action ignored goto']}
                    >
                        <InteractionSelect
                            name="actionIgnoredGoto"
                            key={`actionIgnoredGoto`}
                            options={this.props.interactionList}
                            placeholder={this.translation['Select a interaction']}
                            interactionTypeToShow={['interaction', 'fallback']}
                            style={{ width: "100%" }}
                            defaultValue={values.actionIgnoredGoto}
                            onChange={event => {
                                setFieldTouched('actionIgnoredGoto');
                                values.actionIgnoredGoto = event.value;
                                setFieldValue('actionIgnoredGoto', event.value);
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

export const BotResponseMngsCheckAppointment = I18n(withRouter(connect(
    mapStateToProps,
    {}
)(BotResponseMngsCheckAppointmentClass)));