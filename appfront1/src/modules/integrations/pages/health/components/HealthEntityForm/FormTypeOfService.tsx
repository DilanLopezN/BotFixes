import { FormikProps } from 'formik';
import { FC } from 'react';
import { CustomSelect } from '../../../../../../shared/StyledForms/CustomSelect/CustomSelect';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

interface Item {
    label: string;
    value: any;
}

export enum TypeOfService {
    default = 'default',
    followUp = 'followUp',
    telemedicine = 'telemedicine',
    surgery = 'surgery',
    custom = 'custom',
    firstAppointment = 'firstAppointment'
}

interface FormTypeOfServiceProps extends FormikProps<any> {}

const FormTypeOfService: FC<FormTypeOfServiceProps & I18nProps> = ({
    getTranslation,
    touched,
    errors,
    submitCount,
    values,
    setFieldValue,
}) => {
    const typeOfServiceOptions = [
        { value: TypeOfService.default, label: 'Padrão' },
        { value: TypeOfService.followUp, label: 'Retorno' },
        { value: TypeOfService.telemedicine, label: 'Telemedicina' },
        { value: TypeOfService.surgery, label: 'Cirurgia' },
        { value: TypeOfService.custom, label: 'Customizado' },
        { value: TypeOfService.firstAppointment, label: 'Primeira Consulta' },
    ];

    const replaceToLabel = (key?: TypeOfService): Item => {
        const item = typeOfServiceOptions.find((item) => item.value === key);

        return {
            label: item?.label ?? '',
            value: item?.value ?? '',
        };
    };

    return (
        <div style={{ flex: 1 }}>
            <LabelWrapper
                label={getTranslation('Type of service')}
                validate={{
                    touched,
                    errors,
                    fieldName: 'params.referenceTypeOfService',
                    isSubmitted: submitCount > 0,
                }}
            >
                <CustomSelect
                    style={{
                        width: '100%',
                    }}
                    options={typeOfServiceOptions}
                    value={replaceToLabel(values.params?.referenceTypeOfService)}
                    placeholder={getTranslation('typeOfService')}
                    onChange={(item: Item) => setFieldValue('params.referenceTypeOfService', item.value)}
                />
            </LabelWrapper>
        </div>
    );
};

export default i18n(FormTypeOfService) as FC<FormTypeOfServiceProps>;
