import React, { Component } from "react";
import { FieldArray, Form, Formik } from 'formik';
import styled from 'styled-components';
import { SetAttributeAction, SetAttributeType } from "../../../../../model/ResponseElement";
import * as Yup from 'yup';
import { connect } from "react-redux";
import { BotResponseSetAttributeProps } from "./BotResponseSetAttributeProps";
import isEmpty from 'lodash/isEmpty';
import isArray from 'lodash/isArray';
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { AddBtn } from "../../../../../shared/StyledForms/AddBtn/AddBtn";
import { StyledFormikField } from "../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import { IResponseElementSetAttribute } from "kissbot-core";
import { EntitySelect } from "../../../../../shared/StyledForms/EntitySelect/EntitySelect";
import { Entity } from "kissbot-core/lib";
import { EntityActions } from "../../../../entity/redux/actions";
import { ButtonIconDelete } from "../../../../../shared/StyledForms/ButtonIconDelete/ButtonIconDelete";
import { withRouter } from "react-router";
import { BotAttrs } from "../../../../../shared/StyledForms/BotAttrs/BotAttrs";
import { GetArrayWords } from "../../../../i18n/interface/i18n.interface";
import I18n from "../../../../i18n/components/i18n";
import { dispatchSentryError } from "../../../../../utils/Sentry";

const ElementContainer = styled("div")`
    display: flex;
`;

const ElementWrapper = styled("div")`
    align-items: center;
`;


const FieldWrapper = styled("div")`
    width: 73%;
`;

const FieldWrapperAction = styled("div")`
    margin-right: 10px;
    min-width: 161px;
`;

const AddNewFieldBtn = styled(AddBtn)`
    margin: 10px 0;
`;

const WrapperAdd = styled('div')`
        display: flex;
    justify-content: center;
`;

const WrapperInput = styled("div")`
    width: 100%;
`;

const ContainerInputs = styled("div")`
    width: 100%;
    display: flex;
`;

const DeleteBtn = styled(ButtonIconDelete)`
    position: absolute;
    margin-top: 38px;
    right: 0px;
`;

class BotResponseSetAttributeClass extends Component<BotResponseSetAttributeProps> {
    private translation: GetArrayWords;

    constructor(props: Readonly<BotResponseSetAttributeProps>) {
        super(props);
        this.translation = this.props.getArray([
            'remove',
            'set',
            'Attribute name',
            'value',
            'Action',
            'Type',
            'Friendly name to be displayed in a tag'
        ]);
    }

    onChange = (values, isValid: boolean) => {
        const response = this.props.response;
        response.elements = values.elements;
        response.isResponseValid = isValid;

        let listBotAttr: any = response.elements.map((element: any) => {
            if (element.name) {
                return { type: element.type, name: element.name }
            }
        });

        if (this.props.onChange) {
            this.props.onCreateAttribute(listBotAttr);
            this.props.onChange(response);
        }
    };

    getValidationSchema = () => {
        return Yup.object().shape({
            elements: Yup.array()
                .of(
                    Yup.object().shape({
                        value: Yup.string().when('action', {
                            is: SetAttributeAction.remove,
                            then: Yup.string().max(0, 'If "remove_attribute" is selected this field must be empty'),
                            otherwise: Yup.string().required('Required'),
                        }),
                        name: Yup.string().required("This field is required")
                            .max(30, 'Character max length is 30')
                            .matches(/^[A-Za-z0-9_-]*$/, "This field must contains A-Z, a-z, 0-9, _ (underscore), - (dash). And it should start with a letter."),
                        // label: Yup.string().required('This field is required')
                    })
                )
        });
    };

    render() {
        const elements: Array<IResponseElementSetAttribute> = this.props.response.elements as Array<IResponseElementSetAttribute>
        const defaultElements = elements.length > 0 ? elements : [{
            "action": SetAttributeAction.set,
            "name": "",
            "value": "",
            "type": SetAttributeType.any
        }];

        const getInitialValues = () => {
            return defaultElements
                .map((elem: any) => ({
                    ...elem,
                    label: elem.label || '',
                }));
        }

        const typeSys = [SetAttributeType.any, SetAttributeType.integer,
        SetAttributeType.number, SetAttributeType.text,
        SetAttributeType.date, SetAttributeType.time, SetAttributeType.email,
        SetAttributeType.boolean, SetAttributeType.cpf, SetAttributeType.cnpj, SetAttributeType.command];

        return <Formik
            initialValues={{ elements: getInitialValues() as Array<IResponseElementSetAttribute> }}
            onSubmit={() => {
            }}
            validationSchema={this.getValidationSchema()}
            render={({ values, submitForm, validateForm, setFieldValue, touched, errors, handleChange }) => {
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

                return <Form>
                    <FieldArray
                        name={"elements"}
                        render={(arrayHelpers) => {
                            return values.elements.map((element: any, index: number) => {
                                if (isEmpty(element.type)) {
                                    element.type = SetAttributeType.any;
                                }
                                let nameElement = element.name;
                                let disabled = element.action === SetAttributeAction.remove;

                                // if (isEmpty(nameElement) && isArray(this.props.botAttributes)) {
                                //     nameElement = this.props.botAttributes[0].name;
                                // }

                                if (disabled) {
                                    element.value = "";
                                }
                                let setAttributeDisabled = false;

                                const getEntriesName = (): Array<string> => {
                                    let entity: Entity | undefined;
                                    let value: any = [];

                                    if (isArray(this.props.entitiesList) && !isEmpty(this.props.entitiesList) && element.type) {
                                        entity = this.props.entitiesList.find(entity => entity.name === element.type.replace('@', ""));
                                        if (entity) {
                                            entity.entries.forEach(entry => {
                                                value.push(entry.name)
                                            })
                                        }
                                    }
                                    return value;
                                };

                                this.props.botAttributes.map((elem) => {
                                    if (elem.type && elem.type !== "@sys.any" && elem.name === nameElement) {
                                        setAttributeDisabled = isEmpty(typeSys.filter(ele => ele === element.type));
                                    }
                                });
                                return <ElementWrapper key={index}>
                                    <ElementContainer>
                                        <WrapperInput>
                                            <ContainerInputs>
                                                <FieldWrapperAction>
                                                    <LabelWrapper label={this.translation['Action']}>
                                                        <StyledFormikField name={`elements.${index}.action`}
                                                            component="select" onBlur={submit}>
                                                            <option value={SetAttributeAction.remove}>
                                                                {this.translation['remove']}
                                                            </option>
                                                            <option value={SetAttributeAction.set}>
                                                                {this.translation['set']}
                                                            </option>
                                                        </StyledFormikField>
                                                    </LabelWrapper>
                                                </FieldWrapperAction>
                                                <FieldWrapper>
                                                    <LabelWrapper
                                                        label={this.translation['Attribute name']}
                                                        validate={{
                                                            touched, errors,
                                                            fieldName: `elements.${index}.name`,
                                                            isSubmitted: this.props.submitted
                                                        }}
                                                    >
                                                        <BotAttrs
                                                            value={{ value: nameElement, label: nameElement }}
                                                            onCreateOption={ev => {
                                                                setFieldValue("name", ev);
                                                                values.elements[index].name = ev;
                                                                values.elements[index].value = "";
                                                            }}
                                                            onChange={event => {
                                                                let value = "";
                                                                if (event && event.value === '') {
                                                                    values.elements[index].name = '';
                                                                    values.elements[index].type = '';
                                                                    setFieldValue(`values.elements[${index}].name`, event.value);
                                                                    setFieldValue(`values.elements[${index}].value`, event.value);
                                                                    submit();
                                                                    return;
                                                                };

                                                                value = event.value;
                                                                const [valueCurrent] = this.props.botAttributes.filter((element) => {
                                                                    if (!element || !event) return null;
                                                                    return element.name === event.value;
                                                                });

                                                                this.props.botAttributes.map((elem) => {
                                                                    if (elem.type && elem.name === nameElement) {
                                                                        setAttributeDisabled = isEmpty(typeSys.filter(ele => ele === element.type));
                                                                    }
                                                                });
                                                                if (!valueCurrent && values.elements[index].action === SetAttributeAction.remove) return;

                                                                values.elements[index].name = value;
                                                                values.elements[index].value = "";

                                                                if(valueCurrent) {
                                                                    values.elements[index].type = valueCurrent.type
                                                                }

                                                                submit();
                                                            }}
                                                            showOnly={['defaults', 'entity', 'others']}
                                                            creatable
                                                        />
                                                    </LabelWrapper>
                                                </FieldWrapper>
                                            </ContainerInputs>
                                            <ContainerInputs>
                                                <FieldWrapperAction onBlur={submit}>
                                                    <LabelWrapper label={this.translation['Type']}>
                                                        <EntitySelect
                                                            fieldName={`elements.${index}.type`}
                                                            disabled={setAttributeDisabled || disabled}
                                                            onChange={handleChange}
                                                        />
                                                    </LabelWrapper>
                                                </FieldWrapperAction>
                                                {setAttributeDisabled ? <FieldWrapper>
                                                    <LabelWrapper label="Value">
                                                        <StyledFormikField name={`elements.${index}.value`}
                                                            component="select" onBlur={submit} disabled={disabled}>
                                                            <option value="no-select">Select a synonym as value</option>
                                                            {getEntriesName().map((name, index) => {
                                                                return <option
                                                                    value={name}
                                                                    key={index}
                                                                >
                                                                    {name}
                                                                </option>
                                                            })}
                                                        </StyledFormikField>
                                                    </LabelWrapper>
                                                </FieldWrapper> :
                                                    <FieldWrapper>
                                                        <LabelWrapper
                                                            label="Value"
                                                            validate={{
                                                                touched, errors,
                                                                fieldName: `elements.${index}.value`,
                                                                isSubmitted: this.props.submitted
                                                            }}
                                                        >
                                                            <StyledFormikField
                                                                type="text"
                                                                disabled={disabled}
                                                                onBlur={submit}
                                                                name={`elements.${index}.value`}
                                                                placeholder={this.translation['value']}
                                                            />
                                                        </LabelWrapper>
                                                    </FieldWrapper>
                                                }
                                            </ContainerInputs>
                                        </WrapperInput>
                                        {values.elements.length !== 1 ?  <DeleteBtn
                                                            onClick={() => {
                                                                arrayHelpers.remove(index);

                                                                const updatedValues = {
                                                                    ...values,
                                                                    elements: values.elements.filter(
                                                                        (_, idx) => idx !== index
                                                                    ),
                                                                };

                                                                validateForm(updatedValues)
                                                                    .then((errors) => {
                                                                        if (Object.keys(errors).length !== 0) {
                                                                            this.onChange(updatedValues, true);
                                                                        } else {
                                                                            this.onChange(updatedValues, false);
                                                                        }
                                                                    })
                                                                    .catch((e) => dispatchSentryError(e));
                                                            }}
                                                        /> : null}
                                    </ElementContainer>
                                    <div
                                        style={{
                                            width: '100%'
                                        }}>
                                        <LabelWrapper
                                            label="Label"
                                            validate={{
                                                touched, errors,
                                                fieldName: `elements.${index}.label`,
                                                isSubmitted: this.props.submitted
                                            }}
                                            tooltip={this.translation['Friendly name to be displayed in a tag']}
                                        >
                                            <StyledFormikField
                                                type="text"
                                                disabled={disabled}
                                                onBlur={submit}
                                                name={`elements.${index}.label`}
                                                placeholder={this.translation['label']}
                                            />
                                        </LabelWrapper>
                                    </div>
                                    {values.elements.length > 1 ? <hr className="my-4" /> : null}
                                    {
                                        index == values.elements.length - 1
                                            ? <WrapperAdd> <AddNewFieldBtn onClick={() => arrayHelpers.push({
                                                "action": SetAttributeAction.set,
                                                "name": "default_country",
                                                "value": ""
                                            })} /> </WrapperAdd>
                                            : null
                                    }
                                </ElementWrapper>
                            })
                        }}
                    />
                </Form>
            }
            }
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    botAttributes: state.botReducer.botAttributes,
    entitiesList: state.entityReducer.entitiesList,
})

export const BotResponseSetAttribute = I18n(withRouter(connect(
    mapStateToProps, {
    setCurrentEntities: EntityActions.setCurrentEntities,
}
)(BotResponseSetAttributeClass)));
