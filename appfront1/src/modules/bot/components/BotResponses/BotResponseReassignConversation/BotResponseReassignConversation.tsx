import { Component } from 'react';
import { connect } from 'react-redux';
import { BotResponseProps } from '../interfaces';
import styled from 'styled-components';
import { Formik, Form } from 'formik';
import { IResponseElementReassignConversation } from 'kissbot-core';
import { I18nProps, GetArrayWords } from '../../../../i18n/interface/i18n.interface';
import I18n from '../../../../i18n/components/i18n';
import { dispatchSentryError } from '../../../../../utils/Sentry';

const DescriptionContainer = styled('p')`
    text-align: center;
    display: flex;
    font-size: 18px;
    flex-direction: column;
`;

interface BotResponseReassignConversationProps extends BotResponseProps, I18nProps {}

export class BotResponseReassignConversationClass extends Component<BotResponseReassignConversationProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotResponseReassignConversationProps>) {
        super(props);
        this.translation = this.props.getArray([
            'It is used to reassign a conversation',
            'When used, transfers the ongoing conversation to the last team it was assigned to',
        ]);
    }

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange({...response});
    };

    render() {
        const elements: Array<IResponseElementReassignConversation> = this.props.response
            .elements as Array<IResponseElementReassignConversation>;
        return (
            <Formik
                initialValues={{ ...(elements[0] as IResponseElementReassignConversation) }}
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
                            <DescriptionContainer>
                                {`${this.translation['It is used to reassign a conversation']}.`}
                                <small>{`${this.translation['When used, transfers the ongoing conversation to the last team it was assigned to']}.`}</small>
                                <span className='mdi mdi-48px mdi-alert-decagram-outline'></span>
                            </DescriptionContainer>
                        </Form>
                    );
                }}
            />
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const BotResponseReassignConversation = I18n(connect(mapStateToProps, {})(BotResponseReassignConversationClass));
