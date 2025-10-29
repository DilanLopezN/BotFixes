import React, { Component } from "react";
import "./LoaderTree.scss";
import { LoaderTreeProps } from "./LoaderTreeProps";
import "react-notifications-component/dist/theme.css";
import { RoundedBtn } from "../../../StyledForms/RoundedBtn/RoundedBtn";

export default class LoaderTree extends Component<LoaderTreeProps> {
    renderButtonElse = () => {
        return <div className="fallback-node-loader">
            <RoundedBtn btnClass="btn-rounded-loader" />
        </div>
    };

    renderButtonWelcome = () => {
        return <div className="fallback-node-loader">
            <RoundedBtn btnClass="btn-rounded-loader" />
        </div>
    };

    renderNode = () => {
        return <div className="btn-rounded node-loader">
            <span className="loading">...</span></div>
    };

    returnInteractionLoader = () => {
        return <div className="container-interaction-loader">
            {this.renderNode()}
        </div>
    };

    returnTwoInteractionLoader = () => {
        return <div className="container-interaction-loader">
            {this.renderNode()}
            <div className="container-interaction-loader">
                <span className="returnTwoInteractionLoader" />
                {this.renderNode()}
            </div>
        </div>
    };

    render() {
        return <div className="LoaderTree">
            <div className="start-loader">
                {this.renderButtonWelcome()}
            </div>
            {this.returnTwoInteractionLoader()}
            {this.returnTwoInteractionLoader()}
            {this.returnInteractionLoader()}
            <div className="else-loader">
                {this.renderButtonElse()}
            </div>
        </div>
    }
}

