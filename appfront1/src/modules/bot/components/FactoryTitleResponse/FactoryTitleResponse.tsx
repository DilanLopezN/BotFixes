import React, { Component } from "react";
import "./FactoryTitleResponse.scss";
import { FactoryTitleResponseProps } from "./FactoryTitleResponseProps";
import { connect } from "react-redux";
import I18n from "../../../i18n/components/i18n";

class FactoryTitleResponseClass extends Component<FactoryTitleResponseProps>{
    firstCapitalLetter = (context) => {
        const text = context.replace(/-/g, " ");
        const words = text.toLowerCase().split(" ");
        for (let a = 0; a < words.length; a++) {
            const w = words[a];
            words[a] = w[0].toUpperCase() + w.slice(1);
        }
        return words.join(" ");
    };

    getTranslatedResponse = (responseType: string) => {
        const { settings } = this.props;

        if (settings
            && settings.responses
            && settings.responses.length > 0) {

            const items = [] as any;
            settings.responses.map(e =>
                e.options.map(e =>
                    e.responses.map(e =>
                        items.push(e),
                    ),
                ),
            );

            const finded = items.find(e => e.type === responseType);

            if (finded)
                return this.props.getTranslation(finded.title);

            return this.firstCapitalLetter(responseType);
        }

        return this.firstCapitalLetter(responseType);
    }

    render() {
        return <div className="FactoryTitleResponse">
            <span>{this.getTranslatedResponse(this.props.response.type)}</span>
        </div>;
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    settings: state.loginReducer.settings,
});

export const FactoryTitleResponse = I18n(connect(
    mapStateToProps, {}
)(FactoryTitleResponseClass));