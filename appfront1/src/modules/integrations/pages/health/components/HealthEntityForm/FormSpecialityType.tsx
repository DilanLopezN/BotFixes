import { FormikProps } from 'formik'
import { FC } from 'react'
import { CustomSelect } from '../../../../../../shared/StyledForms/CustomSelect/CustomSelect'
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper'
import i18n from '../../../../../i18n/components/i18n'
import { I18nProps } from '../../../../../i18n/interface/i18n.interface'

interface FormSpecialityTypeProps extends FormikProps<any> { }

const FormSpecialityType: FC<FormSpecialityTypeProps & I18nProps> = ({
    getTranslation,
    touched,
    errors,
    submitCount,
    values,
    setFieldValue
}) => {

    const types = [
        {
            type: 'C',
            name: getTranslation('Appointment')
        },
        {
            type: 'E',
            name: getTranslation('Exam')
        },
    ];

    const replaceToLabel = (value: string) => {
        const specialityType = types.find(type => type.type === value) || null;

        return !!specialityType
            ? { label: specialityType.name, value: specialityType.type }
            : { label: '', value: '' }
    }

    return (
        <LabelWrapper
            label={getTranslation('Speciality Type')}
            validate={{
                touched, errors,
                fieldName: 'specialityType',
                isSubmitted: submitCount > 0
            }}
        >
            <CustomSelect
                isDisabled={false}
                options={types.map(type => ({ value: type.type, label: type.name }))}
                value={replaceToLabel(values.specialityType)}
                placeholder={getTranslation('Speciality Type')}
                onChange={(event: { label: string, value: string }) => {
                    setFieldValue('specialityType', event.value);
                }}
            />
        </LabelWrapper>
    )
}

export default i18n(FormSpecialityType) as FC<FormSpecialityTypeProps>;
