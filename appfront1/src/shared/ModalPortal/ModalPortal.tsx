import ReactDOM from 'react-dom';
import React, { Component } from "react";
import './ModalPortal.scss'
import { ModalPortalProps } from "./ModalPortalProps";
import ClickOutside from 'react-click-outside'

export class ModalPortal extends Component<ModalPortalProps>{
    modalRoot: HTMLElement;
    constructor(props) {
        super(props);

        const body = document.getElementsByTagName('body');
        this.modalRoot = document.createElement('div');

        try {
            body?.[0]?.appendChild(this.modalRoot);

        } catch (error) {
            // dispatchSentryError(error)
        }
    }

    componentDidMount() {
        if (!this.modalRoot) return;
        const body = document.getElementsByTagName('body');

        try {
            body?.[0]?.appendChild(this.modalRoot);

        } catch (error) {
            // dispatchSentryError(error)
        }
    }

    componentWillUnmount() {
        if (!this.modalRoot) return;
        const body = document.getElementsByTagName('body');

        try {
            body?.[0]?.removeChild(this.modalRoot);

        } catch (error) {
            // dispatchSentryError(error)
        }
    }

    render() {
        this.modalRoot.className = '';
        this.modalRoot?.classList.add('Modal', this.getOpenedClass(), this.props.className as string);

        return ReactDOM.createPortal(
            <ClickOutside
                className={'modal-content card no-padding ' + this.props.position} style={{
                    width: this.props.width,
                    height: this.props.height,
                    maxHeight: this.props.maxHeight,
                    maxWidth: this.props.maxWidth,
                    minWidth: this.props.minWidth,
                    minHeight: this.props.minHeight,
                    overflowY: this.props.overflowY || 'inital'
                } as any}
                onClickOutside={(ev) => this.props.onClickOutside?.(ev)}
            >
                {this.props.children}
            </ClickOutside>,
            this.modalRoot || null,
        );
    }

    getOpenedClass = () => {
        if (this.props.isOpened) {
            return 'opened';
        }
        return 'closed';
    }
}
