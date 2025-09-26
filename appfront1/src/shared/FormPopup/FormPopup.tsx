import { Component } from "react";
import Popover from 'react-popover';
import "./FormPopup.scss"
import { FormPopupProps, FormPopupState } from "./FormPopupProps";

export class FormPopup extends Component<FormPopupProps, FormPopupState>{
    render() {
        const { preferPlace } = this.props;

        return <Popover
            isOpen={this.props.isOpenedPopover}
            body={
                // <ClickOutside onClickOutside={(event) => {
                //     if ((" " + event.target.className + " ").replace(/[\n\t]/g, " ").indexOf(this.props.trigger as string) > -1) return null
                //     this.props.onClose()
                // }} className="FormPopupBody">
                <div className="FormPopupBody">
                    <div className="close-popup">
                        <span className="mdi mdi-close pointer" onClick={this.props.onClose} />
                    </div>
                    <div className="popup-body">
                        {this.props.popupBody}
                    </div>
                </div>
                // </ClickOutside>
            }
            preferPlace={preferPlace ? preferPlace : 'below'}
            children={this.props.children}
        />
    }
}
