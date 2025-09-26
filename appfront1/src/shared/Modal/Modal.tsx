import React, { Component } from "react";
import ClickOutside from "../ClickOutside";
import './Modal.scss'
import { ModalProps } from "./ModalProps";

export class Modal extends Component<ModalProps>{
    getOpenedClass = () => {
        if (this.props.isOpened) {
            return "opened"
        }
        return "closed";
    }
    render() {
        return <div className={"Modal " + this.getOpenedClass() + ' ' + this.props.className}>
            <ClickOutside
                className={"modal-content card no-padding " + this.props.position} style={{
                    ...this.props.style,
                    width: this.props.width,
                    height: this.props.height,
                    overflowY: this.props.overflowY || 'inital'
                } as any}
                onClickOutside={(ev: any) => this.props.onClickOutside && this.props.onClickOutside(ev)}
            >
                {this.props.children}
            </ClickOutside>
        </div>
    }
}