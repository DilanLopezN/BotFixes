import React, { Component } from "react";
import "./SelectAttributePopup.scss";
import * as Yup from 'yup';
import { Formik, Form } from 'formik';
import { LabelWrapper } from "../../LabelWrapper/LabelWrapper";
import { FormikErrorMessage } from "../../FormikErrorMessage/FormikErrorMessage";
import { DoneBtn } from "../../DoneBtn/DoneBtn";
import { connect } from "react-redux";
import { SelectAttributePopupProps } from "./SelectAttributePopupProps";
import { BotAttrs } from "../../BotAttrs/BotAttrs";
import { withRouter } from "react-router";

class SelectAttributePopupClass extends Component<SelectAttributePopupProps & any>{
    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            name: Yup.string().required("Required"),
        });
    };

    getInitialValue = () => {
        const existsValue = this.props.botAttributes.find(botAttr => botAttr.name == this.props.data);
        if (!!existsValue) {
            return existsValue.name;
        } else if (this.props.botAttributes && this.props.botAttributes[0]) {
            return this.props.botAttributes[0].name
        }
        return this.props.data;
    }

    render() {
        return <Formik
            initialValues={{ name: this.getInitialValue() }}
            onSubmit={() => { }}
            validationSchema={this.getValidationSchema()}
            render={({ submitForm, values, setFieldValue, validateForm, handleChange }) => {
         
                const submit = () => {
                    validateForm().then(validatedValues => {
                        if (Object.keys(validatedValues).length == 0) {
                            this.props.onChange(values.name)
                        }
                        submitForm();
                    }).catch(e => console.log('E', e))
                }
                return <Form className="SelectAttributePopup">
                    <div className="field-wrapper">
                        <LabelWrapper label="Select attribute">
                            <BotAttrs
                                value={{
                                    value: values.name,
                                    label: values.name
                                }}
                                onCreateOption={ev => {
                                    setFieldValue("name", ev);
                                }}
                                onChange={ev => {
                                    setFieldValue("name", ev.value);
                                }}
                                showOnly={['defaults', 'entity', 'others']}
                                creatable
                            />
                            <FormikErrorMessage isSubmitted={false} name="name" />
                        </LabelWrapper>
                    </div>
                    <DoneBtn onClick={submit}>Done</DoneBtn>
                </Form>
            }}
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    botAttributes: state.botReducer.botAttributes,
})

export const SelectAttributePopup = withRouter(connect(
    mapStateToProps,
    {}
)(SelectAttributePopupClass)) as any;
