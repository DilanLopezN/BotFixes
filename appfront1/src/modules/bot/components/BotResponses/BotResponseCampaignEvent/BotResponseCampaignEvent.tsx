import { Component } from "react";
import { Formik, Form } from 'formik';
import { BotResponseProps } from "../interfaces";
import styled from 'styled-components';
import { IResponseElementCampaignEvent } from "kissbot-core";
import * as Yup from 'yup';
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import I18n from "../../../../i18n/components/i18n";
import { I18nProps } from "../../../../i18n/interface/i18n.interface";
import { TextAreaSimple } from "../../../../../shared/TextAreaSimple/TextAreaSimple";
import { dispatchSentryError } from "../../../../../utils/Sentry";

const TextFieldWrapper = styled("div")`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
    position: relative;
`

interface BotResponseCampaignEventProps extends BotResponseProps, I18nProps { }

export class BotResponseCampaignEventClass extends Component<BotResponseCampaignEventProps> {

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        const { getTranslation } = this.props;
        return Yup.object().shape({
            data: Yup.string().required(getTranslation('This field is required'))
        });
    };

    onChange = (values, isValid: boolean) => {
        const elements: Array<IResponseElementCampaignEvent> = this.props.response.elements as Array<IResponseElementCampaignEvent>
        elements[0].data = values.data;
        const response = this.props.response;
        response.elements = elements;
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render() {
        const elements: Array<IResponseElementCampaignEvent> = this.props.response.elements as Array<IResponseElementCampaignEvent>
        return <Formik
            initialValues={{ data: elements[0].data as string }}
            onSubmit={() => { }}
            validationSchema={this.getValidationSchema()}
            render={({ values, submitForm, validateForm, setFieldValue, touched, errors }) => {
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
                }
                return <Form>
                    <TextFieldWrapper>
                        <LabelWrapper validate={{
                            touched, errors,
                            isSubmitted: this.props.submitted,
                            fieldName: `data`
                        }}>
                            <TextAreaSimple
                                value={values.data}
                                onChange={(event) => {
                                    const text = event.target.value
                                    setFieldValue('data', text);
                                    values.data = text
                                    submit();
                                }} />
                        </LabelWrapper>
                    </TextFieldWrapper>
                </Form>
            }}
        />
    }
}

export const BotResponseCampaignEvent = I18n(BotResponseCampaignEventClass);