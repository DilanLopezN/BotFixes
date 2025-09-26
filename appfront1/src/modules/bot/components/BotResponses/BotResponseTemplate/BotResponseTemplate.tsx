import { Component } from "react";
import { Formik, Form } from 'formik';
import { BotResponseProps } from "../interfaces";
import { IResponseElementTemplate } from "kissbot-core";
import * as Yup from 'yup';
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import I18n from "../../../../i18n/components/i18n";
import { I18nProps } from "../../../../i18n/interface/i18n.interface";
import { TemplateMessage } from "../../../../liveAgent/components/TemplateMessageList/interface";
import { withRouter } from "react-router";
import { connect } from 'react-redux';
import { WorkspaceService } from "../../../../workspace/services/WorkspaceService";
import { SimpleSelect } from "../../../../../shared/SimpleSelect/SimpleSelect";
import { dispatchSentryError } from "../../../../../utils/Sentry";
import { Workspace } from "../../../../../model/Workspace";


interface BotResponseTemplateProps extends BotResponseProps, I18nProps {
    selectedWorkspace: Workspace;
}

interface BotResponseTemplateState {
    templateList: TemplateMessage[];
}

export class BotResponseTemplateClass extends Component<BotResponseTemplateProps, BotResponseTemplateState> {
    state: BotResponseTemplateState = {
        templateList: []
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        const { getTranslation } = this.props;
        return Yup.object().shape({
            templateId: Yup.string().required(getTranslation('This field is required'))
        });
    };

    onChange = (values, isValid: boolean) => {
        const elements: Array<IResponseElementTemplate> = this.props.response.elements as Array<IResponseElementTemplate>
        elements[0].templateId = values.templateId;
        const response = this.props.response;
        response.elements = elements;
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    getTemplates = async () => {
        const response = await WorkspaceService.getTemplates({}, this.props.selectedWorkspace._id as string);

        if(!response)return;

        this.setState({templateList: response.data})
    }

    componentDidMount() {
        this.getTemplates()
    }

    render() {
        const elements: Array<IResponseElementTemplate> = this.props.response.elements as Array<IResponseElementTemplate>
        return <>
            <Formik
                initialValues={{ templateId: elements[0].templateId }}
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
                        <LabelWrapper
                            validate={{
                                touched, errors,
                                isSubmitted: this.props.submitted,
                                fieldName: `templateId`
                            }}
                            label={this.props.getTranslation('Template')}
                        >
                            <SimpleSelect
                                value={values?.templateId}
                                onChange={(event) => {
                                    setFieldValue('templateId', event.target.value)
                                    values.templateId = event.target.value
                                    submit()
                                }}
                            >
                                {
                                    this.state.templateList.map((template) => {
                                        return <option value={template._id}>{template.name}</option>
                                    })
                                }
                            </SimpleSelect>
                        </LabelWrapper>
                    </Form>
                }}
            />
        </>
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export const BotResponseTemplate = I18n(withRouter(connect(mapStateToProps, {})(BotResponseTemplateClass)));