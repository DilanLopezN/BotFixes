import React, { Component } from "react";
import "./CreateAttributePopup.scss";
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { LabelWrapper } from "../../LabelWrapper/LabelWrapper";
import { FormikErrorMessage } from "../../FormikErrorMessage/FormikErrorMessage";
import { DoneBtn } from "../../DoneBtn/DoneBtn";
import { CreateAttributePopupProps, CreateAttributePopupState } from "./CreateAttributePopupProps";
import { connect } from "react-redux";
import { withRouter } from "react-router";
import { BotService } from "../../../../modules/bot/services/BotService";
import { BotAttribute } from "../../../../model/BotAttribute";
import { BotActions } from "../../../../modules/bot/redux/actions";
import { PaginatedModel } from "../../../../model/PaginatedModel";
import { EntitySelect } from "../../EntitySelect/EntitySelect";
import { BotAttrs } from "../../BotAttrs/BotAttrs";
import { SetAttributeType } from "../../../../model/ResponseElement";

class CreateAttributePopupClass extends Component<CreateAttributePopupProps, CreateAttributePopupState> {
    constructor(props: any) {
        super(props);
        this.state = {
            disabled: false,
        }
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            type: Yup.string().required("Required"),
            value: Yup.string().required("This field is required")
                .max(30, 'Character max length is 30')
                .matches(/^[A-Za-z0-9_-]*$/, "This field must contains A-Z, a-z, 0-9, _ (underscore), - (dash). And it should start with a letter.")
        });
    };

    saveBotAttribute = async (name, type) => {
        const params: any = this.props.match.params;
        const botAttr: BotAttribute = {
            name,
            interactions: [this.props.currentInteraction._id],
            botId: params.botId,
            type
        };

        await BotService.createBotAttribute(params.workspaceId, params.botId, botAttr);
        const botAttrList: PaginatedModel<BotAttribute> = await BotService.getBotAttributes(params.workspaceId, params.botId);
        this.props.setBotAttributes(botAttrList.data);
    }

    render() {
        return <Formik
            initialValues={{ ...this.props.data }}
            onSubmit={() => { }}
            validationSchema={this.getValidationSchema()}
            render={({ submitForm, values, validateForm, setFieldValue, errors, touched, handleChange }) => {
           
                const submit = () => {
                    validateForm().then(validatedValues => {
                        if (Object.keys(validatedValues).length == 0) {
                            this.props.onChange(values)
                            this.saveBotAttribute(values.value, values.type);
                        }
                        submitForm();
                    }).catch(e => console.log('E', e))
                }

                return <Form className="CreateAttributePopup">
                    <LabelWrapper
                        label="Save input to attribute:"
                        tooltip="User says will be saved in attribute"
                        validate={{
                            errors, touched,
                            fieldName: "value",
                            isSubmitted: false
                        }}
                    >
                        <div className="CustomCreatableSelect">
                            <BotAttrs
                                value={{
                                    value: values.value,
                                    label: values.value
                                }}
                                onCreateOption={ev => {
                                    setFieldValue('value', ev);
                                    setFieldValue('type', SetAttributeType.any);
                                }}
                                onChange={ev => {
                                    setFieldValue('value', ev.value);
                                    if (this.props.botAttributes
                                        && this.props.botAttributes.length > 0) {
                                        const botAttrFinded = this.props.botAttributes
                                            .filter(botAttr => botAttr.type)
                                            .find(botAttr => botAttr.name === ev.value);

                                        if (!!botAttrFinded) {
                                            setFieldValue('type', botAttrFinded.type);
                                            values.type = botAttrFinded.type
                                            this.setState({  disabled: true });
                                            return;
                                        }

                                        this.setState({  disabled: false });
                                        setFieldValue('type', SetAttributeType.any);
                                        values.type = SetAttributeType.any;
                                    }
                                }}
                                showOnly={['entity', 'others']}
                                creatable
                            />
                        </div>
                    </LabelWrapper>
                    <div className='my-2'>
                        <LabelWrapper
                            label="Validation entity"
                            tooltip="Validation entity"
                            >
                            <EntitySelect value={values.type} onChange={handleChange} fieldName="type" disabled={this.state.disabled} />
                            <FormikErrorMessage isSubmitted={false} name="type" />
                        </LabelWrapper>
                    </div>
                    <LabelWrapper label="Mandatory" tooltip="Will only match this attribute if is equal to entity">
                        <div className="custom-control custom-checkbox">
                            <input
                                type="checkbox"
                                className="custom-control-input" id={"mandatory"}
                                name="mandatory"
                                checked={!!values.mandatory}
                                onChange={ev => {
                                    setFieldValue("mandatory", ev.target.checked)
                                }}
                            />
                            <label className="custom-control-label" htmlFor={"mandatory"}></label>
                        </div>
                    </LabelWrapper>
                    <div className="btn-bottom">
                        <div className="btn-bottom-container">
                            <DoneBtn onClick={submit}>Done</DoneBtn>
                        </div>
                    </div>
                </Form>
            }}
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
    botAttributes: state.botReducer.botAttributes,
})

export const CreateAttributePopup = withRouter(connect(
    mapStateToProps,
    {
        setBotAttributes: BotActions.setBotAttributes
    }
)(CreateAttributePopupClass)) as any;
