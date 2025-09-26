import React, { Component } from "react";
import { Formik, Form, FieldArray } from "formik";
import styled from "styled-components";
import { IResponseElementQuestion, QuestionActionOnFailure } from 'kissbot-core';
import * as Yup from "yup";
import isEmpty from 'lodash/isEmpty'
import { DeleteBtn } from "../../../../../shared/StyledForms/DeleteBtn/DeleteBtn";
import { AddBtn } from "../../../../../shared/StyledForms/AddBtn/AddBtn";
import { StyledFormikField } from "../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { SetAttributeType } from "../../../../../model/ResponseElement";
import { EntitySelect } from "../../../../../shared/StyledForms/EntitySelect/EntitySelect";
import I18n from "../../../../i18n/components/i18n";
import { BotResponseQuestionProps } from "./BotResponseQuestionProps";
import { FieldAttributes } from "../../../../../shared/StyledForms/FieldAttributes/FieldAttributes/FieldAttributes";
import { dispatchSentryError } from "../../../../../utils/Sentry";

const FieldContainer = styled("div")`
    display: flex;
    align-items: center;
`;

const LabelWrappe = styled("div")`
    width: 93%;
    `;

const Styled33Container = styled("div")`
    width: 33%;
    margin-right: 10px;
`;

const Styled66Container = styled("div")`
    width: 66%;
    margin-right: 10px;
`;

const FieldItemContainer = styled("div")`
    margin-bottom: 10px;
`;

const AddTextBtn = styled(AddBtn)`
    margin-left: 5px;
`;

const MainFormContainer = styled("div")`
    display: flex;
    justify-content: center;
    flex-direction: column;
`;

const ElementContainer = styled("div")`
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ccc; 
`;

const AddNewFieldBtn = styled(AddBtn)`
    margin-right: 10px;
`;

const AddNewBtnContainer = styled("div")`
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`;

const DeleteButton = styled(DeleteBtn)`
    position: absolute;
    right: 65px;
`;

const DeleteElementButton = styled(DeleteBtn)`
    position: absolute;
    right: 0px;
    bottom: 10px;
`;

const DeleteBtnElementContainer = styled("div")`
    position: relative;
    width: 100%;
    height: 30px;
`;

class BotResponseQuestionClass extends Component<BotResponseQuestionProps> {

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            elements: Yup.array().of(
                Yup.object().shape({
                    errorMessages: Yup.array().of(Yup.string()),
                    text: Yup.array()
                        .of(Yup.string().required("This field is required")),
                    name: Yup.string().required("This field is required")
                        .max(30, 'Character max length is 30')
                        .matches(/^[A-Za-z0-9_-]*$/, "This field must contains A-Z, a-z, 0-9, _ (underscore), - (dash). And it should start with a letter.")
                })
            )
        });
    };

    stringToBool = (value: string | undefined | boolean) => value === 'true' || value === true;

    boolToString = (value: boolean | undefined) => typeof value === 'boolean' ? `${value}` : value;

    getEmptyIResponseElementQuestion = (): IResponseElementQuestion => {
        return {
            actionOnFailure: QuestionActionOnFailure.next,
            askWhenFilled: false,
            entity: "@sys.any",
            lifespan: 1,
            name: "",
            required: true,
            text: [""],
            errorMessages: ['']
        }
    }

    onChange = (values: { elements: Array<IResponseElementQuestion> }, isValid: boolean) => {
        const response = this.props.response;

        values.elements = values.elements.map((elem: any) => ({
            ...elem,
            required: this.stringToBool(elem.required),
            askWhenFilled: this.stringToBool(elem.askWhenFilled),
        }))

        response.elements = values.elements;
        response.isResponseValid = isValid;

        let listBotAttr: any = [];

        response.elements.forEach((element: any) => {
            if (element.name) {
                listBotAttr.push({ type: element.entity, name: element.name });
            }
        });

        if (!isEmpty(listBotAttr)) {
            this.props.onCreateAttribute(listBotAttr);
        }

        this.props.onChange(response);
    };

    initialValues = () => {
        let { elements } = this.props.response;

        elements.map(e => {
            if (!e.errorMessages) {
                e.errorMessages = [''];
            }
        })

        elements = elements.map((elem: any) => ({
            ...elem,
            required: this.boolToString(elem.required),
            askWhenFilled: this.boolToString(elem.askWhenFilled),
        }))

        return this.props.response.elements;
    }

    render() {
        const { getTranslation } = this.props;

        return <Formik
            initialValues={{ elements: this.initialValues() } as { elements: Array<any> }}
            onSubmit={() => {
            }}
            validationSchema={this.getValidationSchema()}
            render={({ values, submitForm, validateForm, errors, touched }) => {
                const submit = (newValues?) => {
                    // newValues serve para quando um fieldArray for alterado a quantidade, 
                    // Ex: ao exlcuir um field deve-se calcular o novo valor de values e passar como newValues,
                    // pois quando altera-se o fieldArray não altera o valor de values do formik
                    validateForm(newValues).then((validatedValues: any) => {
                        if (validatedValues.isCanceled) {
                            submit(newValues);
                            return;
                        }
                        if (Object.keys(validatedValues).length != 0) {
                            this.onChange(newValues || values, false);
                        } else {
                            this.onChange(newValues || values, true);
                        }
                        submitForm();
                    }).catch(e => dispatchSentryError(e));
                };
                return <Form>
                    <FieldArray
                        name="elements"
                        render={arrayElementsHelpers => {
                            return <MainFormContainer>
                                {
                                    values.elements.map((element: IResponseElementQuestion, elementIndex: number) => {
                                        if (isEmpty(element.entity)) {
                                            element.entity = SetAttributeType.any;
                                        }
                                        return <ElementContainer key={elementIndex}>
                                            <DeleteBtnElementContainer>
                                                {
                                                    values.elements.length > 1
                                                        ? <DeleteElementButton onClick={() => {
                                                            //Não pode apenas dar um arrayhelper remove e chamar o submit, tem que
                                                            // calcular o novo state do values, tirando o intem a seer removido e passar para o submit
                                                            arrayElementsHelpers.remove(elementIndex);
                                                            const elements = values.elements.filter((_, index) => index != elementIndex);
                                                            submit({ elements });
                                                        }} />
                                                        : null
                                                }
                                            </DeleteBtnElementContainer>
                                            <LabelWrapper
                                                label={getTranslation('Question')}
                                                tooltip={getTranslation('Question')}
                                            >
                                                <FieldArray
                                                    name={`elements[${elementIndex}].text`}
                                                    render={arrayTextHelpers => {
                                                        return <div>
                                                            {
                                                                !element?.text ? null
                                                                    : element?.text.map((_, index) => {
                                                                        return <FieldItemContainer key={index}>
                                                                            <FieldContainer>
                                                                                <LabelWrappe>
                                                                                    <LabelWrapper
                                                                                        validate={{
                                                                                            errors, touched,
                                                                                            fieldName: `elements[${elementIndex}].text[${index}]`,
                                                                                            isSubmitted: this.props.submitted
                                                                                        }}>
                                                                                        <FieldAttributes value={_} type="SELECT" onChange={(data) => {
                                                                                            values.elements[elementIndex].text[index] = data
                                                                                            submit()
                                                                                        }} />
                                                                                    </LabelWrapper>
                                                                                </LabelWrappe>
                                                                                {
                                                                                    element.text && element.text.length > 1
                                                                                        ? <DeleteButton onClick={() => {
                                                                                            //Não pode apenas dar um arrayhelper remove e chamar o submit, tem que
                                                                                            // calcular o novo state do values, tirando o intem a seer removido e passar para o submit
                                                                                            let elements = [...values.elements];
                                                                                            const texts = elements[elementIndex].text != undefined ? elements[elementIndex].text : [];
                                                                                            elements[elementIndex].text = texts ? texts.filter((t, textIndex) => index != textIndex) : [];
                                                                                            submit({ elements });
                                                                                        }} className="icon-delete" />
                                                                                        : null
                                                                                }
                                                                                {
                                                                                    values.elements[elementIndex].text.length - 1 === index
                                                                                        ? <AddTextBtn onClick={() => {
                                                                                            arrayTextHelpers.push("");
                                                                                            submit();
                                                                                        }} />
                                                                                        : null
                                                                                }

                                                                            </FieldContainer>
                                                                        </FieldItemContainer>;
                                                                    })
                                                            }
                                                        </div>;
                                                    }}
                                                />
                                            </LabelWrapper>
                                            <FieldContainer>
                                                <Styled33Container>
                                                    <LabelWrapper
                                                        label={getTranslation('Validation type')}
                                                        validate={{
                                                            errors, touched,
                                                            fieldName: `elements[${elementIndex}].entity`,
                                                            isSubmitted: this.props.submitted
                                                        }
                                                        }>
                                                        <EntitySelect
                                                            value={values.elements[elementIndex].entity}
                                                            onChange={(e) => {
                                                                submit();
                                                                values.elements[elementIndex].entity = e.target.value;
                                                            }}
                                                            fieldName={`elements[${elementIndex}].entity`}
                                                        />
                                                    </LabelWrapper>
                                                </Styled33Container>
                                                <Styled66Container>
                                                    <LabelWrapper
                                                        label={getTranslation('Save answer to attribute')}
                                                        validate={{
                                                            errors, touched,
                                                            fieldName: `elements[${elementIndex}].name`,
                                                            isSubmitted: this.props.submitted
                                                        }}
                                                    >
                                                        <StyledFormikField onBlur={() => submit()}
                                                            name={`elements[${elementIndex}].name`}
                                                            type="text"
                                                            style={{ width: "100%" }} />
                                                    </LabelWrapper>
                                                </Styled66Container>
                                            </FieldContainer>
                                            <FieldContainer>
                                                <Styled33Container>
                                                    <LabelWrapper
                                                        label={getTranslation('Required answer')}
                                                        validate={{
                                                            errors, touched,
                                                            fieldName: `elements[${elementIndex}].required`,
                                                            isSubmitted: this.props.submitted
                                                        }}
                                                    >
                                                        <StyledFormikField onBlur={() => submit()}
                                                            name={`elements[${elementIndex}].required`}
                                                            component="select" style={{ width: "100%" }}>
                                                            <option value='true'>{getTranslation('Yes')}</option>
                                                            <option value='false'>{getTranslation('No')}</option>
                                                        </StyledFormikField>
                                                    </LabelWrapper>
                                                </Styled33Container>
                                                <Styled33Container>
                                                    <LabelWrapper
                                                        label={getTranslation('If attribute exists')}
                                                        validate={{
                                                            errors, touched,
                                                            fieldName: `elements[${elementIndex}].askWhenFilled`,
                                                            isSubmitted: this.props.submitted
                                                        }}
                                                    >
                                                        <StyledFormikField onBlur={() => submit()}
                                                            name={`elements[${elementIndex}].askWhenFilled`}
                                                            component="select" style={{ width: "100%" }}>
                                                            <option value={'true'}>{getTranslation('Ask again')}</option>
                                                            <option value={'false'}>{getTranslation("Don't ask")}</option>
                                                        </StyledFormikField>
                                                    </LabelWrapper>
                                                </Styled33Container>
                                                <Styled33Container>
                                                    <LabelWrapper
                                                        label={getTranslation('Ask user')}
                                                        validate={{
                                                            errors, touched,
                                                            fieldName: `elements[${elementIndex}].lifespan`,
                                                            isSubmitted: this.props.submitted
                                                        }}
                                                    >
                                                        <StyledFormikField onBlur={() => submit()}
                                                            name={`elements[${elementIndex}].lifespan`}
                                                            component="select" style={{ width: "100%" }}>
                                                            <option disabled defaultValue={""}>{getTranslation('Select option')}</option>
                                                            <option value="1">{getTranslation('Once')}</option>
                                                            <option value="2">{`2 ${getTranslation('times')}`}</option>
                                                            <option value="3">{`3 ${getTranslation('times')}`}</option>
                                                            <option value="4">{`4 ${getTranslation('times')}`}</option>
                                                            <option value="5">{`5 ${getTranslation('times')}`}</option>
                                                            <option value="6">{`6 ${getTranslation('times')}`}</option>
                                                        </StyledFormikField>
                                                    </LabelWrapper>
                                                </Styled33Container>
                                            </FieldContainer>
                                            <FieldContainer>
                                                <Styled66Container>
                                                    <LabelWrapper
                                                        label={getTranslation('Action on failure')}
                                                        validate={{
                                                            errors, touched,
                                                            fieldName: `elements[${elementIndex}].actionOnFailure`,
                                                            isSubmitted: this.props.submitted
                                                        }}
                                                    >
                                                        <StyledFormikField onBlur={() => submit()}
                                                            name={`elements[${elementIndex}].actionOnFailure`}
                                                            component="select" style={{ width: "100%" }}>
                                                            <option value="next">{getTranslation('show next messages')}</option>
                                                            <option value="fallback">{getTranslation('go to fallback')}</option>
                                                        </StyledFormikField>
                                                    </LabelWrapper>
                                                </Styled66Container>
                                            </FieldContainer>
                                            <FieldContainer>
                                                <LabelWrapper
                                                    label={getTranslation('Error messages')}
                                                    tooltip={getTranslation('Error messages')}
                                                >
                                                    <FieldArray
                                                        name={`elements[${elementIndex}].errorMessages`}
                                                        render={arrayTextHelpers => {
                                                            return <div className='my-1'>
                                                                {
                                                                    !element?.errorMessages ? null
                                                                        : element?.errorMessages.map((_, index) => {
                                                                            return <FieldItemContainer key={index}>
                                                                                <FieldContainer>
                                                                                    <LabelWrappe>
                                                                                        <LabelWrapper
                                                                                        validate={{
                                                                                            errors, touched,
                                                                                            fieldName: `elements[${elementIndex}].errorMessages[${index}]`,
                                                                                            isSubmitted: this.props.submitted
                                                                                        }}>
                                                                                        <FieldAttributes value={_} type="SELECT" onChange={(data) => {
                                                                                            values.elements[elementIndex].errorMessages[index] = data
                                                                                            submit()
                                                                                        }} />
                                                                                    </LabelWrapper>
                                                                                    </LabelWrappe>
                                                                                    {
                                                                                        element.errorMessages && element.errorMessages.length > 1
                                                                                            ? <DeleteButton onClick={() => {
                                                                                                values.elements[elementIndex].errorMessages.splice(index, 1);
                                                                                                submit();
                                                                                            }} className="icon-delete" />
                                                                                            : null
                                                                                    }
                                                                                    {
                                                                                        values.elements[elementIndex].errorMessages.length - 1 === index
                                                                                            ? <AddTextBtn onClick={() => {
                                                                                                arrayTextHelpers.push("");
                                                                                                submit();
                                                                                            }} />
                                                                                            : null
                                                                                    }

                                                                                </FieldContainer>
                                                                            </FieldItemContainer>;
                                                                        })
                                                                }
                                                            </div>;
                                                        }}
                                                    />
                                                </LabelWrapper>
                                            </FieldContainer>
                                        </ElementContainer>;
                                    })
                                }
                                <AddNewBtnContainer onClick={() => {
                                    arrayElementsHelpers.push(this.getEmptyIResponseElementQuestion());
                                    submit();
                                }}>
                                    <AddNewFieldBtn />
                                    {getTranslation('Add new question')}
                                </AddNewBtnContainer>
                            </MainFormContainer>;
                        }}
                    />
                </Form>;
            }}
        />;
    }
}

export const BotResponseQuestion = I18n(BotResponseQuestionClass);
