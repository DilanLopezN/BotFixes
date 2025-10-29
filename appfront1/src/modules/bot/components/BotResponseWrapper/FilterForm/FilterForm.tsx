import React, { Component } from 'react';
import './FilterForm.scss';
import { FilterFormProps, FilterFormState } from './FilterFormProps';
import { Formik, Form } from 'formik';
import { FilterType, ICondition, FilterOperator } from '../../../../../model/Interaction';
import * as Yup from 'yup';
import { connect } from 'react-redux';
import isArray from 'lodash/isArray';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { FormikErrorMessage } from '../../../../../shared/StyledForms/FormikErrorMessage/FormikErrorMessage';
import { DoneBtn } from '../../../../../shared/StyledForms/DoneBtn/DoneBtn';
import { FormPopup } from '../../../../../shared/FormPopup/FormPopup';
import { DiscardBtn } from '../../../../../shared/StyledForms/DiscardBtn/DiscardBtn';
import isEmpty from 'lodash/isEmpty';
import { ConditionMethodType, Entity } from 'kissbot-core';
import { EntityActions } from '../../../../entity/redux/actions';
import { SetAttributeType } from '../../../../../model/ResponseElement';
import { BotAttrs } from '../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import I18n from '../../../../i18n/components/i18n';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';

class FilterFormClass extends Component<FilterFormProps, FilterFormState> {
    constructor(props: FilterFormProps) {
        super(props);
        this.state = {
            isFormOpened: props.createdNewFilter || false,
        };
    }

    onSubmit = (condition: ICondition, closeModal: boolean) => {
        this.props.onSubmit(condition);
        if (condition.isConditionValid && closeModal) {
            this.toggleModal();
        }
    };

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        const { getTranslation } = this.props;

        return Yup.object().shape({
            type: Yup.string().required(getTranslation('This field is required')),
            operator: Yup.string().required(getTranslation('This field is required')),
            name: Yup.string().required(getTranslation('This field is required')),
            value: Yup.string()
                .required(getTranslation('This field is required'))
                .when('type', (operator: any, schema: any) =>
                    operator === 'json'
                        ? schema.test('json', getTranslation('Content is not json format'), (val: any) => {
                              try {
                                  const json = JSON.parse(val);
                                  if (json && typeof json === 'object') return true;
                              } catch (e) {
                                  return false;
                              }
                          })
                        : schema
                )
                .when('operator', {
                    is: 'empty',
                    then: Yup.string(),
                    otherwise: Yup.string().required(getTranslation('This field is required')),
                })
                .test(
                    'no-whitespace',
                    getTranslation('The entered value contains leading or trailing spaces.'),
                    (value) => {
                        if (!value) return true;
                        return value === value.trim();
                    }
                )
                .default('true'),
        });
    };

    renderForm = () => {
        const { getTranslation } = this.props;

        const typeSys = [
            SetAttributeType.any,
            SetAttributeType.integer,
            SetAttributeType.number,
            SetAttributeType.text,
            SetAttributeType.date,
            SetAttributeType.time,
            SetAttributeType.email,
            SetAttributeType.boolean,
            SetAttributeType.command,
        ];

        return (
            <Formik
                initialValues={{ ...this.props.condition, selectedType: '' }}
                onSubmit={() => {}}
                validationSchema={this.getValidationSchema()}
                render={({
                    values,
                    validateForm,
                    submitForm,
                    touched,
                    errors,
                    setFieldValue,
                    handleChange,
                    handleBlur,
                }) => {
                    const submit = (closeModal) => {
                        validateForm()
                            .then((validatedValues) => {
                                if (Object.keys(validatedValues).length != 0) {
                                    values.isConditionValid = false;
                                } else {
                                    values.isConditionValid = true;
                                }
                                this.onSubmit(values, closeModal);
                                submitForm();
                            })
                            .catch((e) => dispatchSentryError(e));
                    };

                    const getEntriesName = (): Array<string> => {
                        let entity: Entity | undefined;
                        let value: any = [];
                        if (
                            isArray(this.props.entitiesList) &&
                            !isEmpty(this.props.entitiesList) &&
                            values.selectedType
                        ) {
                            entity = this.props.entitiesList.find(
                                (entity) => entity.name === values.selectedType.replace('@', '')
                            );
                            if (entity) {
                                entity.entries.forEach((entry) => {
                                    value.push(entry.name);
                                });
                            }
                        }
                        return value;
                    };

                    return (
                        <Form className='filter-form-container'>
                            <LabelWrapper label={getTranslation('Type')}>
                                <StyledFormikField component='select' name='type' onBlur={() => submit(false)}>
                                    <option value={FilterType.attribute}>Attribute</option>
                                    <option value={FilterType.lifespan}>Lifespan</option>
                                    <option value={FilterType.trigger}>Trigger</option>
                                    <option value={FilterType.json}>Json rule</option>
                                </StyledFormikField>
                                <FormikErrorMessage isSubmitted={this.props.submitted} name='type' />
                            </LabelWrapper>
                            {values.type == FilterType.attribute ? (
                                <LabelWrapper label={getTranslation('Attribute')}>
                                    <BotAttrs
                                        value={{
                                            value: values.name,
                                            label: values.name,
                                        }}
                                        onCreateOption={(ev) => {
                                            setFieldValue('name', ev);
                                        }}
                                        onChange={(ev) => {
                                            setFieldValue('name', ev.value);
                                        }}
                                        showOnly={['defaults', 'entity', 'others']}
                                    />
                                    <FormikErrorMessage isSubmitted={this.props.submitted} name='name' />
                                </LabelWrapper>
                            ) : null}
                            {values.type !== FilterType.json ? (
                                <LabelWrapper label={getTranslation('Operator')}>
                                    <StyledFormikField
                                        component='select'
                                        onChange={(ev) => {
                                            setFieldValue('operator', ev.target.value);
                                            values.operator = ev.target.value;

                                            if (ev.target.value === 'empty') {
                                                setFieldValue('value', 'true');
                                                values.value = 'true';
                                            }
                                            submit(false);
                                        }}
                                        name='operator'
                                    >
                                        <option value={ConditionMethodType.equals}>{getTranslation('Equals')}</option>
                                        <option value={ConditionMethodType.not_equal}>
                                            {getTranslation('Not equals')}
                                        </option>
                                        <option value={ConditionMethodType.empty}>{getTranslation('Empty')}</option>
                                        <option value={ConditionMethodType.contains}>
                                            {getTranslation('Contains')}
                                        </option>
                                        <option value={ConditionMethodType.not_contains}>
                                            {getTranslation('Not contains')}
                                        </option>
                                        {/* <option value={ConditionMethodType.contained_in}>
                                            {getTranslation("It's on the list")}
                                        </option>
                                        <option value={ConditionMethodType.not_contained_in}>
                                            {getTranslation('Not on the list')}
                                        </option> */}
                                        <option value={ConditionMethodType.greater_than}>
                                            {getTranslation('Greater than')}
                                        </option>
                                        <option value={ConditionMethodType.less_than}>
                                            {getTranslation('Less than')}
                                        </option>
                                        <option value={ConditionMethodType.greater_than_or_equal}>
                                            {getTranslation('Greater or equal')}
                                        </option>
                                    </StyledFormikField>
                                    <FormikErrorMessage isSubmitted={this.props.submitted} name='operator' />
                                </LabelWrapper>
                            ) : null}
                            <LabelWrapper
                                label={getTranslation('Value')}
                                validate={{
                                    touched,
                                    errors,
                                    fieldName: 'value',
                                    isSubmitted: this.props.submitted,
                                }}
                            >
                                {values.type !== FilterType.json && values.operator === ConditionMethodType.empty ? (
                                    <StyledFormikField
                                        component='select'
                                        name='value'
                                        onChange={(ev) => {
                                            setFieldValue('value', ev.target.value);
                                            values.value = ev.target.value;
                                        }}
                                    >
                                        <option value={'true'}> {getTranslation('Yes')}</option>
                                        <option value={'false'}> {getTranslation('No')}</option>
                                    </StyledFormikField>
                                ) : isEmpty(typeSys.filter((ele) => values.selectedType === ele)) &&
                                  values.selectedType.startsWith('@') ? (
                                    <StyledFormikField component='select' name='value'>
                                        <option disabled value=''>
                                            {getTranslation('Select value')}
                                        </option>
                                        {getEntriesName().map((name, index) => {
                                            return (
                                                <option value={name} key={index}>
                                                    {name}
                                                </option>
                                            );
                                        })}
                                    </StyledFormikField>
                                ) : values.type === FilterType.json ? (
                                    <StyledFormikField component='textarea' name='value' placeholder='Json rule' />
                                ) : (
                                    <StyledFormikField type='text' name='value' />
                                )}
                            </LabelWrapper>
                            <div className='submit-container'>
                                <DiscardBtn onClick={this.discardModal}>{getTranslation('Cancel')}</DiscardBtn>
                                <DoneBtn onClick={submit}>{getTranslation('Save')}</DoneBtn>
                            </div>
                        </Form>
                    );
                }}
            />
        );
    };

    discardModal = () => {
        this.setState({ isFormOpened: !this.state.isFormOpened });
    };

    toggleModal = () => {
        this.setState({ isFormOpened: !this.state.isFormOpened });
    };

    private getBadgeClass = () => {
        if (this.props.condition.isConditionValid) return 'badge-primary';
        return 'badge-danger';
    };

    private getBadgeName = () => {
        if (this.props.condition.type == FilterType.attribute) return this.props.condition.name;
        return this.props.condition.type;
    };

    onOperatorChange = () => {
        if (this.props.filterOperator == FilterOperator.and) this.props.onOperatorChange(FilterOperator.or);
        else this.props.onOperatorChange(FilterOperator.and);
    };

    formatValue = () => {
        if (this.props.condition.type === FilterType.json) return `{...}`;
        return this.props.condition.value;
    };

    render() {
        return (
            <DisabledTypeContext.Consumer>
                {({ disabledFields }) => {
                    return (
                        <FormPopup
                            isOpenedPopover={this.state.isFormOpened}
                            popupBody={this.renderForm()}
                            onClose={this.toggleModal}
                            trigger=' badge pointer '
                        >
                            <div className='FilterForm'>
                                <div className='filter-badge-container'>
                                    <span
                                        style={{ fontSize: '13px' }}
                                        className={'badge pointer ' + this.getBadgeClass()}
                                        onClick={() => {
                                            if (!disabledFields) {
                                                this.toggleModal();
                                            }
                                        }}
                                    >
                                        {'{{' + this.getBadgeName() + '}}'} {this.props.condition.operator}{' '}
                                        {this.formatValue()}
                                    </span>
                                    {!disabledFields && (
                                        <span className='delete-btn pointer' onClick={this.props.onDelete}>
                                            <span className='mdi mdi-delete-outline' />
                                        </span>
                                    )}
                                    <span
                                        className='and pointer'
                                        onClick={() => {
                                            if (!disabledFields) {
                                                this.onOperatorChange();
                                            }
                                        }}
                                    >
                                        {this.props.filterOperator}
                                    </span>
                                </div>
                            </div>
                        </FormPopup>
                    );
                }}
            </DisabledTypeContext.Consumer>
        );
    }
}

const mapStateToProps = (state: any) => ({
    currentBot: state.botReducer.currentBot,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    entitiesList: state.entityReducer.entitiesList,
});

export const FilterForm = I18n(
    connect(mapStateToProps, {
        setCurrentEntities: EntityActions.setCurrentEntities,
        setCurrentEntity: EntityActions.setCurrentEntity,
    })(FilterFormClass)
);
