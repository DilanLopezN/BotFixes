import React, { Component } from "react";
import { connect } from "react-redux";
import { BotResponseProps } from "../interfaces";
import styled from 'styled-components';
import * as Yup from 'yup';
import { Formik, Form } from "formik";
import { IResponseElementEndConversation } from "kissbot-core";
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import ButtonSelect from "../../../../../shared/StyledForms/ButtonSelect/ButtonSelect";
import { StyledFormikField } from "../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import { I18nProps, GetArrayWords } from "../../../../i18n/interface/i18n.interface";
import I18n from "../../../../i18n/components/i18n";
import Toggle from "../../../../../shared/Toggle/Toggle";
import { dispatchSentryError } from "../../../../../utils/Sentry";

const DescriptionContainer = styled("p")`
    text-align: center;
    display: flex;
    font-size: 18px;
    flex-direction: column;
`;

const CenterDiv = styled("div")`
    width: 100%;
    display:flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    padding: 10px 0;
    margin: 7px 0;
    border-bottom: 1px #dcdcdc solid;
`;

const Row = styled("div")`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const Col100 = styled("div")`
    width: 100%;
    display: flex;
`;

interface BotResponseEndConversationProps extends BotResponseProps, I18nProps { }

export class BotResponseEndConversationClass extends Component<BotResponseEndConversationProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotResponseEndConversationProps>) {
        super(props);
        this.translation = this.props.getArray([
            'End conversation is used to close a conversation',
            'When used, ends the ongoing conversation',
            'Show rating after close conversation',
            'Text displayed on service satisfaction survey card',
            'Rating title',
            'Rating description',
            'Confirmation title',
            'Confirmation description',
            'Thank you text displayed after review',
            'Is closed by user',
        ]);
    }

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render() {
        const elements: Array<IResponseElementEndConversation> = this.props.response.elements as Array<IResponseElementEndConversation>
        return <Formik
            initialValues={{ ...elements[0] as IResponseElementEndConversation }}
            onSubmit={() => { }}
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
                };

                return (
                    <Form>
                        <DescriptionContainer>
                            {`${this.translation['End conversation is used to close a conversation']}.`}
                            <small>{`${this.translation['When used, ends the ongoing conversation']}.`}</small>
                            <span className='mdi mdi-48px mdi-close-octagon-outline'></span>
                        </DescriptionContainer>
                        <Row>
                            <LabelWrapper
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: `isClosedByUser`,
                                    isSubmitted: this.props.submitted,
                                }}
                                label={this.translation['Is closed by user']}
                                tooltip={
                                    this.translation[
                                        'Is closed by user'
                                    ]
                                }
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Toggle
                                        tabIndex='52'
                                        checked={
                                            values?.isClosedByUser ?? false
                                        }
                                        onChange={() => {
                                            setFieldValue(
                                                'isClosedByUser',
                                                !values?.isClosedByUser
                                            );
                                            values['isClosedByUser'] = !values.isClosedByUser;
                                            submit();
                                        }}
                                    />
                                </div>
                            </LabelWrapper>
                        </Row>
                    </Form>
                );
            }}
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({})

export const BotResponseEndConversation = I18n(connect(
    mapStateToProps,
    {}
)(BotResponseEndConversationClass));