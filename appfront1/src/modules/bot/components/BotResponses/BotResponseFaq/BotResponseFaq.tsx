import { Component } from 'react';
import { Form, Formik } from 'formik';
import * as Yup from 'yup';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { IFaq, IResponseElementFaq } from 'kissbot-core/lib';
import { BotResponseFaqProps } from './BotResponseFaqProps';
import { CustomCreatableSelect } from '../../../../../shared/StyledForms/CustomCreatableSelect/CustomCreatableSelect';
import { StyledFormikField } from '../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { BotAttrs } from '../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import I18n from '../../../../i18n/components/i18n';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import { FaqService } from '../../../../faq/faq.service';

export class BotResponseFaqClass extends Component<BotResponseFaqProps, { faqList: IFaq[] }> {
    constructor(props: BotResponseFaqProps) {
        super(props);
        this.state = {
            faqList: [],
        };

        this.listFaqs();
    }

    listFaqs = async () => {
        const response = await FaqService.getListFaq();
        this.setState({
            faqList: response?.data,
        });
    };

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            criteria: Yup.string().required('This field is required'),
            faqId: Yup.string().required('This field is required'),
        });
    };

    onChange = (values: IResponseElementFaq, isValid: boolean) => {
        const elements: Array<IResponseElementFaq> = this.props.response.elements as Array<IResponseElementFaq>;
        const faq: IFaq | undefined = this.state.faqList?.find((faq) => faq._id === values.faqId);
        values.attrType = faq && faq.type ? faq.type : '@sys.any';
        elements[0] = values;
        const response = this.props.response;
        response.elements = elements;
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render() {
        const elements: Array<IResponseElementFaq> = this.props.response.elements as Array<IResponseElementFaq>;
        const { getTranslation } = this.props;

        return (
            <Formik
                initialValues={{ ...elements[0] } as IResponseElementFaq}
                onSubmit={() => {}}
                validationSchema={this.getValidationSchema()}
                render={({ values, submitForm, validateForm, touched, errors, setFieldValue, setFieldTouched }) => {
                    let faqIdSelect: Array<IFaq> = this.state.faqList?.filter((faq) => faq._id === values.faqId) || [];
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
                            <LabelWrapper
                                label='Faq'
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: 'faqId',
                                    isSubmitted: this.props.submitted,
                                }}
                                tooltip={getTranslation(
                                    'The faq corresponds to requests for sending messages using frequently asked questions'
                                )}
                            >
                                <CustomCreatableSelect
                                    options={this.state.faqList?.map((element) => {
                                        return { value: element._id, label: element.name };
                                    })}
                                    value={{
                                        value: faqIdSelect[0] ? faqIdSelect[0].name : values.faqId,
                                        label: faqIdSelect[0] ? faqIdSelect[0].name : values.faqId,
                                    }}
                                    placeholder='Faq'
                                    onChange={(event) => {
                                        setFieldTouched('faqId');
                                        if (!event || !event.value) return;
                                        if (event.label.startsWith('{{') && event.value.indexOf('}}') > -1) {
                                            values.faqId = event.value;
                                            setFieldValue('faqId', event.value);
                                        } else {
                                            if (!this.state.faqList?.find((faq: IFaq) => faq._id === event.value))
                                                return;
                                            values.faqId = event.value;
                                            setFieldValue('faqId', event.value);
                                        }
                                        submit();
                                    }}
                                />
                            </LabelWrapper>
                            <LabelWrapper
                                label={getTranslation('Criteria')}
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: 'criteria',
                                    isSubmitted: this.props.submitted,
                                }}
                                tooltip={getTranslation(
                                    'Criteria will match with selected faq to send message from faq-value to user'
                                )}
                            >
                                <StyledFormikField name='criteria' onBlur={() => submit()} />
                            </LabelWrapper>
                            <LabelWrapper
                                label={getTranslation('Attribute name')}
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: 'attrName',
                                    isSubmitted: this.props.submitted,
                                }}
                                tooltip={getTranslation(
                                    'The value of faq-value that matches with selected faq and criteria will be saved on this attribute'
                                )}
                            >
                                <BotAttrs
                                    value={{
                                        value: values.attrName,
                                        label: values.attrName,
                                    }}
                                    onCreateOption={(ev) => {
                                        setFieldTouched('attrName');
                                        values.attrName = ev;
                                        setFieldValue('attrName', ev);
                                        submit();
                                    }}
                                    onChange={(ev) => {
                                        setFieldTouched('attrName');
                                        values.attrName = ev.value;
                                        setFieldValue('attrName', ev.value);
                                        submit();
                                    }}
                                    showOnly={['defaults', 'entity', 'others']}
                                    creatable
                                />
                            </LabelWrapper>
                        </Form>
                    );
                }}
            />
        );
    }
}

export const BotResponseFaq = I18n(BotResponseFaqClass);
