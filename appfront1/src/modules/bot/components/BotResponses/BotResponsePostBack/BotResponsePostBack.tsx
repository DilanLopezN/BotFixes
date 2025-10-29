import React, { Component } from "react";
import styled from 'styled-components';
import { Formik } from 'formik';
import { ResponseElement } from '../../../../../model/ResponseElement';
import { connect } from "react-redux";
import { BotResponsePostBackProps, BotResponsePostBackState } from "./BotResponsePostBackProps";
import { withRouter } from "react-router";
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import * as Yup from "yup";
import { IResponseElementPostback } from "kissbot-core";
import I18n from "../../../../i18n/components/i18n";
import { GetArrayWords } from "../../../../i18n/interface/i18n.interface";
import { CustomCreatableSelect } from "../../../../../shared/StyledForms/CustomCreatableSelect/CustomCreatableSelect";
import { dispatchSentryError } from "../../../../../utils/Sentry";

const FieldContainer = styled("div")`
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 10px;
`
export class BotResponsePostBackClass extends Component<BotResponsePostBackProps, BotResponsePostBackState> {
    private translation: GetArrayWords;

    constructor(props: BotResponsePostBackProps) {
        super(props);
        this.state = {
            postBack: '',
        }
        this.translation = this.props.getArray([
            'Choose an trigger',
        ]);
    }

    onChange = (postBack: IResponseElementPostback, isValid) => {
        const response = this.props.response;
        response.elements[0] = {
            value: postBack.value,
        } as ResponseElement;
        response.isResponseValid = isValid;

        this.props.onChange(response);
    }

    options = () => {
        let array: any = [];
        this.props.interactionList.map(e => {
            e.triggers.map(e => {
                e !== '' &&
                    array.push(e)
            })
        })

        return array.map(e => {
            return { label: e, value: e }
        })
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            postBack: Yup.string().required("This field is required")
        });
    };

    render() {
        return <Formik
            initialValues={{
                ...this.props.response.elements[0]
            } as IResponseElementPostback}
            onSubmit={() => { }}
            isInitialValid={true}
            validationSchema={this.getValidationSchema()}
            render={({ values, submitForm, validateForm, errors, touched, handleChange, setFieldValue }) => {
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

                return <div>
                    <FieldContainer>
                        <LabelWrapper label={this.translation['Choose an trigger']} validate={{
                            errors, touched,
                            fieldName: "postBack",
                            isSubmitted: this.props.submitted
                        }}>
                            <CustomCreatableSelect
                                options={this.options()}
                                value={{label: values.value, value: values.value}}
                                placeholder={this.translation['Choose an trigger']}
                                onCreateOption={ev => {
                                    if (!ev) return;

                                    setFieldValue("postBack", ev);
                                    values.value = ev;
                                    submit();
                                }}
                                onChange={(event) => {
                                    if (!event) return;

                                    setFieldValue(`postBack`, event.value);
                                    values.value = event.value;
                                    submit();
                                }}
                            />
                        </LabelWrapper>
                    </FieldContainer>
                </div>
            }} />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList,
    currentInteraction: state.botReducer.currentInteraction,
    workspaceList: state.workspaceReducer.workspaceList,
    loggedUser: state.loginReducer.loggedUser,
})

export const BotResponsePostBack = I18n(withRouter(connect(
    mapStateToProps,
    {}
)(BotResponsePostBackClass)));
