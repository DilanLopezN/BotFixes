import { Component } from 'react';
import './UserSays.scss';
import { UserSaysProps } from './UserSaysProps';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import findLastIndex from 'lodash/findLastIndex';
import pullAt from 'lodash/pullAt';
import isEmpty from 'lodash/isEmpty';
import { IPart, IUserSay } from '../../../../../model/Interaction';
import { FieldAttributes } from '../../../../../shared/StyledForms/FieldAttributes/FieldAttributes/FieldAttributes';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { AddBtn } from '../../../../../shared/StyledForms/AddBtn/AddBtn';
import { DeleteBtn } from '../../../../../shared/StyledForms/DeleteBtn/DeleteBtn';
import { v4 } from 'uuid';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';

export class UserSays extends Component<UserSaysProps> {
    onChange = (userSays: Array<IUserSay>, isValid: boolean) => {
        this.props.onChangeInput(userSays, isValid);
    };

    getValidationSchema = () => {
        return Yup.object().shape({
            userSays: Yup.array().of(
                Yup.object().shape({
                    parts: Yup.array().of(
                        Yup.object().shape({
                            value: Yup.string().required('This field is required'),
                        })
                    ),
                })
            ),
        });
    };

    getWrapperClass = () => {
        if (this.props.isSubmitted && this.props.isValidUserSays == false) return 'alert-danger';
    };

    isEmptyUserSays = (array) => {
        const listEmpty: any = [];
        array.userSays.map((userSay, index) => {
            const lastIndex = findLastIndex(array.userSays);
            if (isEmpty(userSay.parts) && lastIndex !== index) {
                listEmpty.push({ errors: 'userSays' });
            }
        });

        return;
    };

    render() {
        return (
            <DisabledTypeContext.Consumer>
                {({ disabledFields }) => {
                    return (
                        <div className={'UserSays ' + this.getWrapperClass()}>
                            <LabelWrapper
                                label='User says'
                                asTitle={true}
                                tooltip='Trigger this interaction by what user says.'
                            >
                                <Formik
                                    initialValues={{ userSays: this.props.userSays }}
                                    onSubmit={() => {}}
                                    validationSchema={this.getValidationSchema()}
                                    render={({ values, submitForm, validateForm, setFieldValue, errors, touched }) => {
                                        const valueUserSays = !isEmpty(values.userSays)
                                            ? values.userSays
                                            : [
                                                  {
                                                      parts: [
                                                          {
                                                              value: '',
                                                          },
                                                      ],
                                                  },
                                              ];
                                        return (
                                            <Form>
                                                <FieldArray
                                                    name='userSays'
                                                    render={(arrayHelpers) => {
                                                        const submit = () => {
                                                            validateForm()
                                                                .then((validatedValues: any) => {
                                                                    if (validatedValues.isCanceled) {
                                                                        submit();
                                                                        return;
                                                                    }

                                                                    if (!isEmpty(this.isEmptyUserSays(values))) {
                                                                        this.onChange(values.userSays, false);
                                                                    } else {
                                                                        this.onChange(values.userSays, true);
                                                                    }
                                                                    submitForm();
                                                                })
                                                                .catch((e) => dispatchSentryError(e));
                                                        };

                                                        const addItem = () => {
                                                            arrayHelpers.push({ parts: [''], id: v4() });
                                                            submit();
                                                        };

                                                        const deleteItem = (index) => {
                                                            // arrayHelpers.remove(index);
                                                            pullAt(values.userSays, index);
                                                            submit();
                                                        };

                                                        const setUserSayParts = (
                                                            parts: Array<IPart>,
                                                            idUserSays,
                                                            index
                                                        ) => {
                                                            const userSays = values.userSays;
                                                            userSays[index] = { parts, _id: idUserSays };
                                                            setFieldValue('userSays', userSays);
                                                            submit();
                                                        };
                                                        return valueUserSays.map((userSay: IUserSay, index: number) => {
                                                            const idUserSays = userSay._id || userSay.id || 0;
                                                            return (
                                                                <div
                                                                    className='userSays-field-container'
                                                                    key={idUserSays}
                                                                >
                                                                    <div className='userSays-field-wrapper'>
                                                                        <LabelWrapper
                                                                            validate={{
                                                                                errors,
                                                                                touched,
                                                                                fieldName: `userSays.${index}.parts`,
                                                                                isSubmitted: this.props.isSubmitted,
                                                                            }}
                                                                        >
                                                                            <FieldAttributes
                                                                                value={userSay.parts}
                                                                                type='CREATE'
                                                                                onChange={(parts) => {
                                                                                    if (!!disabledFields) {
                                                                                        return;
                                                                                    }
                                                                                    setUserSayParts(
                                                                                        parts,
                                                                                        idUserSays,
                                                                                        index
                                                                                    );
                                                                                }}
                                                                            />
                                                                        </LabelWrapper>
                                                                        {!disabledFields &&
                                                                        values.userSays.length > 1 ? (
                                                                            <DeleteBtn
                                                                                className='icon-delete'
                                                                                onClick={() => {
                                                                                    deleteItem(index);
                                                                                }}
                                                                            />
                                                                        ) : null}
                                                                    </div>
                                                                    {!disabledFields &&
                                                                    index === values.userSays.length - 1 ? (
                                                                        <AddBtn
                                                                            className='add'
                                                                            onClick={() => {
                                                                                const lastIndex =
                                                                                    userSay.parts.length - 1;
                                                                                if (
                                                                                    !isEmpty(userSay.parts[lastIndex])
                                                                                ) {
                                                                                    addItem();
                                                                                    return;
                                                                                }
                                                                                submit();
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                </div>
                                                            );
                                                        });
                                                    }}
                                                />
                                            </Form>
                                        );
                                    }}
                                />
                            </LabelWrapper>
                        </div>
                    );
                }}
            </DisabledTypeContext.Consumer>
        );
    }
}
