import { FC, useEffect, useState } from 'react';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Card } from '../../../../ui-kissbot-v2/common';
import { CustomerFormProps } from './props';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { InputSimple } from '../../../../shared/InputSample/InputSimple';
import { CreatableSelectTags } from '../../../../shared/StyledForms/CreatableSelectTags/CreatableSelectTags';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import styled from 'styled-components';
import { Workspace } from '../../../../model/Workspace';

const Row30 = styled.div`
    display: flex;
    align-items: center;
    width: 33%;
`;

const Row70 = styled.div`
    display: flex;
    align-items: center;
    width: 67%;
`;

const Col = styled.div`
    display: flex;
    align-items: center;
`;

const CustomerForm: FC<CustomerFormProps & I18nProps> = ({
    getTranslation,
    formik,
    formDisabled,
    getCnpj,
    getCep,
    setup,
}) => {
    const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);

    useEffect(() => {
        if (!setup) {
            getWorkspaces();
        }
    }, []);

    const getWorkspaces = async () => {
        const response = await WorkspaceService.getWorkspaceList();

        if (!response) return;

        setWorkspaceList(response.data);
    };

    const cpfCnpjFormat = (value) => {
        //Remove tudo o que não é dígito
        value = value.replace(/\D/g, '');

        if (value.length <= 11) {
            //CPF

            value = value.replace(/(\d{3})(\d)/, '$1.$2');

            value = value.replace(/(\d{3})(\d)/, '$1.$2');

            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            //CNPJ

            value = value.replace(/^(\d{2})(\d)/, '$1.$2');

            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');

            value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');

            value = value.replace(/(\d{4})(\d)/, '$1-$2');
        }

        return value;
    };

    const cepFormat = (value) => {
        value = value.replace(/\D/g, '');

        value = value.replace(/^(\d{2})(\d)/, '$1.$2');

        value = value.replace(/\.(\d{3})(\d)/, '.$1-$2');

        return value;
    };

    const adjustmentValues = (values) => {
        let tags: string[] = [];
        values.map((entity) => {
            if (entity.value) {
                tags.push(entity.value);
            }
        });
        return tags;
    };

    const workspaceToLabel = () => {
        return workspaceList.map((workspace) => ({
            label: workspace.name,
            value: workspace._id || '',
        }));
    };

    return (
        <Card header={getTranslation('Customer')}>
            <Col>
                <Row30 style={{ marginRight: '10px' }}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `registrationId`,
                        }}
                        label={getTranslation('CPF/CNPJ')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            maxLength={18}
                            autoFocus={setup ? false : true}
                            placeholder='CPF/CNPJ'
                            value={formik.values.registrationId}
                            onChange={(event) => {
                                if (!event) return;

                                const value = cpfCnpjFormat(event.target.value);
                                formik.setFieldValue('registrationId', value);
                                getCnpj(value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
                <Row70>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `legalName`,
                        }}
                        label={getTranslation('Corporate name')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('Corporate name')}
                            value={formik.values.legalName}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('legalName', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row70>
            </Col>

            <LabelWrapper
                validate={{
                    touched: formik.touched,
                    errors: formik.errors,
                    isSubmitted: formik.isSubmitting,
                    fieldName: `company`,
                }}
                label={getTranslation('Fantasy name')}
            >
                <InputSimple
                    disabled={formDisabled}
                    placeholder={getTranslation('Fantasy name')}
                    value={formik.values.company}
                    onChange={(event) => {
                        if (!event) return;
                        formik.setFieldValue('company', event.target.value);
                    }}
                />
            </LabelWrapper>

            <Col>
                <Row30 style={{ marginRight: '10px' }}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `postalCode`,
                        }}
                        label={getTranslation('Postal code')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('Postal code')}
                            maxLength={10}
                            value={formik.values.postalCode}
                            onChange={(event) => {
                                if (!event) return;

                                const value = cepFormat(event.target.value);
                                formik.setFieldValue('postalCode', value);
                                getCep(value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
                <Row70>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `addressLine1`,
                        }}
                        label={getTranslation('Address')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('Address')}
                            value={formik.values.addressLine1}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('addressLine1', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row70>
            </Col>

            <Col>
                <Row30 style={{ marginRight: '10px' }}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `addressLine2`,
                        }}
                        label={getTranslation('Number')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('Number')}
                            value={formik.values.addressLine2 || ''}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('addressLine2', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
                <Row30 style={{ marginRight: '10px' }}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `addressLine3`,
                        }}
                        label={getTranslation('Complement')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('Complement')}
                            value={formik.values.addressLine3 ?? ''}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('addressLine3', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
                <Row30>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `districtOrCounty`,
                        }}
                        label={getTranslation('District')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('District')}
                            value={formik.values.districtOrCounty}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('districtOrCounty', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
            </Col>

            <Col>
                <Row30 style={{ marginRight: '10px' }}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `countryCode`,
                        }}
                        label={getTranslation('Country code')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('Country code')}
                            value={formik.values.countryCode}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('countryCode', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
                <Row30 style={{ marginRight: '10px' }}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `state`,
                        }}
                        label={getTranslation('State')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('State')}
                            value={formik.values.state}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('state', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
                <Row30>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `city`,
                        }}
                        label={getTranslation('City')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('City')}
                            value={formik.values.city}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('city', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
            </Col>

            <Col>
                <Row30 style={{ marginRight: '10px' }}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `phoneNumber`,
                        }}
                        label={getTranslation('Telephone')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('Telephone')}
                            type='tel'
                            value={formik.values.phoneNumber}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('phoneNumber', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
                <Row70>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `email`,
                        }}
                        label={getTranslation('Email')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder='Email'
                            type='email'
                            value={formik.values.email || ''}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('email', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row70>
            </Col>

            <Col>
                <Row30 style={{ marginRight: '10px' }}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `gatewayClientId`,
                        }}
                        label={getTranslation('GatewayClientId')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder='GatewayClientId'
                            value={formik.values.gatewayClientId || ''}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('gatewayClientId', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
                <Row70>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `website`,
                        }}
                        label={getTranslation('Website')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder='Website'
                            value={formik.values.website || ''}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('website', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row70>
            </Col>

            <Col>
                <Row30 style={{ marginRight: '10px' }}>
                    <LabelWrapper
                        validate={{
                            touched: formik.touched,
                            errors: formik.errors,
                            isSubmitted: formik.isSubmitting,
                            fieldName: `ibge`,
                        }}
                        label={getTranslation('Ibge city code')}
                    >
                        <InputSimple
                            disabled={formDisabled}
                            placeholder={getTranslation('Ibge city code')}
                            value={formik.values.ibge}
                            onChange={(event) => {
                                if (!event) return;
                                formik.setFieldValue('ibge', event.target.value);
                            }}
                        />
                    </LabelWrapper>
                </Row30>
                {!setup && (
                    <Row70>
                        <LabelWrapper
                            validate={{
                                touched: formik.touched,
                                errors: formik.errors,
                                isSubmitted: formik.isSubmitting,
                                fieldName: `vinculeToWorkspaceIds`,
                            }}
                            label={getTranslation('Linked workspaces')}
                        >
                            <CreatableSelectTags
                                isDisabled={formDisabled || false}
                                options={workspaceToLabel()}
                                onChange={(value) => {
                                    if (!value) {
                                        formik.setFieldValue('vinculeToWorkspaceIds', []);
                                    }
                                    formik.setFieldValue('vinculeToWorkspaceIds', adjustmentValues(value));
                                }}
                                placeholder={getTranslation('Choose a workspace')}
                                value={
                                    Array.isArray(formik.values.vinculeToWorkspaceIds)
                                        ? formik.values.vinculeToWorkspaceIds.map((element: any) => {
                                              return {
                                                  value: element,
                                                  label: workspaceList.find((workspace) => workspace._id === element)
                                                      ?.name,
                                              };
                                          })
                                        : []
                                }
                                onBlur={() => formik.setFieldTouched('vinculeToWorkspaceIds')}
                            />
                        </LabelWrapper>
                    </Row70>
                )}
            </Col>
        </Card>
    );
};

export default i18n(CustomerForm) as FC<CustomerFormProps>;
