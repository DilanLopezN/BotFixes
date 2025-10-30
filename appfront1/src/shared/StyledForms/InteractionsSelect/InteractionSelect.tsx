import isEmpty from 'lodash/isEmpty';
import orderBy from 'lodash/orderBy';
import { Component } from 'react';
import { Select } from 'antd';
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

        const placement = (this.props.placement || 'bottom') === 'top' ? 'topLeft' : 'bottomLeft';

        return (
            <Select
                size='large'
                style={{ width: '100%' }}
                placeholder={this.props.placeholder}
                options={this.handleOptions()}
                value={defaultOption as any}
                labelInValue
                allowClear
                showSearch
                onBlur={this.props.onBlur}
                onChange={(ev) => {
                    if (isEmpty(ev)) {
                        return this.props.onChange({ value: '' });
                    }
                    return this.props.onChange(ev);
                }}
                placement={placement as any}
                status={this.isInvalidReference() ? 'error' : undefined}
                filterOption={(input, option) =>
                    (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
                }
                id={v4()}
            />
        );
    }
}
