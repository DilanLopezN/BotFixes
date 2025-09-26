import React, { Component } from "react";
import CreatableSelect from 'react-select/lib/Creatable';
import { CustomCreatableSelectProps } from "./CustomCreatableSelectProps";

export class CustomCreatableSelect extends Component<CustomCreatableSelectProps> {
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
            boxShadow: "0 2px 15px 0 rgba(0,0,0,.07)",
            ':hover': {
                border: '1px solid rgba(3, 102, 214, 0.6)'
            }
        }),
        singleValue: (provided, state) => {
            const color = '#647384';
            return { ...provided, color };
        },
        menuPortal: base => ({ ...base, zIndex: 9999 })
    };

    render() {
        return <CreatableSelect
            styles={this.customStyles}
            menuPortalTarget={document.body}
            isClearable
            options={this.props.options}
            value={this.props.value}
            placeholder={this.props.placeholder}
            onCreateOption={this.props.onCreateOption}
            onChange={this.props.onChange}
            onBlur={this.props.onBlur}
        />
    }
}
