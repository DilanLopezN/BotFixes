import { FormikProps } from 'formik';
import { FC } from 'react';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { TextAreaSimple } from '../../../../../../shared/TextAreaSimple/TextAreaSimple';

interface FormDoctorDataProps extends FormikProps<any> {}

const FormDoctorData: FC<FormDoctorDataProps & I18nProps> = ({
    getTranslation,
    touched,
    errors,
    submitCount,
    values,
    setFieldValue,
}) => {
    return (
        <div style={{ flex: 1 }}>
            <LabelWrapper
                label={getTranslation('Observação')}
                validate={{
                    touched,
                    errors,
                    fieldName: 'data.observation',
                    isSubmitted: submitCount > 0,
                }}
            >
                <TextAreaSimple
                    value={values.data?.observation ?? ''}
                    style={{ height: 'auto' }}
                    rows={4}
                    placeholder={getTranslation(`observation`)}
                    onChange={(event) => {
                        setFieldValue(`data.observation`, event.target.value);
                    }}
                />
            </LabelWrapper>
        </div>
    );
};

export default i18n(FormDoctorData) as FC<FormDoctorDataProps>;
