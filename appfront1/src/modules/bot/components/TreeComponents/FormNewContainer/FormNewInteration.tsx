import React, { Component } from "react";
import { Formik, Form } from 'formik';
import { FormProps } from "../../../../../interfaces/FormProps";
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { StyledFormikField } from "../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import { FormikErrorMessage } from "../../../../../shared/StyledForms/FormikErrorMessage/FormikErrorMessage";
import * as Yup from 'yup';
import I18n from "../../../../i18n/components/i18n";
import { I18nProps } from "../../../../i18n/interface/i18n.interface";

interface FormNewContainerProps extends FormProps, I18nProps { }

class FormNewContainerClass extends Component<FormNewContainerProps>{
    getValidationSchema = () => {
        return Yup.object().shape({
            name: Yup.string().required("Required")
        })
    };

    render() {
        const { getTranslation } = this.props;

        return <Formik
            initialValues={{ name: '', type: 'container' }}
            onSubmit={this.props.onSubmit}
            validationSchema={this.getValidationSchema()}
            render={({ submitCount }) => (
                <Form>
                    <LabelWrapper label={getTranslation('New container')}>
                        <div className="input-group input-group-sm mb-3">
                            <StyledFormikField className="form-control form-control-sm"
                                type="text" name="name" placeholder={getTranslation('Interaction name')} autoFocus={true} />
                            <div className="input-group-append">
                                <button className="input-group-text pointer" type="submit">
                                    <span className="mdi mdi-chevron-right" />
                                </button>
                            </div>
                        </div>
                        <FormikErrorMessage name="name" isSubmitted={submitCount > 0} />
                    </LabelWrapper>
                </Form>
            )} />
    }
}

export const FormNewContainer = I18n(FormNewContainerClass);