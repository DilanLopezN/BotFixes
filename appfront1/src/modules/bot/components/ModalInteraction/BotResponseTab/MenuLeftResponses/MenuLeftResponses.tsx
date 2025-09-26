import React, { Component } from "react";
import './MenuLeftResponses.scss'
import { AddResponseButton } from "../AddResponseButton/AddResponseButton";
import { Provider } from "../../../../../../model/Provider";
import { v4 } from 'uuid';
import { MenuLeftResponsesProps, MenuLeftResponsesState } from "./MenuLeftResponsesProps";
import { connect } from "react-redux";
import I18n from '../../../../../i18n/components/i18n';

class MenuLeftResponsesClass extends Component<MenuLeftResponsesProps, MenuLeftResponsesState> {
    menuLeft: Provider[] = [ ];

    constructor(props) {
        super(props);

        if (this.props.settings
            && this.props.settings.responses) {
            this.menuLeft.push(...this.props.settings.responses);
        }
        this.state = {
            selectedProvider: this.menuLeft[0],
        }
    }

    setSelectedTab = (menuItem: Provider) => {
        this.setState({  selectedProvider: menuItem });
    }

    renderIcon = (menuItem: Provider) => {
        if (menuItem.icon) {
            return <i className={menuItem.icon} />
        }
        if (menuItem.img) {
            return <img alt='ícone' src={menuItem.img} className="img-icon" />
        }
        return <i className='mdi mdi-36px mdi-image-broken-variant' />
    }

    renderTabs = () => {
        return <div className="tabs">
            {
                this.menuLeft.map(menuItem => {
                    const selectedClass = this.state.selectedProvider.icon == menuItem.icon ? "selected" : "";
                    return <div className={"menu-integration pointer " + selectedClass} key={v4()} onClick={() => this.setSelectedTab(menuItem)}>
                        {this.renderIcon(menuItem)}
                    </div>
                })
            }
        </div>
    }

    renderTabContent = () => {
        const { getTranslation }= this.props
        return <div className="tab-content">
            {
                this.state.selectedProvider.options.map(option => {
                    return <div className="tab-option" key={v4()}>
                        <p className="tab-option--title">{getTranslation(option.name)}</p>
                        <div className="tab-option--row no-margin row">
                            {option.responses.map((providerResponse) => (
                                <div className="col-6 no-padding" key={v4()}>
                                    <AddResponseButton onChangeLanguage={this.props.onChangeLanguage} providerResponse={providerResponse} />
                                </div>
                            ))}
                        </div>
                    </div>
                })
            }
        </div>
    }

    render() {
        return <div className="menu-left-main">
            {this.renderTabs()}
            {this.renderTabContent()}
        </div>
    }
}



const mapStateToProps = (state: any, ownProps: any) => ({
    settings: state.loginReducer.settings,
})

export const MenuLeftResponses = I18n(connect(
    mapStateToProps,
    {}
)(MenuLeftResponsesClass))
