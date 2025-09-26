import { Component } from 'react';
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import styled from 'styled-components';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerCheckDoctorProps } from './props';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import i18n from '../../../../../../../i18n/components/i18n';
import { IResponseElementBDCheckDoctor } from 'kissbot-core';
import { dispatchSentryError } from '../../../../../../../../utils/Sentry';
import { WrapperFieldAttr } from '../WrapperField';
import { Col, Row } from 'antd';
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

export default class BotDesignerCheckDoctorClass extends Component<BotDesignerCheckDoctorProps> {
    constructor(props: Readonly<BotDesignerCheckDoctorProps>) {
        super(props);
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            attrNamePhone: Yup.string().required(this.props.getTranslation('Required field')),
            attrNameDocNumber: Yup.string().required(this.props.getTranslation('Required field')),
            attrNameDoctorData: Yup.string().required(this.props.getTranslation('Required field')),
            integrationId: Yup.string().required(this.props.getTranslation('Required field')),
            url: Yup.string().required(this.props.getTranslation('Required field')),
            notFindedDoctorGoto: Yup.string().required(this.props.getTranslation('Required field')),
            askDocNumberGoto: Yup.string().required(this.props.getTranslation('Required field')),
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
                    ...(this.props.response.elements[0] as IResponseElementBDCheckDoctor),
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
                            </Row>

                            <CenterDiv>{this.props.getTranslation('Fill in with equivalent attributes')}:</CenterDiv>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
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
                                </Col>
                                <Col span={12}>
                                    <WrapperFieldAttr
                                        errors={errors}
                                        values={values}
                                        setFieldTouched={setFieldTouched}
                                        setFieldValue={setFieldValue}
                                        submit={submit}
                                        submitted={this.props.submitted}
                                        touched={touched}
                                        fieldName='attrNameDocNumber'
                                        fieldDescription={this.props.getTranslation('Document number')}
                                        fieldTitle={this.props.getTranslation('Document number')}
                                    />
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]}>
                                <Col span={12}>
                                    <WrapperFieldAttr
                                        errors={errors}
                                        values={values}
                                        setFieldTouched={setFieldTouched}
                                        setFieldValue={setFieldValue}
                                        submit={submit}
                                        submitted={this.props.submitted}
                                        touched={touched}
                                        fieldName='attrNameDoctorData'
                                        fieldDescription={this.props.getTranslation('Doctor data')}
                                        fieldTitle={this.props.getTranslation('Doctor data')}
                                    />
                                </Col>
                            </Row>

                            <CenterDiv>{this.props.getTranslation('According to the answer, redirect to')}:</CenterDiv>
                            <Row>
                                <FormItemInteraction
                                    interaction={values.notFindedDoctorGoto}
                                    label={this.props.getTranslation("When you can't find the doctor")}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `notFindedDoctorGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation("When you can't find the doctor")}
                                >
                                    <InteractionSelect
                                        name='notFindedDoctorGoto'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.notFindedDoctorGoto}
                                        placeholder={this.props.getTranslation('Select a interaction')}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('notFindedDoctorGoto');
                                            if (!ev) return;
                                            values.notFindedDoctorGoto = ev.value;
                                            setFieldValue('notFindedDoctorGoto', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </Row>
                            <Row>
                                <FormItemInteraction
                                    interaction={values.askDocNumberGoto}
                                    label={this.props.getTranslation('When the document number is empty')}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `askDocNumberGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('When the document number is empty')}
                                >
                                    <InteractionSelect
                                        name='askDocNumberGoto'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.askDocNumberGoto}
                                        placeholder={this.props.getTranslation('Select a interaction')}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('askDocNumberGoto');
                                            if (!ev) return;
                                            values.askDocNumberGoto = ev.value;
                                            setFieldValue('askDocNumberGoto', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </Row>
                            <Row>
                                <FormItemInteraction
                                    interaction={values.gotoCpfQuestion}
                                    label={this.props.getTranslation('Go to instead of asking for document number')}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `gotoCpfQuestion`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('Go to instead of asking for document number')}
                                >
                                    <InteractionSelect
                                        name='gotoCpfQuestion'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.gotoCpfQuestion}
                                        placeholder={this.props.getTranslation('Select a interaction')}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('gotoCpfQuestion');
                                            if (!ev) return;
                                            values.gotoCpfQuestion = ev.value;
                                            setFieldValue('gotoCpfQuestion', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
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

export const BotDesignerCheckDoctor = i18n(withRouter(connect(mapStateToProps, {})(BotDesignerCheckDoctorClass)));
