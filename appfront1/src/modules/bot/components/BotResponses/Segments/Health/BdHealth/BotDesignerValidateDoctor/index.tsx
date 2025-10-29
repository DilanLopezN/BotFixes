import { Component } from 'react';
import { Formik, Form } from 'formik';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { GetArrayWords } from '../../../../../../../i18n/interface/i18n.interface';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import i18n from '../../../../../../../i18n/components/i18n';
import { IResponseElementBDValidateDoctor } from 'kissbot-core';
import { CenterDiv, Col100, Col50, Row, WrapperValueLeft, WrapperValueRight } from './styled';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { dispatchSentryError } from '../../../../../../../../utils/Sentry';
import { FormItemInteraction } from '../../../../../../../../shared-v2/FormItemInteraction';
import { BotDesignerValidateDoctorProps } from './props';
import { BotAttrs } from '../../../../../../../../shared/StyledForms/BotAttrs/BotAttrs';

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

export default class BotDesignerValidateDoctorClass extends Component<BotDesignerValidateDoctorProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotDesignerValidateDoctorProps>) {
        super(props);
        this.translation = this.props.getArray([
            'Required field',
            'Service endpoint',
            'Integration',
            'If the received result is empty',
            'Empty result',
            'Select a interaction',
            'Error',
            'According to the answer, redirect to',
            'Success',
        ]);
    }

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
                    ...(this.props.response.elements[0] as IResponseElementBDValidateDoctor),
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
                                            fieldName='attrNameCrm'
                                            fieldDescription={'CRM'}
                                            fieldTitle={'CRM'}
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
                                            fieldName='attrNameUf'
                                            fieldDescription={'UF'}
                                            fieldTitle={'UF'}
                                        />
                                    </WrapperValueLeft>
                                </Col50>
                            </Row>
                            <CenterDiv>{this.translation['According to the answer, redirect to']}:</CenterDiv>
                            <Col100>
                                <FormItemInteraction
                                    interaction={values.gotoSuccess}
                                    label={'GoTo de Sucesso'}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `gotoSuccess`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Success']}
                                >
                                    <InteractionSelect
                                        name='gotoSuccess'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.gotoSuccess}
                                        placeholder={this.translation['Select a interaction']}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('gotoSuccess');
                                            if (!ev) return;
                                            values.gotoSuccess = ev.value;
                                            setFieldValue('gotoSuccess', ev.value);
                                            submit();
                                        }}
                                    />
                                </FormItemInteraction>
                            </Col100>
                            <Col100>
                                <FormItemInteraction
                                    interaction={values.gotoError}
                                    label={'GoTo de Erro'}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `gotoError`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Error']}
                                >
                                    <InteractionSelect
                                        name='gotoError'
                                        options={this.props.interactionList}
                                        interactionTypeToShow={['interaction', 'fallback']}
                                        defaultValue={values.gotoError}
                                        placeholder={this.translation['Select a interaction']}
                                        style={{ width: '100%' }}
                                        onChange={(ev) => {
                                            setFieldTouched('gotoError');
                                            if (!ev) return;
                                            values.gotoError = ev.value;
                                            setFieldValue('gotoError', ev.value);
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

export const BotDesignerValidateDoctor = i18n(withRouter(connect(mapStateToProps, {})(BotDesignerValidateDoctorClass)));
