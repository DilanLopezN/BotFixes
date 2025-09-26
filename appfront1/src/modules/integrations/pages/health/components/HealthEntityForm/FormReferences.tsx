import { FormikProps } from 'formik';
import { HealthEntityType } from 'kissbot-core';
import uniqBy from 'lodash/uniqBy';
import { FC, useEffect, useState } from 'react';
import { HealthEntity, IEntityReference } from '../../../../../../model/Integrations';
import { CreatableSelectTags } from '../../../../../../shared/StyledForms/CreatableSelectTags/CreatableSelectTags';
import { LabelWrapper } from '../../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { HealthService } from '../../../../services/HealthService';

interface FormReferencesProps extends FormikProps<any> {
    workspaceId: string;
    integrationId: string;
    reference: HealthEntityType;
}

const FormReferences: FC<FormReferencesProps & I18nProps> = ({
    getTranslation,
    touched,
    errors,
    submitCount,
    values,
    setFieldValue,
    workspaceId,
    integrationId,
    reference,
}) => {
    const [entities, setEntities] = useState<HealthEntity[]>([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        getEntities();
    }, []);

    const getEntities = async () => {
        const response = await HealthService.getAllHealthEntitiesByEntityType(workspaceId, integrationId, reference);
        setEntities(response?.data ?? []);
    };

    const getLabel = (entity: HealthEntity) => {
        if (reference === HealthEntityType.procedure) {
            return `${entity.specialityCode} - ${entity.friendlyName}`;
        }

        return entity.friendlyName;
    };

    const replaceToLabel = (references: IEntityReference[]) => {
        if (!references?.length || !entities?.length) {
            return [];
        }

        return (
            references
                ?.filter((ref) => ref.type === reference)
                .map((ref) => {
                    const entity = entities.find((e) => e._id === ref.refId);

                    if (!entity) {
                        return { label: '', value: '' };
                    }

                    return { label: getLabel(entity), value: entity?._id };
                }) ?? []
        ).filter((item) => item.label && item.value);
    };

    const options = entities.map((entity) => ({
        value: entity._id,
        label: getLabel(entity),
    }));

    if (!entities?.length) {
        return null;
    }

    return (
        <LabelWrapper
            label={getTranslation(reference)}
            validate={{
                touched,
                errors,
                fieldName: 'references',
                isSubmitted: submitCount > 0,
            }}
        >
            <CreatableSelectTags
                isDisabled={false}
                options={options}
                menuPlacement='top'
                placeholder=''
                onCreateOption={() => {}}
                inputValue={inputValue}
                onInputChange={(value, actionMeta) => {
                    if (actionMeta.action === 'set-value') return;
                    setInputValue(value);
                }}
                value={replaceToLabel(values.references)}
                onChange={(event: any[]) => {
                    const references = values.references || [];
                    if (!event.length) {
                        const newReferences = references.filter((ref) => ref.type !== reference);
                        return setFieldValue('references', newReferences);
                    }
                    event = event.filter((ev) => ev.value !== undefined);

                    let referencesType = references.filter((el) => el.type === reference);

                    if (referencesType.length > event.length) {
                        const newReferencesType = referencesType.filter(
                            (el) => el.refId === event.find((ev) => ev.value === el.refId)?.value
                        );
                        setFieldValue('references', [
                            ...references.filter((el) => el.type !== reference),
                            ...newReferencesType,
                        ]);
                    } else {
                        setFieldValue('references', [
                            ...uniqBy(
                                [
                                    ...(values.references ?? []),
                                    ...event.map((e) => ({ type: reference, refId: e.value })),
                                ],
                                'refId'
                            ),
                        ]);
                    }
                }}
            />
        </LabelWrapper>
    );
};

export default i18n(FormReferences) as FC<FormReferencesProps>;
