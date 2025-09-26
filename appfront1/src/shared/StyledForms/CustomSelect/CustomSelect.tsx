import React, { Component } from "react";
import Select from 'react-select';

export class CustomSelect extends Component<any> {
    customStyles = {
        option: (provided) => ({
            ...provided,
        }),
        control: (p, state) => ({
            height: '42px !important',
            background: '#fff !important',
            display: 'flex',
            borderRadius: '4px',
            fontSize: '16px',
            border: state.isFocused ? '1px solid rgba(3, 102, 214, 0.6)' : '1px solid #d9d9d9',
            ':hover': {
                border: '1px solid rgba(3, 102, 214, 0.6)'
            }
        }),
        singleValue: (provided, state) => {
            const color = '#647384';
            return { ...provided, color };
        },
        placeholder: () => ({
            color: '#bebebe'
        })
    };

    render() {
        return <Select
            styles={this.customStyles}
            defaultValue={this.props.value}
            isClearable={!this.props.notClearable}
            placeholder={this.props.placeholder}
            isSearchable
            options={this.props.options}
            value={this.props.value}
            Blur={this.props.onBlur}
            onChange={this.props.onChange}
            isDisabled={this.props.disabled}
            menuPlacement="top"
        />
    }
}
