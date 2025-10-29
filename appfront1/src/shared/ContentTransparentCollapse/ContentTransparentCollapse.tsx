import React, { Component } from "react";
import "./ContentTransparentCollapse.scss";
import { ContentTransparentCollapseProps, ContentTransparentCollapseState } from "./ContentTransparentCollapseProps";
export class ContentTransparentCollapse extends Component<ContentTransparentCollapseProps, ContentTransparentCollapseState>{
    state: ContentTransparentCollapseState = {
        opened: false
    }

    getClosedClass = () => !this.state.opened ? "closed" : "";

    toggleOpened = () => this.setState({ opened: !this.state.opened});

    render(){
        return <div className={`ContentTransparentCollapse ${this.getClosedClass()}`}>
            <div className={`collpase-content ${this.props.className}`}>
                {this.props.children}
            </div>
            <div className="collpase-gradient pointer" onClick={this.toggleOpened}></div>
            <div className="open-closed-trigger pointer" onClick={this.toggleOpened}>
                <span className="pointer mdi mdi-24px  mdi-chevron-up"/>
            </div>
        </div>
    }
}
