import React, { Component, ComponentClass } from "react";
import { FieldArray, Form, Formik } from 'formik';
import { BotResponseProps } from "../interfaces";
import styled from 'styled-components';
import { IResponseElementQuickReply } from "../../../../../model/ResponseElement";
import * as Yup from 'yup';
import { connect } from "react-redux";
import { BotResponseQuickReplyProps, BotResponseQuickReplyState } from "./BotResponseQuickReplyProps";
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { StyledFormikField } from "../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import { AddBtn } from "../../../../../shared/StyledForms/AddBtn/AddBtn";
import { DeleteBtn } from "../../../../../shared/StyledForms/DeleteBtn/DeleteBtn";
import { FormPopup } from "../../../../../shared/FormPopup/FormPopup";
import { v4 } from 'uuid';
import { ButtonFormModal } from "../BotResponseShared/Card/ButtonFormModal/ButtonFormModal";
import { ButtonType, IButton } from "kissbot-core/lib";
import isEmpty from 'lodash/isEmpty';
import { dispatchSentryError } from "../../../../../utils/Sentry";

const ContainerWrapper = styled("div")`
    position: relative;
    padding-bottom: 2px;
    span{
        display: none;
    }
    :hover{
        span{
            display: block
        }
    }
`;

const DeleteItem = styled("span")`
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: absolute;
    right: -8px;
    top: -20px;
    color: #007bff !important;
    border-radius: 100%;
`;

const BtnWrapper = styled("div")`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    span{
        display: none;
    }
    :hover{
        span{
            display: block
        }
    }
`;
const ContainerDeleteItem = styled("div")`
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-width: 15px;
    margin: 0 5px 0px 0;
    max-height: 40px;
    position: relative;
`;

const AddBtnContainer = styled("div")`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    border-top: 1px solid #ccc;
    padding-top: 10px;
    margin-top: 10px;
`;

const WrapperAdd = styled('div')`
    display: flex;
    justify-content: center;
`;

const AddNewFieldBtn = styled(AddBtn)`
        span{
            display: block
        }
        margin: 10px 10px;
`;
const AddNewButton = styled(AddBtn)`
        span{
            display: block
        }
`;

const FieldContainer = styled('div')`
    padding: 2px 10px;
    background: #fff;
    min-width: max-content;
    border-radius: 5px;
    cursor: pointer;
    color: #007bff;
    border: 1px solid #007bff;
`;

const StyledDeleteBtn = styled(DeleteBtn)`
    margin: 10px 0;
    position: absolute;
    right: 0;
    top: -5px;
`;

class BotResponseQuickReplyClass extends Component<BotResponseQuickReplyProps, BotResponseQuickReplyState> {
    constructor(props: any) {
        super(props);
        this.state = {
            openedButtonIndex: -1
        }
    }

    onChange = (values, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [values.elements];
        response.isResponseValid = isValid;

        if (this.props.onChange) {
            this.props.onChange(response);
        }
    };


    getValidationSchema = () => {
        return Yup.object().shape({
            elements: Yup.object().shape({
                text: Yup.array().of(
                    Yup.string().required('Required')
                ),
                buttons: Yup.array()
                    .of(
                        Yup.object().shape({
                            title: Yup.string().required('Required'),
                            type: Yup.string().required('Required'),
                            value: Yup.string().required('Required'),
                        })
                    )
            })
        })
    };

    setOpenedButtonIndex = (index?: number) => {
        this.setState({  openedButtonIndex: index });
    }

    render() {
        return <Formik
            initialValues={{ elements: this.props.response.elements[0] as IResponseElementQuickReply }}
            onSubmit={() => {
            }}
            validationSchema={this.getValidationSchema()}
            render={({ values, submitForm, setFieldValue, validateForm, touched, errors }) => {
                const submit = () => {
                    validateForm().then((validatedValues: any) => {
                        if (validatedValues.isCanceled) {
                            submit();
                            return
                        }

                        if (Object.keys(validatedValues).length != 0) {
                            this.onChange(values, false);
                        } else {
                            this.onChange(values, true)
                        }

                        submitForm();
                    }).catch(e => dispatchSentryError(e))
                };


                const deleteButton = (index) => {
                    const elements = values.elements;
                    elements.buttons = !elements.buttons ? [] : elements.buttons.filter((button, indexBtn) => {
                        return indexBtn != index
                    }) || []
                    setFieldValue(`elements`, elements);
                    submit();
                };

                const isValidInput = (button) => {
                    const { title, type, value } = button;
                    return !isEmpty(title) && !isEmpty(type) && !isEmpty(value);
                };
                return <Form>
                    <FieldArray
                        name={"elements.text"}
                        render={(arrayHelpers) => {
                            return !isEmpty(values.elements.text) ? values.elements.text.map((element: any, index: number) => {
                                return <ContainerWrapper key={index}>
                                    <LabelWrapper
                                        label=""
                                        validate={{
                                            touched, errors,
                                            fieldName: `elements.text[${index}]`,
                                            isSubmitted: this.props.submitted
                                        }}
                                    >
                                        <StyledFormikField
                                            type="text"
                                            onBlur={submit}
                                            name={`elements.text[${index}]`}
                                            placeholder={"Text"}
                                        />
                                    </LabelWrapper>
                                    {
                                        values.elements.text.length > 1 ?
                                            <StyledDeleteBtn onClick={() => {
                                                arrayHelpers.remove(index);
                                                submit();
                                            }} /> : null
                                    }
                                    {
                                        values.elements.text.length - 1 == index ?
                                            <WrapperAdd>
                                                <AddNewFieldBtn onClick={() => arrayHelpers.push("")} />
                                            </WrapperAdd>
                                            : null
                                    }
                                </ContainerWrapper>

                            }) : <WrapperAdd>
                                    <AddNewFieldBtn onClick={() => {
                                        arrayHelpers.push("");
                                        submit();
                                    }} />
                                </WrapperAdd>
                        }}
                    />
                    <FieldArray
                        name={"elements.button"}
                        render={(arrayHelpers) => {
                            const setButtons = (button: IButton, buttonIndex) => {
                                const elements = values.elements;
                                elements.buttons[buttonIndex] = button;
                                setFieldValue('elements', elements);
                            };
                            const addButton = () => {
                                const elements: any = values.elements;
                                elements.buttons.push({
                                    title: `button #${elements.buttons.length + 1}`,
                                    value: '',
                                    type: ButtonType.goto
                                });
                                values.elements = elements;
                                setFieldValue(`elements`, elements);
                                this.setOpenedButtonIndex(elements.length - 1);
                                submit();
                            };

                            return <AddBtnContainer>
                                {
                                    !values.elements.buttons ? <AddNewButton onClick={() => {
                                        addButton();
                                    }} /> : values.elements.buttons.map((button: any, index: number) => {
                                        const isValidClass = isValidInput(button) ? "" : this.props.submitted ? "invalid" : "";
                                        return <FormPopup
                                            key={v4()}
                                            isOpenedPopover={this.state.openedButtonIndex == index}
                                            onClose={() => {
                                                submit();
                                                this.setOpenedButtonIndex();
                                            }}
                                            popupBody={
                                                <ButtonFormModal
                                                    isSubmitted={true}
                                                    button={button}
                                                    onChange={(button) => setButtons(button, index)}
                                                    onClose={() => {
                                                        submit();
                                                        this.setOpenedButtonIndex();
                                                    }}
                                                    onDelete={() => {
                                                    }}
                                                />
                                            }>
                                            <BtnWrapper>
                                                <ContainerDeleteItem>
                                                    {
                                                        values.elements.buttons.length !== 1 ?
                                                            <DeleteItem className="mdi mdi-24px mdi-delete-outline"
                                                                onClick={() => deleteButton(index)} />
                                                            : null
                                                    }
                                                    <FieldContainer onClick={() => this.setOpenedButtonIndex(index)} className={isValidClass}>
                                                        {button.title}
                                                    </FieldContainer>
                                                </ContainerDeleteItem>

                                                {
                                                    values.elements.buttons.length - 1 == index ?
                                                        <AddNewButton onClick={() => addButton()} />
                                                        : null
                                                }
                                            </BtnWrapper>
                                        </FormPopup>
                                    })
                                }
                            </AddBtnContainer>
                        }}
                    />
                </Form>
            }
            }
        />
    }
}

const mapStateToProps = (state: any) => ({
    interactionList: state.botReducer.interactionList,
    currentInteraction: state.botReducer.currentInteraction,
});

export const BotResponseQuickReply = connect(
    mapStateToProps, {}
)(BotResponseQuickReplyClass);
