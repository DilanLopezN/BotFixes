import { Checkbox } from 'antd';
import { FormikProps } from 'formik';
import { FC } from 'react';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

interface FormOccupationAreaParamsProps extends FormikProps<any> {}

const FormOccupationAreaParams: FC<FormOccupationAreaParamsProps & I18nProps> = ({
    getTranslation,
    touched,
    errors,
    submitCount,
    values,
    setFieldValue,
}) => {
    return (
        <div style={{ flex: 1 }}>
            <div style={{ display: 'flex' }}>
                <LabelWrapper
                    label={getTranslation('hasRelationshipWithDoctors')}
                    validate={{
                        touched,
                        errors,
                        fieldName: 'params.hasRelationshipWithDoctors',
                        isSubmitted: submitCount > 0,
                    }}
                >
                    <Checkbox
                        checked={values?.params?.hasRelationshipWithDoctors}
                        onChange={(ev) => {
                            setFieldValue('params.hasRelationshipWithDoctors', ev.target.checked);
                        }}
                    />
                </LabelWrapper>
            </div>
        </div>
    );
};

export default i18n(FormOccupationAreaParams) as FC<FormOccupationAreaParamsProps>;
