import { AppointmentSortTypes } from 'kissbot-core';
import React, { FC } from 'react';
import { CustomSelect } from '../../../../../../../../shared/StyledForms/CustomSelect/CustomSelect';
import i18n from '../../../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';

interface Item {
    label: string;
    value: any;
}

export interface SortTypeProps {
    value?: AppointmentSortTypes;
    onChange: (item: Item) => void;
}

type SortLabels = { [key in keyof typeof AppointmentSortTypes]: { label: string } };

const SortType: FC<SortTypeProps & I18nProps> = ({ getTranslation, value, onChange }) => {
    const sortType: SortLabels = {
        [AppointmentSortTypes.default]: {
            label: getTranslation('Random'),
        },
        [AppointmentSortTypes.firstEachDoctorBalanced]: {
            label: getTranslation('firstEachDoctorBalanced'),
        },
        [AppointmentSortTypes.firstEachPeriodDay]: {
            label: getTranslation('firstEachPeriodDay'),
        },
        [AppointmentSortTypes.firstEachHourDay]: {
            label: getTranslation('firstEachHourDay'),
        },
        [AppointmentSortTypes.firstEachAnyPeriodDay]: {
            label: getTranslation('firstEachAnyPeriodDay'),
        },
        [AppointmentSortTypes.sequential]: {
            label: getTranslation('Sequential'),
        },
        [AppointmentSortTypes.combineDatePeriodByOrganization]: {
            label: getTranslation('combineDatePeriodByOrganization'),
        },
    };

    const getOptions = (): Item[] => {
        return Object.keys(sortType).map((key) => ({
            label: sortType[key].label,
            value: key,
        }));
    };

    const replaceToLabel = (key?: AppointmentSortTypes): Item => {
        let selected = key ? sortType[key] : sortType[AppointmentSortTypes.default];

        return {
            label: selected.label,
            value: key || AppointmentSortTypes.default,
        };
    };

    const options = getOptions();
    const replacedLabel = replaceToLabel(value);

    return (
        <CustomSelect
            style={{
                width: '100%',
            }}
            options={options}
            value={replacedLabel}
            placeholder={getTranslation('Sort type')}
            onChange={(item: Item) => onChange(item)}
        />
    );
};

export default i18n(SortType) as FC<SortTypeProps>;
