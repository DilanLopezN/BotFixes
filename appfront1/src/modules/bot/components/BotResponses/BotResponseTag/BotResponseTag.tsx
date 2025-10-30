import { FieldArray, Form, Formik } from 'formik';
import { IResponseElementTags, TagsElementAction } from 'kissbot-core';
import { Component } from 'react';
import { connect } from 'react-redux';
import * as Yup from 'yup';
import InputColor from '../../../../../shared/StyledForms/InputColor';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import { getRandomColor } from '../../../../../utils/getRandomColor';
import I18n from '../../../../i18n/components/i18n';
import { AddTextBtn, CenterDiv, DeleteElementButton, Main } from './styles';

export class BotResponseTagClass extends Component<any, any> {
    onChange = (values, isValid) => {
        const response = this.props.response;
        response.elements = values.elements;
        response.isResponseValid = isValid;
        if (this.props.onChange) {
            this.props.onChange(response);
        }
    };

    getValidationSchema = () => {
        return Yup.object().shape({
            elements: Yup.array().of(
                Yup.object().shape({
                    color: Yup.string().when('action', {
                        is: 'add',
                        then: Yup.string()
                            .length(7, this.props.getTranslation('Invalid color'))
                            .required(this.props.getTranslation('Invalid color')),
                    }),
                    name: Yup.string().when('action', {
                        is: ['add', 'remove'],
                        then: Yup.string().required(),
                    }),
                })
            ),
        });
    };

    render() {
        const { getTranslation } = this.props;

        const elements: Array<IResponseElementTags> = this.props.response.elements as Array<IResponseElementTags>;
        return (
            <Formik
                initialValues={{ elements }}
                onSubmit={() => {}}
                validationSchema={this.getValidationSchema()}
                render={({ values, submitForm, validateForm, setFieldValue, touched, errors, setFieldTouched }) => {
                    return (
                        <Form className='Tag'>
                            <FieldArray
                                name={'elements'}
                                render={() => {
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

                                    return (
                                        <>
                                            {values.elements.map((tag, index) => {
                                                return (
                                                    <Main key={`tag:${index}`}>
                                                        <LabelWrapper label={getTranslation('Action')}>
                                                            <StyledFormikField
                                                                name={`elements[${index}].action`}
                                                                component='select'
                                                                onBlur={submit}
                                                            >
                                                                <option value={TagsElementAction.ADD}>
                                                                    {getTranslation('add')}
                                                                </option>
                                                            </StyledFormikField>
                                                        </LabelWrapper>

                                                        <LabelWrapper label={getTranslation('Name')}>
                                                            <StyledFormikField
                                                                type='text'
                                                                onBlur={submit}
                                                                name={`elements[${index}].name`}
                                                                placeholder={getTranslation('Name')}
                                                            />
                                                        </LabelWrapper>

                                                        {values.elements[index].action === TagsElementAction.ADD && (
                                                            <LabelWrapper
                                                                validate={{
                                                                    touched,
                                                                    errors,
                                                                    isSubmitted: this.props.submitted,
                                                                    fieldName: `elements[${index}].color`,
                                                                }}
                                                                label={getTranslation('Color')}
                                                            >
                                                                <InputColor
                                                                    name={`elements[${index}].color`}
                                                                    value={values.elements[index].color}
                                                                    onChange={(color) => {
                                                                        setFieldValue(
                                                                            `elements[${index}].color`,
                                                                            `#${color}`
                                                                        );
                                                                        setFieldTouched(
                                                                            `elements[${index}].color`,
                                                                            true
                                                                        );
                                                                        values.elements[index].color = `#${color}`;
                                                                    }}
                                                                    onBlur={submit}
                                                                />
                                                            </LabelWrapper>
                                                        )}

                                                        {values.elements.length > 1 && (
                                                            <DeleteElementButton
                                                                onClick={() => {
                                                                    if (values.elements.length === 1) return;
                                                                    values.elements.splice(index, 1);
                                                                    submit();
                                                                }}
                                                            />
                                                        )}
                                                    </Main>
                                                );
                                            })}
                                            <CenterDiv>
                                                <AddTextBtn
                                                    onClick={() => {
                                                        values.elements.push({
                                                            action: TagsElementAction.ADD,
                                                            color: getRandomColor(),
                                                            name: '',
                                                        });
                                                        submit();
                                                    }}
                                                />
                                            </CenterDiv>
                                        </>
                                    );
                                }}
                            />
                        </Form>
                    );
                }}
            />
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({});

export const BotResponseTag = I18n(connect(mapStateToProps, {})(BotResponseTagClass));

export default BotResponseTag;
