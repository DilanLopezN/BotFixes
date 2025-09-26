import { Component } from 'react';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import styled from 'styled-components';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerPatientCreationProps } from './props';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { GetArrayWords } from '../../../../../../../i18n/interface/i18n.interface';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import i18n from '../../../../../../../i18n/components/i18n';
import { IResponseElementBDPatientCreation } from 'kissbot-core';
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

export default class BotDesignerPatientCreationClass extends Component<BotDesignerPatientCreationProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotDesignerPatientCreationProps>) {
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
            'Phone',
            'Cell phone',
            'Identity number',
            'Skin color',
            'Weight',
            'Height',
        ]);
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            attrNameCpf: Yup.string().required(this.translation['Required field']),
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
                    ...(this.props.response.elements[0] as IResponseElementBDPatientCreation),
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
                                            fieldName='attrNameSex'
                                            fieldDescription={this.translation['Gender']}
                                            fieldTitle={this.translation['Gender']}
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
                                            fieldName='attrNameCellPhone'
                                            fieldDescription={this.translation['Cell phone']}
                                            fieldTitle={this.translation['Cell phone']}
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
                                            fieldDescription={this.translation['Phone']}
                                            fieldTitle={this.translation['Phone']}
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
                                            fieldName='identityNumber'
                                            fieldDescription={this.translation['Identity number']}
                                            fieldTitle={this.translation['Identity number']}
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
                                        interaction={values.accountCreatedGoto}
                                        label={this.translation['Account created']}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `accountCreatedGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={this.translation['Account created']}
                                    >
                                        <InteractionSelect
                                            name='accountCreatedGoto'
                                            options={this.props.interactionList}
                                            interactionTypeToShow={['interaction', 'fallback']}
                                            defaultValue={values.accountCreatedGoto}
                                            placeholder={this.translation['Select a interaction']}
                                            style={{ width: '100%' }}
                                            onChange={(ev) => {
                                                setFieldTouched('accountCreatedGoto');
                                                if (!ev) return;
                                                values.accountCreatedGoto = ev.value;
                                                setFieldValue('accountCreatedGoto', ev.value);
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

export const BotDesignerPatientCreation = i18n(
    withRouter(connect(mapStateToProps, {})(BotDesignerPatientCreationClass))
);
