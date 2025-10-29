import React, { Component } from "react";
import "./AttrNode.scss";
import { AttrNodeProps, AttrNodeState } from "./AttrNodeProps";
import { CreateAttributePopup } from "../CreateAttributePopup/CreateAttributePopup";
import { FormPopup } from "../../../FormPopup/FormPopup";
import { SelectAttributePopup } from "../SelectAttributePopup/SelectAttributePopup";
import ClickOutside from "../../../ClickOutside";

export class AttrNode extends Component<AttrNodeProps, AttrNodeState>{

    constructor(props: AttrNodeProps){
        super(props);
        this.state = {
            isOpenedPopover: false
        }
    }

    onChange = (text, data?) => {
        this.togglePopover();
        this.props.onChange(text, data);
    }

    getPopover = () => {
        if(this.props.type == "CREATE"){
            return <ClickOutside children={
                <CreateAttributePopup
                    data={this.props.data}
                    onChange={data => this.onChange(data.value, data)}
                />
            } onClickOutside={this.togglePopover} />
        }
        if(this.props.type == "SELECT"){
            return <ClickOutside children={
                <SelectAttributePopup
                    data={this.props.data.value}
                    onChange={this.onChange}
                />
            } onClickOutside={this.togglePopover} />
        }
        return "not implemented yet";
    }

    togglePopover = () => {
        this.setState({ isOpenedPopover: !this.state.isOpenedPopover});
    }

    render(){
        return <FormPopup
            isOpenedPopover={this.state.isOpenedPopover}
            popupBody={this.getPopover()}
            onClose={this.togglePopover}
        >
            <span className={`AttrNode pointer ${this.props.type === 'CREATE' ? 'space-text' : ''}`} onClick={this.togglePopover} key={1}>
                <span>
                    {this.props.nodeChildren}
                </span>
            </span>
        </FormPopup>
    }
}
