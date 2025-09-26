import isEmpty from 'lodash/isEmpty';
import orderBy from 'lodash/orderBy';
import { Component } from 'react';
import Select from 'react-select';
import { v4 } from 'uuid';
import { InteractionSelectProps } from './InteractionSelectProps';

export class InteractionSelect extends Component<InteractionSelectProps> {
    isInvalidReference() {
        const { name: fieldName, defaultValue, options } = this.props;

        if (!fieldName || !defaultValue) return false;

        if (fieldName !== 'isErrorGoto' && fieldName !== 'selectedInteraction') {
            return false;
        }

        if (!options?.length) return false;

        return !options.some((option) => option._id === defaultValue);
    }

    customStyles = {
        option: (provided) => ({
            ...provided,
        }),

        control: (provided, state) => {
            const invalid = this.isInvalidReference();
            return {
                ...provided,
                height: '42px !important',
                background: '#fff !important',
                display: 'flex',
                borderRadius: '4px',
                fontSize: '16px',
                border: invalid
                    ? '1px solid #ff4d4f'
                    : state.isFocused
                    ? '1px solid rgba(3, 102, 214, 0.6)'
                    : '1px solid #d9d9d9',
                boxShadow: invalid ? '0 0 0 2px rgba(255, 77, 79, 0.2)' : '0 2px 15px 0 rgba(0,0,0,.07)',
                ':hover': {
                    border: invalid ? '1px solid #ff4d4f' : '1px solid rgba(3, 102, 214, 0.6)',
                },
            };
        },

        singleValue: (provided) => ({
            ...provided,
            color: '#647384',
        }),

        placeholder: (provided) => ({
            ...provided,
            color: '#e6e6e6',
        }),
    };

    handleOptions = () => {
        const { interactionTypeToShow, options } = this.props;
        const filtered = (options ?? []).filter((interaction) => interactionTypeToShow?.includes(interaction.type));
        const sorted = orderBy(filtered, ['type', 'name'], ['desc', 'asc']);
        return sorted.map((interaction) => ({
            label: interaction.name || interaction.type || interaction._id,
            value: interaction._id,
        }));
    };

    handleDefaultValue = () => {
        const { defaultValue, options } = this.props;
        const emptyOption = { label: '', value: '' };

        if (!defaultValue) return emptyOption;

        const found = options?.find((interaction) => interaction._id === defaultValue);
        return found ? { label: found.name, value: found._id } : { label: defaultValue, value: defaultValue };
    };

    render() {
        const defaultOption = this.handleDefaultValue();

        return (
            <Select
                menuPlacement={this.props.placement || 'bottom'}
                inputId={v4()}
                styles={this.customStyles}
                defaultValue={defaultOption}
                value={defaultOption}
                isClearable
                placeholder={this.props.placeholder}
                isSearchable
                options={this.handleOptions()}
                onBlur={this.props.onBlur}
                onChange={(ev) => {
                    if (isEmpty(ev)) {
                        return this.props.onChange({ value: '' });
                    }
                    return this.props.onChange(ev);
                }}
                name={this.props.name}
            />
        );
    }
}
