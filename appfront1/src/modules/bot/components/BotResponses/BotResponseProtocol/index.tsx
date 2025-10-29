import { Form, Formik } from 'formik';
import {  IResponseElementProtocol } from 'kissbot-core';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import styled from 'styled-components';
import * as Yup from 'yup';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import i18n from '../../../../i18n/components/i18n';
import { BotAttrs } from '../../../../../shared/StyledForms/BotAttrs/BotAttrs';

const Row = styled('div')`
    width: 100%;
    display: flex;
    justify-content: center;
`;

export default class BotResponseProtocolClass extends Component<any> {
    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            insuranceCardNumber: Yup.string().required('Required field'),
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
                    ...(this.props.response.elements[0] as IResponseElementProtocol),
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
                                if (Object.keys(validatedValues).length !== 0) {
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
                                    label={'Carteirinha do beneficiário'}
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'url',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={'Carteirinha do beneficiário'}
                                >
                                    <BotAttrs
                                        value={{
                                            value: values.insuranceCardNumber ? values.insuranceCardNumber : '',
                                            label: values.insuranceCardNumber ? values.insuranceCardNumber : '',
                                        }}
                                        onCreateOption={(event) => {
                                            setFieldTouched('insuranceCardNumber');
                                            values.insuranceCardNumber = event;
                                            setFieldValue('insuranceCardNumber', event);
                                            submit();
                                        }}
                                        onChange={(event) => {
                                            setFieldTouched('insuranceCardNumber');
                                            values.insuranceCardNumber = event.value;
                                            setFieldValue('insuranceCardNumber', event.value);
                                            submit();
                                        }}
                                        showOnly={['entity', 'others']}
                                        creatable
                                    />
                                </LabelWrapper>
                            </Row>
                        </Form>
                    );
                }}
            />
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const BotResponseProtocol = i18n(withRouter(connect(mapStateToProps, {})(BotResponseProtocolClass)));
