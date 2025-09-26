import { Component } from 'react';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import styled from 'styled-components';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerPatientRecoverPasswordProps } from './props';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import i18n from '../../../../../../../i18n/components/i18n';
import { IResponseElementBDPatientRecoverPassword } from 'kissbot-core';
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

const WrapperValueRight = styled('div')`
    padding-right: 6px;
    width: 100%;
`;

const WrapperValueLeft = styled('div')`
    padding-left: 6px;
    width: 100%;
`;

export default class BotDesignerPatientRecoverPasswordClass extends Component<BotDesignerPatientRecoverPasswordProps> {
    constructor(props: Readonly<BotDesignerPatientRecoverPasswordProps>) {
        super(props);
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            url: Yup.string().required(this.props.getTranslation('Required field')),
            integrationId: Yup.string().required(this.props.getTranslation('Required field')),
            attrNameCpf: Yup.string().required(this.props.getTranslation('Required field')),
            attrNameBornDate: Yup.string().required(this.props.getTranslation('Required field')),
            isErrorGoto: Yup.string().required(this.props.getTranslation('Required field')),
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
                    ...(this.props.response.elements[0] as IResponseElementBDPatientRecoverPassword),
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
                                    label={this.props.getTranslation('Service endpoint')}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'url',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('Service endpoint')}
                                >
                                    <StyledFormikField
                                        type='text'
                                        onBlur={submit}
                                        name={`url`}
                                        placeholder={this.props.getTranslation('Service endpoint')}
                                    />
                                </LabelWrapper>
                            </Row>
                            <Row>
                                <Col50>
                                    <WrapperValueRight>
                                        <LabelWrapper
                                            label={this.props.getTranslation('Integration')}
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'integrationId',
                                                isSubmitted: this.props.submitted,
                                            }}
                                            tooltip={this.props.getTranslation('Integration')}
                                        >
                                            <StyledFormikField
                                                type='text'
                                                onBlur={submit}
                                                name={`integrationId`}
                                                placeholder={this.props.getTranslation('Integration')}
                                            />
                                        </LabelWrapper>
                                    </WrapperValueRight>
                                </Col50>
                                <Col50 />
                            </Row>
                            <CenterDiv>{this.props.getTranslation('Fill in with equivalent attributes')}:</CenterDiv>
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
                                            fieldDescription={this.props.getTranslation('Telephone')}
                                            fieldTitle={this.props.getTranslation('Telephone')}
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
                                            fieldDescription={this.props.getTranslation('Birth date')}
                                            fieldTitle={this.props.getTranslation('Birth date')}
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
                                            fieldName='attrNameZipCode'
                                            fieldDescription={'CEP'}
                                            fieldTitle={'CEP'}
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
                                            fieldDescription={this.props.getTranslation('Insurance number')}
                                            fieldTitle={this.props.getTranslation('Insurance number')}
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
                            <CenterDiv>{this.props.getTranslation('According to the answer, redirect to')}:</CenterDiv>
                            <Col100>
                                <WrapperValueRight>
                                    <FormItemInteraction
                                        interaction={values.isErrorGoto}
                                        label={this.props.getTranslation('Error')}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: `isErrorGoto`,
                                            isSubmitted: this.props.submitted,
                                        }}
                                        tooltip={this.props.getTranslation('In case of error redirect to')}
                                    >
                                        <InteractionSelect
                                            name='isErrorGoto'
                                            options={this.props.interactionList}
                                            interactionTypeToShow={['interaction', 'fallback']}
                                            defaultValue={values.isErrorGoto}
                                            placeholder={this.props.getTranslation('Select a interaction')}
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

export const BotDesignerPatientRecoverPassword = i18n(
    withRouter(connect(mapStateToProps, {})(BotDesignerPatientRecoverPasswordClass))
);
