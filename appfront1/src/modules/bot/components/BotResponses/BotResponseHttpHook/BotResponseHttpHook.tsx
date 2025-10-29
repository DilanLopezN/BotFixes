import React, { Component } from "react";
import { FieldArray, Form, Formik } from 'formik';
import styled from 'styled-components';
import * as Yup from 'yup';
import { connect } from "react-redux";
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { StyledFormikField } from "../../../../../shared/StyledForms/StyledFormikField/StyledFormikField";
import { IResponseElementHttpHook } from "kissbot-core";
import { EntityActions } from "../../../../entity/redux/actions";
import { AddBtn } from "../../../../../shared/StyledForms/AddBtn/AddBtn";
import { DeleteBtn } from "../../../../../shared/StyledForms/DeleteBtn/DeleteBtn";
import { BotAttributeSelect } from "../../../../../shared/StyledForms/BotAttributeSelect/BotAttributeSelect";
import { BotAttribute } from "../../../../../model/BotAttribute";
import { EntitySelect } from "../../../../../shared/StyledForms/EntitySelect/EntitySelect";
import { FieldAttributes } from "../../../../../shared/StyledForms/FieldAttributes/FieldAttributes/FieldAttributes";
import I18n from "../../../../i18n/components/i18n";
import { GetArrayWords } from "../../../../i18n/interface/i18n.interface";

const AddHeader = styled(AddBtn)`
    margin-top: 10px;
`
const RemoveHeader = styled(DeleteBtn)`
    position: absolute;
    right: 0;
    top: 35px;
`
const ContainerInputs = styled("div")`
    width: 100%;
    display: flex;
    position: relative;
    .LabelWrapper:first-child:not(:last-child){
        margin-right: 10px;
    }
`;

const MethodFieldContainer = styled("div")`
    width: 25%;
`

const HeadersContainer = styled("div")`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
`;
class BotResponseHttpHookClass extends Component<any> {
    private translation: GetArrayWords;

    constructor(props: any) {
        super(props);
        this.translation = this.props.getArray([
            'Method',
            'Name',
            'Header name',
            'Header value',
            'Enter url',
            'Value',
            'Type of attribute',
            'Save http response to attribute'
        ])
    }

    onChange = (values, isValid: boolean) => {
        const response = this.props.response;
        response.elements = [values];
        response.isResponseValid = isValid;
        let listBotAttr: any = response.elements.map((element: IResponseElementHttpHook) => {
            if (element.attrName) {
                return { type: element.attrType, name: element.attrName }
            }
        }).filter(attr => !!attr);

        if (this.props.onChange) {
            this.props.onCreateAttribute(listBotAttr);
            this.props.onChange(response);
        }
    };

    getValidationSchema = () => {
        return Yup.object().shape({
            url: Yup.string()
                .required()
                .matches(/[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\/\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/, 'This field must be valid url'),
            method: Yup.string()
                .required('Required'),
            attrName: Yup.string(),
            attrType: Yup.string(),
        });
    };

    render() {
        const elements: Array<IResponseElementHttpHook> = this.props.response.elements as Array<IResponseElementHttpHook>

        return <Formik
            initialValues={{ ...elements[0] as IResponseElementHttpHook }}
            onSubmit={() => { }}
            validationSchema={this.getValidationSchema()}
            render={({ values, submitForm, validateForm, setFieldValue, handleBlur, touched, errors, handleChange }) => {
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
                    })
                };
                return <Form>
                    <ContainerInputs>
                        <LabelWrapper validate={{
                            touched, errors,
                            isSubmitted: this.props.submitted,
                            fieldName: `url`
                        }} label="Url">
                            <FieldAttributes value={values.url} type="SELECT"
                                onChange={(data) => {
                                    setFieldValue("url", data);
                                    submit();
                                }}
                            />
                        </LabelWrapper>
                        <MethodFieldContainer>
                            <LabelWrapper validate={{
                                touched, errors,
                                isSubmitted: this.props.submitted,
                                fieldName: `method`
                            }} label={this.translation['Method']}>
                                <StyledFormikField
                                    onBlur={ev => {
                                        handleBlur(ev);
                                        submit();
                                    }}
                                    name={`method`}
                                    component="select"
                                >
                                    <option value="get">GET</option>
                                    <option value="post">POST</option>
                                    <option value="put">PUT</option>
                                    <option value="delete">DELETE</option>
                                    <option value="options">OPTIONS</option>
                                </StyledFormikField>
                            </LabelWrapper>
                        </MethodFieldContainer>
                    </ContainerInputs>
                    <hr />
                    <h5>Http headers</h5>
                    <FieldArray
                        name={"headers"}
                        render={(arrayHelpers) => {
                            return <HeadersContainer>
                                {values.headers ? values.headers.map((_: any, index: number) => {
                                    return <ContainerInputs key={index}>
                                        <LabelWrapper validate={{
                                            touched, errors,
                                            isSubmitted: this.props.submitted,
                                            fieldName: `headers[${index}].name`
                                        }} label={this.translation['Name']}>
                                            <StyledFormikField
                                                onBlur={() => submit()}
                                                name={`headers[${index}].name`}
                                                placeholder={this.translation['Header name']} />
                                        </LabelWrapper>
                                        <LabelWrapper validate={{
                                            touched, errors,
                                            isSubmitted: this.props.submitted,
                                            fieldName: `headers[${index}].value`
                                        }} label={this.translation['Value']}>
                                            <StyledFormikField
                                                onBlur={() => submit()}
                                                name={`headers[${index}].value`}
                                                placeholder={this.translation['Header value']} />
                                        </LabelWrapper>
                                        {
                                            values.headers && values.headers.length > 1
                                                ? <RemoveHeader onClick={() => {
                                                    arrayHelpers.remove(index);
                                                }} />
                                                : null
                                        }
                                    </ContainerInputs>
                                }) : null}
                                <AddHeader
                                    onClick={() => {
                                        arrayHelpers.push({
                                            name: "",
                                            value: ""
                                        });
                                        submit();
                                    }}
                                />
                            </HeadersContainer>
                        }}
                    />
                    <hr />
                    <ContainerInputs>
                        <LabelWrapper validate={{
                            touched, errors,
                            isSubmitted: this.props.submitted,
                            fieldName: `body`
                        }} label="Body">
                            <StyledFormikField
                                onBlur={() => submit()}
                                name={`body`}
                                component="textarea"
                                placeholder={this.translation['Enter url']} />
                        </LabelWrapper>
                    </ContainerInputs>
                    <ContainerInputs>
                        <LabelWrapper validate={{
                            touched, errors,
                            isSubmitted: this.props.submitted,
                            fieldName: `attrName`
                        }} label={this.translation['Save http response to attribute']}>
                            <BotAttributeSelect
                                fieldName="attrName"
                                handleChange={handleChange}
                                onOptionSelected={(attr: BotAttribute) => {
                                    setFieldValue("attrName", attr.name || "");
                                }}
                                onBlur={() => {
                                    submit();
                                }}
                                handleBlur={handleBlur}
                            />
                        </LabelWrapper>
                        <LabelWrapper validate={{
                            touched, errors,
                            isSubmitted: this.props.submitted,
                            fieldName: `attrType`
                        }} label={this.translation['Type of attribute']}>
                            <EntitySelect
                                onChange={(e) => {
                                    handleChange(e);
                                    submit();
                                }}
                                fieldName={`attrType`}
                            />
                        </LabelWrapper>
                    </ContainerInputs>
                </Form>
            }}
        />
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    botAttributes: state.botReducer.botAttributes,
    entitiesList: state.entityReducer.entitiesList,
});

export const BotResponseHttpHook = I18n(connect(
    mapStateToProps, {
    setCurrentEntities: EntityActions.setCurrentEntities,
}
)(BotResponseHttpHookClass));
