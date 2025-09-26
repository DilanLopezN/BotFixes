import React, {Component} from "react";
import './ItemNotFound.scss';
import {ItemNotFoundProps} from "./ItemNotFoundProps";

export class ItemNotFound extends Component<ItemNotFoundProps> {
    render() {
        return <div className="error-template ItemNotFound">
            <div className="error-container-error">
                <h2>Oops! <span className="mdi mdi-alert"/></h2>
                <h5>{this.props.label}</h5>
            </div>
            <div className="error-details">
                <p>{this.props.message}</p>
            </div>
            <div className="error-actions">
            </div>
        </div>
    }
}
