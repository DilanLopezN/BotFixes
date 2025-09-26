import { Select } from 'antd';
import { FC, useState } from 'react';
import { HealthEntity } from '../../../../../../../../model/Integrations';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import i18n from '../../../../../../../i18n/components/i18n';
import { HealthEntityType } from 'kissbot-core';
import orderBy from 'lodash/orderBy';

const { Option, OptGroup } = Select;

interface EntitySelectorProps {
    entities: HealthEntity[];
    initialValue?: any;
    onChange: (value?: string | null) => void;
    maxTagCount?: number;
    selectAll?: boolean;
    value?: any;
}

const EntitySelector: FC<EntitySelectorProps & I18nProps> = ({
    entities,
    getTranslation,
    initialValue,
    onChange,
    maxTagCount,
    selectAll,
    value,
}) => {
    const [key, setKey] = useState<any>();

    const options = [
        <OptGroup label={getTranslation('Entities ativadas')}>
            {entities
                .filter(
                    (entity) =>
                        entity?.canView &&
                        (!!entity?.canSchedule || entity?.canSchedule === undefined) &&
                        entity?.activeErp !== false
                )
                .map((entity) => {
                    let name = entity.name;
                    if (entity.entityType === HealthEntityType.procedure) {
                        name = `${entity.specialityCode ? `${entity.specialityCode} - ` : ''}${entity.name}`;
                    }
                    return (
                        <Option value={entity._id} label={name} title={name} code={entity.code}>
                            {name}
                        </Option>
                    );
                })}
        </OptGroup>,
        <OptGroup label={getTranslation('Entidades desativadas')}>
            {orderBy(entities, 'name')
                .filter((entity) => (!entity.canView && entity.canSchedule === false) || entity.activeErp === false)
                .map((entity) => {
                    let name = entity.name;
                    if (entity.entityType === HealthEntityType.procedure) {
                        name = `${entity.specialityCode ? `${entity.specialityCode} - ` : ''}${entity.name}`;
                    }
                    return (
                        <Option value={entity._id} label={name} title={name} code={entity.code}>
                            {name}
                        </Option>
                    );
                })}
        </OptGroup>,
    ];

    const optionSelectAll = [
        <OptGroup label={'system'}>
            {entities.length && (
                <>
                    <Option label={getTranslation('Check all')} value={'all'}>
                        {getTranslation('Check all')}
                    </Option>
                    ,
                    <Option label={getTranslation('Invert selection')} value={'invert'}>
                        {getTranslation('Invert selection')}
                    </Option>
                </>
            )}
        </OptGroup>,
        ...options,
    ];

    return (
        <Select
            maxTagCount={maxTagCount}
            allowClear
            key={key}
            autoClearSearchValue={false}
            mode='multiple'
            style={{ width: '100%' }}
            placeholder={getTranslation('search by entity')}
            defaultValue={initialValue ?? undefined}
            {...value}
            filterOption={(search, option) => {
                const nameMatch = (option?.label as string)?.toLowerCase().trim().includes(search.toLowerCase().trim());
                const codeMatch = option?.code?.toLowerCase().trim().includes(search.toLowerCase().trim());
                return nameMatch || codeMatch;
            }}
            onChange={(entityIds: any) => {
                let values = entityIds;
                if (entityIds[entityIds.length - 1] === 'all') {
                    setKey(`${entityIds.length}`);
                    values = entities.filter((entity) => entity.activeErp !== false).map((entity) => entity._id);
                } else if (entityIds[entityIds.length - 1] === 'invert') {
                    // selecionar apenas as que estao desmarcadas
                    setKey(`${entityIds.length}`);
                    values = entities.filter((entity) => entity.activeErp !== false).map((entity) => entity._id);
                    values = values.filter((value) => !entityIds.includes(value));
                }

                onChange(values);
            }}
            optionLabelProp='label'
        >
            {selectAll ? optionSelectAll : options}
        </Select>
    );
};

export default i18n(EntitySelector) as FC<EntitySelectorProps>;
