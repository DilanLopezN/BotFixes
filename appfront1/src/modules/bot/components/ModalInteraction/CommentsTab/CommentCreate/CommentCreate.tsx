import React, {Component} from 'react';
import {Form, Formik} from "formik";
import {IComment} from "kissbot-core/lib";
import {LabelWrapper} from "../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import {StyledFormikField} from "../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import {ButtonSave} from "../../../../../../shared/ButtonSave/ButtonSave";
import {CommentCreateProps} from "./CommentCreateProps";
import {withRouter} from "react-router";
import {connect} from "react-redux";
import * as Yup from 'yup';
import I18n from "../../../../../i18n/components/i18n";
import { dispatchSentryError } from '../../../../../../utils/Sentry';

class CommentCreateClass extends Component<CommentCreateProps> {
    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            comment: Yup.string().required("This field is required")
        });
    };
    addNewComment = (values, status) =>{
        if (status && values.comment){
            const {currentInteraction} =this.props;
            const {comments} =this.props.currentInteraction;
            values.createdAt = Date.now();
            comments.push(values);
            currentInteraction.comments = comments;
            this.props.onChange(comments);
        }
    };

    render() {
        return <Formik
            initialValues={{comment: "", userId: this.props.loggedUser._id, createdAt: ''} as IComment}
            onSubmit={() => {}}
            validate={this.getValidationSchema}
            render={({values, submitForm, validateForm, setFieldValue, touched, errors}) => {

                const submit = () => {
                    validateForm().then((validatedValues: any) => {
                        if(validatedValues.isCanceled){
                            submit();
                            return;
                        }
                        if (Object.keys(validatedValues).length === 0) {
                            this.addNewComment(values, false);
                        } else {
                            this.addNewComment(values, true);
                            setFieldValue('comment', '');
                        }
                        submitForm();
                    }).catch(e => dispatchSentryError(e))
                };

                return <Form className={"row"}>
                    <div className="col-12">
                        <LabelWrapper
                            label={this.props.getTranslation('Comment')} validate={{
                            touched, errors,
                            isSubmitted: true,
                            fieldName: `comment`
                        }}>
                            <StyledFormikField
                                component="textarea"
                                type="text"
                                name="comment"
                                autoComplete="off"
                                placeholder={this.props.getTranslation('Add comment')}
                            />
                        </LabelWrapper>
                    </div>
                    <div className="col-12 button-add-comment">
                        <ButtonSave onClick={submit}>{this.props.getTranslation('Add')}</ButtonSave>
                    </div>
                </Form>
            }}/>
    }

}
const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
    loggedUser: state.loginReducer.loggedUser,
})

export const CommentCreate = I18n(withRouter(connect(
    mapStateToProps,
    {
    }
)(CommentCreateClass))) as any;
