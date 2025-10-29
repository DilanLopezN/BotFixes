import { Component } from 'react';
import CreatableSelect from 'react-select/lib/Creatable';
import { CreatableSelectTagsProps } from './CreatableSelectTagsProps';

export class CreatableSelectTags extends Component<CreatableSelectTagsProps> {
    customStyles = {
        option: (provided) => ({
            ...provided,
        }),
        control: (p, state) => ({
            minHeight: '42px !important',
            background: '#fff !important',
            display: 'flex',
            borderRadius: '4px',
            fontSize: '16px',
            border: state.isFocused ? '1px solid rgba(3, 102, 214, 0.6)' : '1px solid #d9d9d9',
            boxShadow: '0 2px 15px 0 rgba(0,0,0,.07)',
            ':hover': {
                border: '1px solid rgba(3, 102, 214, 0.6)',
            },
        }),
        singleValue: (provided, state) => {
            const color = '#647384';
            return { ...provided, color };
        },
        placeholder: () => ({
            color: '#bebebe',
        }),
        menu: (provided) => {
            return {
                ...provided,
                'z-index': 999999,
            };
        },

        valueContainer: (provided) => ({
            ...provided,
            flexWrap: this.props.overflowValue ? 'nowrap' : 'wrap',
        }),
    };

    render() {
        return (
            <CreatableSelect
                isMulti
                options={this.props.options}
                isDisabled={this.props.isDisabled}
                styles={this.customStyles}
                isClearable
                onInputChange={this.props.onInputChange}
                inputValue={this.props.inputValue}
                menuPlacement={this.props.menuPlacement}
                hideSelectedOptions={!this.props.overflowValue}
                closeMenuOnSelect={false}
                classNamePrefix='react-select'
                placeholder={this.props.placeholder}
                onChange={this.props.onChange}
                onBlur={this.props.onBlur}
                value={this.props.value}
                onCreateOption={this.props.onCreateOption && this.props.onCreateOption}
                {...(this.props.formatCreateLabel && { formatCreateLabel: this.props.formatCreateLabel })}
            />
        );
    }
}
