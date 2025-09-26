import { Component } from 'react';
import { connect } from 'react-redux';
import { BotResponseProps } from '../../../../interfaces';
import { Formik, Form } from 'formik';
import { IResponseElementBDConfirmation } from 'kissbot-core';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import I18n from '../../../../../../../i18n/components/i18n';
import * as Yup from 'yup';
import { dispatchSentryError } from '../../../../../../../../utils/Sentry';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { InputSimple } from '../../../../../../../../shared/InputSample/InputSimple';
import styled from 'styled-components';

const TextFieldWrapper = styled("div")`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
    position: relative;
`

interface BotResponseBDConfirmationProps extends BotResponseProps, I18nProps {}

export class BotResponseBDConfirmationClass extends Component<BotResponseBDConfirmationProps> {
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(props: Readonly<BotResponseBDConfirmationProps>) {
        super(props);
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        const { getTranslation } = this.props;
        return Yup.object().shape({
            url: Yup.string().required(getTranslation('This field is required')),
            integrationId: Yup.string().required(getTranslation('This field is required')),
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange({ ...response });
    };

    render() {
        const elements: Array<IResponseElementBDConfirmation> = this.props.response
            .elements as Array<IResponseElementBDConfirmation>;
        return (
            <Formik
                initialValues={{ ...(elements[0] as IResponseElementBDConfirmation) }}
                validationSchema={this.getValidationSchema()}
                onSubmit={() => {}}
                render={({ values, submitForm, validateForm, setFieldValue, touched, errors }) => {
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
                            <TextFieldWrapper>
                                <LabelWrapper
                                    label='Url'
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'url',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('Url')}
                                >
                                    <InputSimple
                                        type='text'
                                        value={values.url}
                                        onBlur={submit}
                                        name={'url'}
                                        placeholder={'Url'}
                                        onChange={(event) => {
                                            values.url = event.target.value;
                                            setFieldValue(`url`, event.target.value);
                                            submit();
                                        }}
                                    />
                                </LabelWrapper>
                                <LabelWrapper
                                    label='Integration id'
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'integrationId',
                                        isSubmitted: this.props.submitted,
                                    }}
                                    tooltip={this.props.getTranslation('Integration id')}
                                >
                                    <InputSimple
                                        type='text'
                                        value={values.integrationId}
                                        onBlur={submit}
                                        name={'integrationId'}
                                        placeholder={'Integration id'}
                                        onChange={(event) => {
                                            values.integrationId = event.target.value;
                                            setFieldValue(`integrationId`, event.target.value);
                                            submit();
                                        }}
                                    />
                                </LabelWrapper>
                            </TextFieldWrapper>
                        </Form>
                    );
                }}
            />
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const BotResponseBDConfirmation = I18n(connect(mapStateToProps, {})(BotResponseBDConfirmationClass));
