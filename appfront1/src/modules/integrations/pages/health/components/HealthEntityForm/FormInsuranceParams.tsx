import { Checkbox } from 'antd';
import { FormikProps } from 'formik';
import { FC } from 'react';
import { CustomSelect } from '../../../../../../shared/StyledForms/CustomSelect/CustomSelect';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

interface Item {
    label: string;
    value: any;
}

export enum ExternalInsurances {
    intermedica = 'intermedica',
    amil = 'amil',
}

interface FormInsuranceParamsProps extends FormikProps<any> {}

const FormInsuranceParams: FC<FormInsuranceParamsProps & I18nProps> = ({
    getTranslation,
    touched,
    errors,
    submitCount,
    values,
    setFieldValue,
}) => {
    const insuranceTypeOptions = [
        { value: ExternalInsurances.amil, label: 'Amil' },
        { value: ExternalInsurances.intermedica, label: 'Intermédica' },
    ];

    const replaceToLabel = (key?: ExternalInsurances): Item => {
        const item = insuranceTypeOptions.find((item) => item.value === key);

        return {
            label: item?.label ?? '',
            value: item?.value ?? '',
        };
    };

    return (
        <div style={{ flex: 1 }}>
            <LabelWrapper
                label={getTranslation('Interconsultation period')}
                validate={{
                    touched,
                    errors,
                    fieldName: 'params.interAppointmentPeriod',
                    isSubmitted: submitCount > 0,
                }}
            >
                <StyledFormikField
                    name='params.interAppointmentPeriod'
                    placeholder={getTranslation('Interconsultation')}
                    type='number'
                    defaultValue={30}
                />
            </LabelWrapper>
            <LabelWrapper
                label={getTranslation('Insurance')}
                validate={{
                    touched,
                    errors,
                    fieldName: 'params.referenceInsuranceType',
                    isSubmitted: submitCount > 0,
                }}
            >
                <CustomSelect
                    style={{
                        width: '100%',
                    }}
                    options={insuranceTypeOptions}
                    value={replaceToLabel(values.params?.referenceInsuranceType)}
                    placeholder={getTranslation('Sort type')}
                    onChange={(item: Item) => setFieldValue('params.referenceInsuranceType', item.value)}
                />
            </LabelWrapper>
            <div style={{ display: 'flex' }}>
                <LabelWrapper
                    label={getTranslation('Show appointment value')}
                    validate={{
                        touched,
                        errors,
                        fieldName: 'params.showAppointmentValue',
                        isSubmitted: submitCount > 0,
                    }}
                >
                    <Checkbox
                        checked={values?.params?.showAppointmentValue || false}
                        onChange={(ev) => {
                            setFieldValue('params.showAppointmentValue', ev.target.checked);
                        }}
                    />
                </LabelWrapper>
                <LabelWrapper
                    label={getTranslation('Particular')}
                    validate={{
                        touched,
                        errors,
                        fieldName: 'params.isParticular',
                        isSubmitted: submitCount > 0,
                    }}
                >
                    <Checkbox
                        checked={values?.params?.isParticular || false}
                        onChange={(ev) => {
                            setFieldValue('params.isParticular', ev.target.checked);
                        }}
                    />
                </LabelWrapper>
                <LabelWrapper
                    label={getTranslation('Incluir convênio na etapa de sugestão')}
                    validate={{
                        touched,
                        errors,
                        fieldName: 'params.includeInSuggestionsList',
                        isSubmitted: submitCount > 0,
                    }}
                >
                    <Checkbox
                        checked={values?.params?.includeInSuggestionsList || false}
                        onChange={(ev) => {
                            setFieldValue('params.includeInSuggestionsList', ev.target.checked);
                        }}
                    />
                </LabelWrapper>
                
            </div>
        </div>
    );
};

export default i18n(FormInsuranceParams) as FC<FormInsuranceParamsProps>;
