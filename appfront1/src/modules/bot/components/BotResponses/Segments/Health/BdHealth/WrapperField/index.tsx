import { BotAttrs } from '../../../../../../../../shared/StyledForms/BotAttrs/BotAttrs';
import { LabelWrapper } from '../../../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';

export const WrapperFieldAttr = ({
    values,
    setFieldTouched,
    setFieldValue,
    submit,
    submitted,
    touched,
    errors,
    fieldDescription,
    fieldName,
    fieldTitle,
}) => {
    return (
        <LabelWrapper
            label={fieldTitle}
            validate={{
                touched,
                errors,
                fieldName,
                isSubmitted: submitted,
            }}
            tooltip={fieldDescription}
        >
            <BotAttrs
                value={{
                    value: values[fieldName] ? values[fieldName] : '',
                    label: values[fieldName] ? values[fieldName] : '',
                }}
                onCreateOption={(event) => {
                    setFieldTouched(fieldName);
                    values[fieldName] = event;
                    setFieldValue(fieldName, event);
                    submit();
                }}
                onChange={(event) => {
                    setFieldTouched(fieldName);
                    values[fieldName] = event.value;
                    setFieldValue(fieldName, event.value);
                    submit();
                }}
                showOnly={['entity', 'others']}
                creatable
            />
        </LabelWrapper>
    );
};
