import React, { Component } from "react";
import { Formik, Form, FieldArray } from 'formik';
import { BotResponse, BotResponseProps } from "../interfaces";
import styled from 'styled-components';
import { IResponseElementComment, IResponseElementText } from "kissbot-core";
import * as Yup from 'yup';
import { LabelWrapper } from "../../../../../shared/StyledForms/LabelWrapper/LabelWrapper";
import { DeleteBtn } from "../../../../../shared/StyledForms/DeleteBtn/DeleteBtn";
import { AddBtn } from "../../../../../shared/StyledForms/AddBtn/AddBtn";
import { FieldAttributes } from "../../../../../shared/StyledForms/FieldAttributes/FieldAttributes/FieldAttributes";
import I18n from "../../../../i18n/components/i18n";
import { I18nProps } from "../../../../i18n/interface/i18n.interface";
import { v4 } from "uuid"
import { TextAreaSimple } from "../../../../../shared/TextAreaSimple/TextAreaSimple";
import { FaExchangeAlt } from "react-icons/fa";
import { dispatchSentryError } from "../../../../../utils/Sentry";

const TextFieldWrapper = styled("div")`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
    position: relative;
`

const AddNewFieldBtn = styled(AddBtn)`
    margin: 10px auto;
    
`

const StyledDeleteBtn = styled(DeleteBtn)`
    margin: 10px 0;
    position: absolute;
    right: 0;
    top: -5px;
`

const StyledchangeInputBtn = styled(FaExchangeAlt)`
    margin: 10px 0;
    position: absolute;
    right: 7px;
    top: -5px;
    height: 17px;
    width: 18px;
    cursor: pointer;

    :hover {
        color: #007bff;
    }
`

interface BotResponseCommentProps extends BotResponseProps, I18nProps { }

interface BotResponseCommentState {
    objText: any;
    changeInput: boolean;
}

export class BotResponseCommentClass extends Component<BotResponseCommentProps, BotResponseCommentState> {
    state: BotResponseCommentState = {
        objText: {},
        changeInput: false
    }

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        const { getTranslation } = this.props;
        return Yup.object().shape({
            comment: Yup.array()
                .of(Yup.string().required(getTranslation('This field is required')))
        });
    };

    componentDidMount() {
        let obj = {}
        this.props.response.elements[0].comment.forEach(element => {
            obj[v4()] = element
        });
        this.setState({  objText: obj })
    }

    onChange = (values, isValid: boolean) => {
        const elements: Array<IResponseElementComment> = this.props.response.elements as Array<IResponseElementComment>
        elements[0].comment = values.comment;
        const response = this.props.response;
        response.elements = elements;
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    size = (text) => {

        return (text.match(new RegExp('\n', "g")) || []).length
    }

    render() {
        const elements: Array<IResponseElementComment> = this.props.response.elements as Array<IResponseElementComment>
        return <>
            <StyledchangeInputBtn
                title='Trocar input'
                onClick={() => this.setState({  changeInput: !this.state.changeInput })}
            />
            <Formik
                initialValues={{ comment: elements[0].comment as Array<string> }}
                onSubmit={() => { }}
                validationSchema={this.getValidationSchema()}
                render={({ values, submitForm, validateForm, setFieldValue, touched, errors }) => {
                    return <Form>
                        <FieldArray
                            name={"comment"}
                            render={(arrayHelpers) => {
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
                                const setComment = (comment, index) => {
                                    const comments = values.comment;
                                    comments[index] = comment.trim();
                                    setFieldValue('comment', comments);
                                    submit();
                                }
                                return Object.keys(this.state.objText).map((key: string, index: number) => {
                                    const comment = this.state.objText[key]
                                    return <TextFieldWrapper key={key}>
                                        <LabelWrapper validate={{
                                            touched, errors,
                                            isSubmitted: this.props.submitted,
                                            fieldName: `comment[${index}]`
                                        }}>
                                            {
                                                !this.state.changeInput ?
                                                    <FieldAttributes value={comment} type="SELECT" onChange={(data) => {
                                                        this.setState({ objText: { ...this.state.objText, [key]: data.trim() } })
                                                        setComment(data, index)
                                                    }} />
                                                    :
                                                    <TextAreaSimple
                                                        value={comment}
                                                        style={{ height: `${this.size(comment) * 27}px`, overflowY: 'hidden' }}
                                                        onChange={(event) => {
                                                            this.setState({ objText: { ...this.state.objText, [key]: event.target.value } })
                                                            setComment(event.target.value, index)
                                                        }} />
                                            }
                                        </LabelWrapper>
                                        {values.comment.length > 1 ? <StyledDeleteBtn onClick={() => {
                                            values.comment.splice(index, 1);
                                            const obj = { ...this.state.objText }
                                            delete obj[key]
                                            this.setState({ objText: obj })
                                            submit();
                                        }} /> : null}
                                        {values.comment.length - 1 == index
                                            ? <AddNewFieldBtn onClick={() => {
                                                values.comment.push('');
                                                this.setState({ objText: { ...this.state.objText, [v4()]: '' } })
                                                submit();
                                            }} />
                                            : null
                                        }
                                    </TextFieldWrapper>
                                })
                            }}
                        />
                    </Form>
                }}
            />
        </>
    }
}

export const BotResponseComment = I18n(BotResponseCommentClass);
