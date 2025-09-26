import { Component } from 'react';
import { Formik, Form } from 'formik';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { BotDesignerMedicalScaleProps } from './props';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { GetArrayWords } from '../../../../../../../i18n/interface/i18n.interface';
import { StyledFormikField } from '../../../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import i18n from '../../../../../../../i18n/components/i18n';
import { IResponseElementBDMedicalScale } from 'kissbot-core';
import { CenterDiv, Col100, Row, WrapperValueRight } from './styled';
import { InteractionSelect } from '../../../../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { dispatchSentryError } from '../../../../../../../../utils/Sentry';
import { FormItemInteraction } from '../../../../../../../../shared-v2/FormItemInteraction';

export default class BotDesignerMedicalScaleClass extends Component<BotDesignerMedicalScaleProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotDesignerMedicalScaleProps>) {
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
                    ...(this.props.response.elements[0] as IResponseElementBDMedicalScale),
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
                            <CenterDiv>{this.translation['According to the answer, redirect to']}:</CenterDiv>
                            <Col100>
                                <FormItemInteraction
                                    interaction={values.isErrorGoto}
                                    label={this.translation['Error']}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: `isErrorGoto`,
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.translation['Error']}
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
                            </Col100>
                            <Col100>
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

export const BotDesignerMedicalScale = i18n(withRouter(connect(mapStateToProps, {})(BotDesignerMedicalScaleClass)));
