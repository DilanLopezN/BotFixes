import React, { Component } from "react";
import './ButtonSelect.scss'
import { ButtonSelectProps } from "./ButtonSelectProps";

export default class ButtonSelect extends Component<ButtonSelectProps> {
    getValue = (opt: { label: string | boolean, value?: string | boolean }) => {
        return opt.value || opt.label;
    };

    render() {
        return <div className="ButtonSelect d-flex align-items-center">
            <div className="btn-group btn-group-toggle" data-toggle="buttons">
                {this.props.options.map((opt, index) => {
                    const value = this.getValue(opt);
                    const classActive = value == this.props.value ? "active-item" : null;
                    return <label className={"btn btn-primary btn-sm " + classActive} key={index} onClick={() => this.props.onChange(opt.value || opt.label)}>
                        {typeof opt.label === 'boolean'
                            ? opt.label === true ? 'true' : 'false'
                            : opt.label
                        }
                    </label>
                })}
            </div>
        </div>
    }
}