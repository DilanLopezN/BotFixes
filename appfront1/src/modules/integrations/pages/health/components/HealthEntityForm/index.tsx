import { Button, Checkbox, Col, InputNumber, Row, Select } from 'antd';
import { Formik } from 'formik';
import { HealthEntitySource, HealthEntityType } from 'kissbot-core';
import React, { FC } from 'react';
import * as Yup from 'yup';
import { IntegrationsType } from '../../../../../../model/Integrations';
import { LabelWithTooltip } from '../../../../../../shared-v2/LabelWithToltip';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import FormAppointmentType from './FormAppointmentType';
import FormDoctorData from './FormDoctorData';
import FormInsuranceParams from './FormInsuranceParams';
import FormOccupationAreaParams from './FormOccupationAreaParams';
import FormReferences from './FormReferences';
import FormSpeciality from './FormSpeciality';
import FormSpecialityType from './FormSpecialityType';
import FormTypeOfService from './FormTypeOfService';
import { HealthEntityFormProps } from './props';
import { Content, CustomFields, FormContainer, RowDiv, Scroll } from './styles';

const { Option } = Select;

const getValidationSchema = (): Yup.ObjectSchema<any> => {
    return Yup.object().shape({
        name: Yup.string().required(),
        friendlyName: Yup.string().required(),
        order: Yup.number().required(),
        synonyms: Yup.array().of(Yup.string()),
        code: Yup.string().required(),
    });
};

const HealthEntityForm = ({
    getTranslation,
    entity,
    onEntitySaved,
    onClose,
    integrationId,
    workspaceId,
    integrationType,
}: HealthEntityFormProps & I18nProps) => {
    const customFieldsToRender = (): { Component: React.FC<any> | null } => {
        switch (entity.entityType) {
            case HealthEntityType.speciality:
                return {
                    Component: FormSpecialityType,
                };

            case HealthEntityType.insurance:
                return {
                    Component: FormInsuranceParams,
                };

            case HealthEntityType.procedure:
                return {
                    Component:
                        entity.source === HealthEntitySource.user || integrationType === IntegrationsType.AMIGO
                            ? FormSpeciality
                            : FormDoctorData,
                };

            case HealthEntityType.occupationArea:
                return {
                    Component: FormOccupationAreaParams,
                };

            case HealthEntityType.typeOfService:
                return {
                    Component: FormTypeOfService,
                };

            case HealthEntityType.appointmentType:
                return {
                    Component: FormAppointmentType,
                };

            case HealthEntityType.doctor:
                return {
                    Component: FormDoctorData,
                };

            default:
                return {
                    Component: null,
                };
        }
    };

    const references = {
        [HealthEntityType.organizationUnitLocation]: [HealthEntityType.organizationUnit],
        [HealthEntityType.doctor]: [HealthEntityType.occupationArea],
        [HealthEntityType.occupationArea]: [HealthEntityType.speciality, HealthEntityType.procedure],
    };

    const editing = !!entity._id;

    if (!entity.params && entity.entityType === HealthEntityType.occupationArea) {
        entity.params = {
            hasRelationshipWithDoctors: true,
        };
    }

    return (
        <Formik
            initialValues={{ ...entity, order: entity.order ?? -1 }}
            onSubmit={(values) => {
                onEntitySaved(values);
            }}
            validationSchema={getValidationSchema()}
            render={(formProps) => {
                const { values, submitForm, setFieldValue, touched, errors, submitCount } = formProps;
                const { Component } = customFieldsToRender();

                return (
                    <FormContainer>
                        <Wrapper
                            bgcolor='#FFF'
                            height='70px'
                            flexBox
                            alignItems='center'
                            justifyContent='space-between'
                            padding='0 30px 0 15px'
                            borderBottom='1px #ddd solid'
                        >
                            <Wrapper flexBox alignItems='center'>
                                <Wrapper flexBox cursor='pointer' alignItems='center'>
                                    <span className='mdi mdi-24px mdi-close' onClick={onClose} />
                                </Wrapper>
                                <Wrapper padding='0 0 0 15px' fontSize='13pt'>
                                    {editing ? entity.friendlyName : getTranslation('New entity')}
                                </Wrapper>
                            </Wrapper>

                            <Wrapper flexBox alignItems='center'>
                                <Button type='primary' className='antd-span-default-color' onClick={() => submitForm()}>
                                    {getTranslation('Save')}
                                </Button>
                            </Wrapper>
                        </Wrapper>
                        <Scroll overflowX='auto' height='calc(100% - 110px)'>
                            <Content>
                                {editing ? (
                                    <LabelWrapper
                                        label={
                                            <LabelWithTooltip
                                                color='default'
                                                label={getTranslation('Code')}
                                                tooltipText={getTranslation('Code.')}
                                            />
                                        }
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: 'code',
                                            isSubmitted: submitCount > 0,
                                        }}
                                    >
                                        <StyledFormikField
                                            autoFocus
                                            disabled={true}
                                            name='code'
                                            placeholder={getTranslation('Code')}
                                        />
                                    </LabelWrapper>
                                ) : (
                                    <LabelWrapper
                                        label={
                                            <LabelWithTooltip
                                                color='default'
                                                label={getTranslation('Code')}
                                                tooltipText={getTranslation('Code.')}
                                            />
                                        }
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: 'code',
                                            isSubmitted: submitCount > 0,
                                        }}
                                    >
                                        <StyledFormikField
                                            autoFocus
                                            disabled={entity.source === HealthEntitySource.erp}
                                            name={`code`}
                                            placeholder={getTranslation('Code')}
                                        />
                                    </LabelWrapper>
                                )}
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <LabelWrapper
                                            label={
                                                <LabelWithTooltip
                                                    color='default'
                                                    label={getTranslation('Name')}
                                                    tooltipText={getTranslation('Name imported into ERP')}
                                                />
                                            }
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'name',
                                                isSubmitted: submitCount > 0,
                                            }}
                                        >
                                            <StyledFormikField
                                                disabled={entity.source === HealthEntitySource.erp && entity.name}
                                                name={`name`}
                                                placeholder={getTranslation('Name')}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col span={12}>
                                        <LabelWrapper
                                            label={
                                                <LabelWithTooltip
                                                    color='default'
                                                    label={getTranslation('Friendly name')}
                                                    tooltipText={getTranslation('Name to be displayed in the bot')}
                                                />
                                            }
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'friendlyName',
                                                isSubmitted: submitCount > 0,
                                            }}
                                        >
                                            <StyledFormikField
                                                name={`friendlyName`}
                                                placeholder={getTranslation('Friendly name')}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col>
                                        <LabelWrapper
                                            label={
                                                <LabelWithTooltip
                                                    color='default'
                                                    label={getTranslation('Order')}
                                                    tooltipText={getTranslation(
                                                        'The higher the number, the closer to the beginning it will be.'
                                                    )}
                                                />
                                            }
                                            validate={{
                                                touched,
                                                errors,
                                                fieldName: 'order',
                                                isSubmitted: submitCount > 0,
                                            }}
                                        >
                                            <StyledFormikField
                                                type={'number'}
                                                name={`order`}
                                                placeholder={getTranslation('Order')}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col>
                                        <LabelWrapper label={getTranslation('Minimum age')}>
                                            <InputNumber
                                                style={{ height: 42, borderRadius: 3, lineHeight: 3 }}
                                                min={0}
                                                max={200}
                                                value={values?.params?.minimumAge}
                                                onChange={(value) => setFieldValue('params.minimumAge', value)}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                    <Col>
                                        <LabelWrapper label={getTranslation('Maximum age')}>
                                            <InputNumber
                                                style={{ height: 42, borderRadius: 3, lineHeight: 3 }}
                                                min={0}
                                                max={200}
                                                value={values?.params?.maximumAge}
                                                onChange={(value) => setFieldValue('params.maximumAge', value)}
                                            />
                                        </LabelWrapper>
                                    </Col>
                                </Row>

                                <RowDiv>
                                    <LabelWrapper
                                        label={
                                            <LabelWithTooltip
                                                color='default'
                                                label={getTranslation('Cancel')}
                                                tooltipText={getTranslation(
                                                    "Enables automatic cancellation of this entity within the bot's flow."
                                                )}
                                            />
                                        }
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: 'canCancel',
                                            isSubmitted: submitCount > 0,
                                        }}
                                    >
                                        <Checkbox
                                            checked={values.canCancel}
                                            disabled={values.activeErp === false}
                                            onChange={(ev) => {
                                                setFieldValue('canCancel', ev.target.checked);
                                            }}
                                        />
                                    </LabelWrapper>
                                    <LabelWrapper
                                        label={
                                            <LabelWithTooltip
                                                color='default'
                                                label={getTranslation('Confirm active')}
                                                tooltipText={getTranslation('Allow push active commit for this entity')}
                                            />
                                        }
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: 'canConfirmActive',
                                            isSubmitted: submitCount > 0,
                                        }}
                                    >
                                        <Checkbox
                                            checked={values.canConfirmActive}
                                            disabled={values.activeErp === false}
                                            onChange={(ev) => {
                                                setFieldValue('canConfirmActive', ev.target.checked);
                                            }}
                                        />
                                    </LabelWrapper>
                                    <LabelWrapper
                                        label={
                                            <LabelWithTooltip
                                                color='default'
                                                label={getTranslation('Confirm liability')}
                                                tooltipText={getTranslation(
                                                    'Allow the patient to confirm their appointment through the bot'
                                                )}
                                            />
                                        }
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: 'canConfirmPassive',
                                            isSubmitted: submitCount > 0,
                                        }}
                                    >
                                        <Checkbox
                                            checked={values.canConfirmPassive}
                                            disabled={values.activeErp === false}
                                            onChange={(ev) => {
                                                setFieldValue('canConfirmPassive', ev.target.checked);
                                            }}
                                        />
                                    </LabelWrapper>
                                </RowDiv>
                                <RowDiv>
                                    <LabelWrapper
                                        label={
                                            <LabelWithTooltip
                                                color='default'
                                                label={getTranslation('Reschedule')}
                                                tooltipText={getTranslation(
                                                    "Enables automatic rescheduling of this entity within the bot's flow."
                                                )}
                                            />
                                        }
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: 'canReschedule',
                                            isSubmitted: submitCount > 0,
                                        }}
                                    >
                                        <Checkbox
                                            checked={values.canReschedule}
                                            disabled={values.activeErp === false}
                                            onChange={(ev) => {
                                                setFieldValue('canReschedule', ev.target.checked);
                                            }}
                                        />
                                    </LabelWrapper>
                                    <LabelWrapper
                                        label={
                                            <LabelWithTooltip
                                                color='default'
                                                label={getTranslation('To schedule')}
                                                tooltipText={getTranslation(
                                                    "Enables automatic scheduling of this entity within the bot's flow."
                                                )}
                                            />
                                        }
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: 'canSchedule',
                                            isSubmitted: submitCount > 0,
                                        }}
                                    >
                                        <Checkbox
                                            checked={values.canSchedule}
                                            disabled={values.activeErp === false}
                                            onChange={(ev) => {
                                                setFieldValue('canSchedule', ev.target.checked);
                                            }}
                                        />
                                    </LabelWrapper>
                                    <LabelWrapper
                                        label={getTranslation('To view')}
                                        validate={{
                                            touched,
                                            errors,
                                            fieldName: 'canView',
                                            isSubmitted: submitCount > 0,
                                        }}
                                    >
                                        <Checkbox
                                            checked={values.canView}
                                            disabled={values.activeErp === false}
                                            onChange={(ev) => {
                                                setFieldValue('canView', ev.target.checked);
                                            }}
                                        />
                                    </LabelWrapper>
                                </RowDiv>
                                <LabelWrapper
                                    label={
                                        <LabelWithTooltip
                                            color='default'
                                            label={getTranslation('Synonyms')}
                                            tooltipText={getTranslation(
                                                'Keywords that, when typed, will match with the entity.'
                                            )}
                                        />
                                    }
                                    validate={{
                                        touched,
                                        errors,
                                        fieldName: 'synonyms',
                                        isSubmitted: submitCount > 0,
                                    }}
                                >
                                    <Select
                                        disabled={false}
                                        size='large'
                                        allowClear
                                        onClick={(e) => {
                                            e.stopPropagation();
                                        }}
                                        placeholder={getTranslation('Synonyms')}
                                        value={values.synonyms}
                                        onChange={(value) => {
                                            setFieldValue('synonyms', value);
                                        }}
                                        mode='tags'
                                        style={{ width: '100%' }}
                                    >
                                        {values.synonyms.map((syn) => (
                                            <Option key={syn} value={syn}>
                                                {syn}
                                            </Option>
                                        ))}
                                    </Select>
                                </LabelWrapper>
                                {!!Component && (
                                    <CustomFields>
                                        <Component
                                            integrationId={integrationId}
                                            workspaceId={workspaceId}
                                            {...formProps}
                                        />
                                    </CustomFields>
                                )}
                                {!!references[entity.entityType] &&
                                    references[entity.entityType].map((refEntityType) => (
                                        <FormReferences
                                            reference={refEntityType}
                                            integrationId={integrationId}
                                            workspaceId={workspaceId}
                                            {...formProps}
                                        />
                                    ))}
                            </Content>
                        </Scroll>
                    </FormContainer>
                );
            }}
        />
    );
};
export default i18n(HealthEntityForm) as FC<HealthEntityFormProps>;
