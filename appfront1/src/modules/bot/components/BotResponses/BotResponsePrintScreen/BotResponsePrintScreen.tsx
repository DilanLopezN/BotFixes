import React, { Component, ComponentClass } from "react";
import { connect } from "react-redux";
import { BotResponseProps } from "../interfaces";
import styled from 'styled-components';
import * as Yup from 'yup';
import { Formik, Form, FieldArray } from "formik";
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { StyledFormikField } from "../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import { DeleteBtn } from "../../../../../shared/StyledForms/DeleteBtn/DeleteBtn";
import { AddBtn } from "../../../../../shared/StyledForms/AddBtn/AddBtn";
import { I18nProps } from "../../../../i18n/interface/i18n.interface";
import I18n from "../../../../i18n/components/i18n";
import { dispatchSentryError } from "../../../../../utils/Sentry";

const DescriptionContainer = styled("p")`
    text-align: center;
    display: flex;
    font-size: 18px;
    flex-direction: column;
`;

const Row = styled("div")`
    width: 100%;
    display: flex;
    justify-content: center;
`;

const DeleteItem = styled(DeleteBtn)`
    position: absolute;
    right: 3px;
    top: 6px;
`;

const CenterDiv = styled("div")`
    width: 100%;
    display:flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    padding: 8px 0;
    margin: 7px 0;
`;

interface BotResponsePrintScreenProps extends BotResponseProps, I18nProps { }

export class BotResponsePrintScreenClass extends Component<BotResponsePrintScreenProps>{

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            text: Yup.array().of(
                Yup.string())
        });
    };

    onChange = (values: object, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [Object.assign(values)];
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    render() {
        const { getTranslation } = this.props;

        return <Formik
            initialValues={{ ...this.props.response.elements[0] }}
            onSubmit={() => { }}
            validationSchema={this.getValidationSchema()}
            render={({ values, submitForm, validateForm }) => {
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
                return <Form>
                    <DescriptionContainer>
                        PrintScreen
                         <small>{`${getTranslation('Take a print of the screen of the website where webchat is on')}.`}</small>
                        <span className="mdi mdi-48px mdi-fullscreen"></span>
                    </DescriptionContainer>
                    <hr />
                    <LabelWrapper
                        label={`${getTranslation('Message to the user')}`}
                        tooltip={getTranslation('Send random text to user (Optional)')}
                    >
                        <FieldArray
                            name="text"
                            render={() => {
                                return values.text.map((_: string, index: number) =>
                                    <Row key={index} className="my-1">
                                        <div className="col-12 p-0">
                                            <StyledFormikField
                                                type="text"
                                                onBlur={submit}
                                                name={`text[${index}]`}
                                                placeholder={"Text"}
                                            />
                                            {values.text.length != 1
                                                ? <DeleteItem onClick={() => {
                                                    values.text.splice(index, 1);
                                                    submit();
                                                }} />
                                                : null}
                                        </div>
                                    </Row>)
                            }}></FieldArray>
                    </LabelWrapper>
                    <CenterDiv>
                        <AddBtn onClick={() => {
                            values.text.push('');
                            submit();
                        }} />
                    </CenterDiv>
                </Form>
            }}
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const BotResponsePrintScreen = I18n(connect(
    mapStateToProps,
    {}
)(BotResponsePrintScreenClass));
