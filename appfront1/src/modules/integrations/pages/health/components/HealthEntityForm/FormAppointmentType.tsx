import { Select } from 'antd';
import { FormikProps } from 'formik';
import { FC } from 'react';
import { useSelector } from 'react-redux';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { isAnySystemAdmin } from '../../../../../../utils/UserPermission';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

interface Item {
    label: string;
    value: any;
}

export enum ScheduleType {
    Exam = 'E',
    Consultation = 'C',
}

interface FormAppointmentTypeProps extends FormikProps<any> {}

const FormAppointmentType: FC<FormAppointmentTypeProps & I18nProps> = ({
    getTranslation,
    touched,
    errors,
    submitCount,
    values,
    setFieldValue,
}) => {
    const { loggedUser } = useSelector((state: any) => state.loginReducer);
    const systemAnyAdmin = isAnySystemAdmin(loggedUser);

    const appointmentTypeOptions = [
        { value: ScheduleType.Consultation, label: 'Consulta' },
        { value: ScheduleType.Exam, label: 'Exame' },
    ];

    const replaceToLabel = (key?: ScheduleType): Item => {
        const item = appointmentTypeOptions.find((item) => item.value === key);

        return {
            label: item?.label ?? '',
            value: item?.value ?? '',
        };
    };

    return (
        <div style={{ flex: 1 }}>
            <LabelWrapper
                label={getTranslation('Appointment types')}
                validate={{
                    touched,
                    errors,
                    fieldName: 'params.referenceScheduleType',
                    isSubmitted: submitCount > 0,
                }}
            >
                <Select
                    disabled={!systemAnyAdmin}
                    allowClear
                    size='large'
                    style={{
                        width: '100%',
                    }}
                    value={replaceToLabel(values.params?.referenceScheduleType).value}
                    placeholder={getTranslation('Appointment types')}
                    onChange={(value) => setFieldValue('params.referenceScheduleType', value)}
                >
                    {appointmentTypeOptions.map((option) => (
                        <Select.Option key={option.value} value={option.value}>
                            {option.label}
                        </Select.Option>
                    ))}
                </Select>
            </LabelWrapper>
        </div>
    );
};

export default i18n(FormAppointmentType) as FC<FormAppointmentTypeProps>;
