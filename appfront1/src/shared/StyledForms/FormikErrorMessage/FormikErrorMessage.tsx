import React, { Component } from "react";
import { Field, getIn } from "formik";
import { ShowError } from "../ShowError/ShowError";
import { FormikErrorMessageProps } from "./FormikErrorMessageProps";

export class FormikErrorMessage extends Component<FormikErrorMessageProps>{
    render(){
        const {name, isSubmitted} = this.props;
        return <Field
            name={name}
            render={({ form }) => {
                const error = getIn(form.errors, name);
                const touch = getIn(form.touched, name);
                return (touch || isSubmitted) && error ? <ShowError>{error}</ShowError> : null;
            }}
        />
    }
}