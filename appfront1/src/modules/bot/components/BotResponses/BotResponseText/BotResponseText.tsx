import React, { Component } from 'react';
import { Formik, Form, FieldArray } from 'formik';
import { BotResponseProps } from '../interfaces';
import styled from 'styled-components';
import { IResponseElementText } from 'kissbot-core';
import * as Yup from 'yup';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { DeleteBtn } from '../../../../../shared/StyledForms/DeleteBtn/DeleteBtn';
import { AddBtn } from '../../../../../shared/StyledForms/AddBtn/AddBtn';
import { FieldAttributes } from '../../../../../shared/StyledForms/FieldAttributes/FieldAttributes/FieldAttributes';
import I18n from '../../../../i18n/components/i18n';
import { I18nProps } from '../../../../i18n/interface/i18n.interface';
import { v4 } from 'uuid';
import { TextAreaSimple } from '../../../../../shared/TextAreaSimple/TextAreaSimple';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import { MdRepeat } from 'react-icons/md';

const TextFieldWrapper = styled('div')`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 10px;
    position: relative;
`;

const AddNewFieldBtn = styled(AddBtn)`
    margin: 10px auto;
`;

const StyledDeleteBtn = styled(DeleteBtn)`
    margin: 10px 0;
    position: absolute;
    right: 0;
    top: -5px;
`;

const StyledchangeInputBtn = styled(MdRepeat)`
    margin: 10px 0;
    position: absolute;
    right: 7px;
    top: 22px;
    height: 17px;
    width: 18px;
    cursor: pointer;

    :hover {
        color: #007bff;
    }
`;

interface BotResponseTextProps extends BotResponseProps, I18nProps {}

interface BotResponseTextState {
    objText: any;
    changeInput: boolean;
}

export class BotResponseTextClass extends Component<BotResponseTextProps, BotResponseTextState> {
    state: BotResponseTextState = {
        objText: {},
        changeInput: false,
    };

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        const { getTranslation } = this.props;
        return Yup.object().shape({
            text: Yup.array().of(Yup.string().required(getTranslation('This field is required'))),
        });
    };

    componentDidMount() {
        let obj = {};
        this.props.response.elements[0].text.forEach((element) => {
            obj[v4()] = element;
        });
        this.setState({ objText: obj });
    }

    onChange = (values, isValid: boolean) => {
        const elements: Array<IResponseElementText> = this.props.response.elements as Array<IResponseElementText>;
        elements[0].text = values.text;
        const response = this.props.response;
        response.elements = elements;
        response.isResponseValid = isValid;
        this.props.onChange(response);
    };

    size = (text) => {
        return (text.match(new RegExp('\n', 'g')) || []).length;
    };

    render() {
        const elements: Array<IResponseElementText> = this.props.response.elements as Array<IResponseElementText>;
        return (
            <>
                <StyledchangeInputBtn
                    title='Trocar para campo de texto ou de handlebars'
                    onClick={() => this.setState({ changeInput: !this.state.changeInput })}
                />
                <Formik
                    initialValues={{ text: elements[0].text as Array<string> }}
                    onSubmit={() => {}}
                    validationSchema={this.getValidationSchema()}
                    render={({ values, submitForm, validateForm, setFieldValue, touched, errors }) => {
                        return (
                            <Form>
                                <FieldArray
                                    name={'text'}
                                    render={(arrayHelpers) => {
                                        const submit = () => {
                                            validateForm()
                                                .then((validatedValues: any) => {
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
                                                })
                                                .catch((e) => dispatchSentryError(e));
                                        };
                                        const setText = (text, index) => {
                                            const texts = values.text;
                                            texts[index] = text.trim();
                                            setFieldValue('text', texts);
                                            submit();
                                        };
                                        return Object.keys(this.state.objText).map((key: string, index: number) => {
                                            const text = this.state.objText[key];
                                            return (
                                                <TextFieldWrapper key={key}>
                                                    <LabelWrapper
                                                        validate={{
                                                            touched,
                                                            errors,
                                                            isSubmitted: this.props.submitted,
                                                            fieldName: `text[${index}]`,
                                                        }}
                                                    >
                                                        {!this.state.changeInput ? (
                                                            <FieldAttributes
                                                                value={text}
                                                                type='SELECT'
                                                                onChange={(data) => {
                                                                    this.setState({
                                                                        objText: {
                                                                            ...this.state.objText,
                                                                            [key]: data.trim(),
                                                                        },
                                                                    });
                                                                    setText(data, index);
                                                                }}
                                                            />
                                                        ) : (
                                                            <TextAreaSimple
                                                                value={text}
                                                                style={{
                                                                    height: `${this.size(text) * 27}px`,
                                                                    overflowY: 'hidden',
                                                                }}
                                                                onChange={(event) => {
                                                                    this.setState({
                                                                        objText: {
                                                                            ...this.state.objText,
                                                                            [key]: event.target.value,
                                                                        },
                                                                    });
                                                                    setText(event.target.value, index);
                                                                }}
                                                            />
                                                        )}
                                                    </LabelWrapper>
                                                    {values.text.length > 1 ? (
                                                        <StyledDeleteBtn
                                                            onClick={() => {
                                                                values.text.splice(index, 1);
                                                                const obj = { ...this.state.objText };
                                                                delete obj[key];
                                                                this.setState({ objText: obj });
                                                                submit();
                                                            }}
                                                        />
                                                    ) : null}
                                                    {values.text.length - 1 == index ? (
                                                        <AddNewFieldBtn
                                                            onClick={() => {
                                                                values.text.push('');
                                                                this.setState({
                                                                    objText: { ...this.state.objText, [v4()]: '' },
                                                                });
                                                                submit();
                                                            }}
                                                        />
                                                    ) : null}
                                                </TextFieldWrapper>
                                            );
                                        });
                                    }}
                                />
                            </Form>
                        );
                    }}
                />
            </>
        );
    }
}

export const BotResponseText = I18n(BotResponseTextClass);
