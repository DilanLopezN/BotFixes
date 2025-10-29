import { FormikProps } from 'formik';
import { HealthEntityType } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { HealthEntity } from '../../../../../../model/Integrations';
import { CustomSelect } from '../../../../../../shared/StyledForms/CustomSelect/CustomSelect';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../services/HealthService';
import FormDoctorData from './FormDoctorData';

interface FormSpecialityeProps extends FormikProps<any> {
    workspaceId: string;
    integrationId: string;
}

const FormSpeciality: FC<FormSpecialityeProps & I18nProps> = (props) => {
    const { getTranslation, touched, errors, submitCount, values, setFieldValue, workspaceId, integrationId } = props;
    const [specialities, setSpecialities] = useState<HealthEntity[]>([]);

    useEffect(() => {
        getSpecialitites();
    }, []);

    const getSpecialitites = async () => {
        const response = await HealthService.getAllHealthEntitiesByEntityType(
            workspaceId,
            integrationId,
            HealthEntityType.speciality
        );
        setSpecialities(response?.data ?? []);
    };

    const replaceToLabel = (value: string) => {
        const speciality = specialities.find((entity) => entity.code === value) || null;

        return !!speciality ? { label: speciality.name, value: speciality._id } : { label: '', value: '' };
    };

    return (
        <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
            <FormDoctorData {...props} />
            <LabelWrapper
                label={getTranslation('Speciality')}
                validate={{
                    touched,
                    errors,
                    fieldName: 'specialityType',
                    isSubmitted: submitCount > 0,
                }}
            >
                <CustomSelect
                    isDisabled={false}
                    options={specialities.map((entity) => ({ value: entity.code, label: entity.name }))}
                    value={replaceToLabel(values.specialityCode)}
                    placeholder={getTranslation('Speciality')}
                    onChange={(event: { label: string; value: string }) => {
                        const speciality = specialities.find((speciality) => speciality.code === event.value);
                        if (!!speciality) {
                            setFieldValue('specialityCode', speciality.code);
                            setFieldValue('specialityType', speciality.specialityType);
                            setFieldValue('parent', speciality);
                        }
                    }}
                />
            </LabelWrapper>
        </div>
    );
};

export default i18n(FormSpeciality) as FC<FormSpecialityeProps>;
