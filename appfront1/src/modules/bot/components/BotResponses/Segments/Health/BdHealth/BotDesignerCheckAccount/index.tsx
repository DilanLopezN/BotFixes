import { Form, Formik } from 'formik';
import { IResponseElementBDCheckAccount } from 'kissbot-core';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import styled from 'styled-components';
import * as Yup from 'yup';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { dispatchSentryError } from '../../../../../../../../utils/Sentry';
import i18n from '../../../../../../../i18n/components/i18n';
import { GetArrayWords } from '../../../../../../../i18n/interface/i18n.interface';
import { WrapperFieldAttr } from '../WrapperField';
import { BotDesignerCheckAccountProps } from './props';
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

const Col50 = styled('div')`
    width: 50%;
    align-items: center;
    justify-content: center;
    display: flex;
`;

const Col100 = styled('div')`
    width: 100%;
    align-items: center;
    justify-content: center;
    display: flex;
`;

const WrapperValueRight = styled('div')`
    padding-right: 6px;
    width: 100%;
`;

const WrapperValueLeft = styled('div')`
    padding-left: 6px;
    width: 100%;
`;

export default class BotDesignerCheckAccountClass extends Component<BotDesignerCheckAccountProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotDesignerCheckAccountProps>) {
        super(props);
        this.translation = this.props.getArray([
            'Required field',
            'Birth date',
            'Service endpoint',
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
            'Name',
            'Gender',
            'Account created',
            'Account not exists',
            'Existing account',
            'Account exists, data mismatch',
            'If the account exists but data mismatch',
            'Email',
            'Name',
            'Sex',
            'Phone',
            'Id',
            'CPF',
            'Next appointment',
            'Last appointment',
            'Skin color',
            'Weight',
            'Height',
        ]);
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            attrNameCpf: Yup.string().required(this.translation['Required field']),
            accountExistsGoto: Yup.string().required(this.translation['Required field']),
            accountNotExistsGoto: Yup.string().required(this.translation['Required field']),
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
                    ...(this.props.response.elements[0] as IResponseElementBDCheckAccount),
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
                                            fieldName='attrNameEmail'
                                            fieldDescription={this.translation['Email']}
                                            fieldTitle={this.translation['Email']}
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
                                            fieldName='attrNameName'
                                            fieldDescription={this.translation['Name']}
                                            fieldTitle={this.translation['Name']}
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
                                            fieldDescription={this.translation['Phone']}
                                            fieldTitle={this.translation['Phone']}
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
                                            fieldDescription={this.translation['Sex']}
                                            fieldTitle={this.translation['Sex']}
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
                                            fieldName='attrNameWeight'
                                            fieldDescription={this.translation['Weight']}
                                            fieldTitle={this.translation['Weight']}
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
                                            fieldName='attrNameId'
                                            fieldDescription={this.translation['Id']}
                                            fieldTitle={this.translation['Id']}
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
                                            fieldName='attrNameColor'
                                            fieldDescription={this.translation['Skin color']}
                                            fieldTitle={this.translation['Skin color']}
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
                                            fieldName='attrNameLastAppointmentDate'
                                            fieldDescription={this.translation['Last appointment']}
                                            fieldTitle={this.translation['Last appointment']}
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
                                            fieldName='attrNameNextAppointmentDate'
                                            fieldDescription={this.translation['Next appointment']}
                                            fieldTitle={this.translation['Next appointment']}
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
                            <CenterDiv>{this.translation['According to the answer, redirect to']}:</CenterDiv>
                            <Col100>
                                <WrapperValueRight>
                                    <FormItemInteraction
                                        interaction={values.accountExistsGoto}
                                        label={this.translation['Existing account']}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `accountExistsGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={this.translation['Existing account']}
                                    >
                                        <InteractionSelect
                                            name='accountExistsGoto'
                                            options={this.props.interactionList}
                                            interactionTypeToShow={['interaction', 'fallback']}
                                            defaultValue={values.accountExistsGoto}
                                            placeholder={this.translation['Select a interaction']}
                                            style={{ width: '100%' }}
                                            onChange={(ev) => {
                                                setFieldTouched('accountExistsGoto');
                                                if (!ev || !ev.value) {
                                                    setFieldValue('accountExistsGoto', '');
                                                    values.accountExistsGoto = '';
                                                    return submit();
                                                }
                                                values.accountExistsGoto = ev.value;
                                                setFieldValue('accountExistsGoto', ev.value);
                                                submit();
                                            }}
                                        />
                                    </FormItemInteraction>
                                </WrapperValueRight>
                            </Col100>
                            <Col100>
                                <WrapperValueRight>
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
                                                if (!ev || !ev.value) {
                                                    setFieldValue('accountNotExistsGoto', '');
                                                    values.accountNotExistsGoto = '';
                                                    return submit();
                                                }
                                                values.accountNotExistsGoto = ev.value;
                                                setFieldValue('accountNotExistsGoto', ev.value);
                                                submit();
                                            }}
                                        />
                                    </FormItemInteraction>
                                </WrapperValueRight>
                            </Col100>
                            <Col100>
                                <WrapperValueRight>
                                    <FormItemInteraction
                                        interaction={values.accountExistsDataMismatchGoto}
                                        label={'Data nascimento incorreta'}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `accountExistsDataMismatchGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={'Data nascimento incorreta'}
                                    >
                                        <InteractionSelect
                                            name='accountExistsDataMismatchGoto'
                                            options={this.props.interactionList}
                                            interactionTypeToShow={['interaction', 'fallback']}
                                            defaultValue={values.accountExistsDataMismatchGoto}
                                            placeholder={this.translation['Select a interaction']}
                                            style={{ width: '100%' }}
                                            onChange={(ev) => {
                                                setFieldTouched('accountExistsDataMismatchGoto');
                                                if (!ev || !ev.value) {
                                                    setFieldValue('accountExistsDataMismatchGoto', '');
                                                    values.accountExistsDataMismatchGoto = '';
                                                    return submit();
                                                }
                                                values.accountExistsDataMismatchGoto = ev.value;
                                                setFieldValue('accountExistsDataMismatchGoto', ev.value);
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
                                        label={this.translation['Empty result']}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `isErrorGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={this.translation['If the received result is empty']}
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
                                                if (!ev || !ev.value) {
                                                    setFieldValue('isErrorGoto', '');
                                                    values.isErrorGoto = '';
                                                    return submit();
                                                }
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
                                        interaction={values.accountMismatchGoto}
                                        label={'Conflito ao buscar usuário'}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `accountMismatchGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={'Ocorreu algum conflito ao encontrar usuário'}
                                    >
                                        <InteractionSelect
                                            name='accountMismatchGoto'
                                            options={this.props.interactionList}
                                            interactionTypeToShow={['interaction', 'fallback']}
                                            defaultValue={values.accountMismatchGoto}
                                            placeholder={this.translation['Select a interaction']}
                                            style={{ width: '100%' }}
                                            onChange={(ev) => {
                                                setFieldTouched('accountMismatchGoto');
                                                if (!ev || !ev.value) {
                                                    setFieldValue('accountMismatchGoto', '');
                                                    values.accountMismatchGoto = '';
                                                    return submit();
                                                }
                                                values.accountMismatchGoto = ev.value;
                                                setFieldValue('accountMismatchGoto', ev.value);
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

export const BotDesignerCheckAccount = i18n(withRouter(connect(mapStateToProps, {})(BotDesignerCheckAccountClass)));
