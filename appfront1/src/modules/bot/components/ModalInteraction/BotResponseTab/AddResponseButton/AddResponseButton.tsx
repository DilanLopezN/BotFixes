import React, { Component } from 'react';
import './AddResponseButton.scss';
import { AddResponseButtonProps } from './AddResponseButtonProps';
import { IResponse, Language } from '../../../../../../model/Interaction';
import { connect } from 'react-redux';
import { EmptyResponseFactory } from '../../../../../../model/EmptyResponseFactory';
import I18n from '../../../../../i18n/components/i18n';
import { dispatchSentryError } from '../../../../../../utils/Sentry';
import { fixedResponses } from '../../../../../../model/ResponseElement';

class AddResponseButtonClass extends Component<AddResponseButtonProps> {
    onChangeResponse = (response: IResponse, top?: boolean) => {
        let languages: Array<Language> = this.props.currentInteraction.languages;
        languages = languages.map((language) => {
            if (language.language === this.props.selectedLanguage) {
                language.responses = language.responses || [];
                if (top) {
                    const countFixedResponse = language.responses?.filter((currResponse) =>
                        fixedResponses.includes(currResponse.type)
                    ).length;
                    if (countFixedResponse > 0) {
                        language.responses.splice(countFixedResponse, 0, response);
                    } else {
                        language.responses.unshift(response);
                    }
                } else {
                    language.responses.push(response);
                }
            }
            return language;
        });
        this.props.onChangeLanguage(languages);
    };

    onClick = (top?: boolean) => {
        try {
            const response: IResponse = EmptyResponseFactory.createResponse(this.props.providerResponse.type);
            if (top) {
                this.onChangeResponse(response, top);
                this.onScroll(top);
            } else {
                this.onChangeResponse(response);
                this.onScroll();
            }
        } catch (err) {
            console.log(err)
            dispatchSentryError(err);
        }
    };

    onScroll = (top?: boolean) => {
        let valueScroll = 0;
        let incrementScroll = 20;

        this.props.currentInteraction.languages.map((language: Language) => {
            if (language.language === this.props.selectedLanguage) {
                if (language.responses) {
                    const { length } = language.responses;
                    valueScroll = 1000 * length;
                    incrementScroll = incrementScroll * length;
                }
            }
            return language;
        });
        let scroll = document.querySelector('#modal-interaction-content');
        if (!scroll) return null;
        let valueInitialScroll = scroll.scrollTop;
        const myInterval = setInterval(() => {
            if (scroll && scroll.scrollTo) scroll.scrollTo(0, top ? 0 : valueInitialScroll);
            if (valueInitialScroll >= valueScroll) {
                clearInterval(myInterval);
            }
            valueInitialScroll += incrementScroll;
        }, 20);
    };
    render() {
        const { icon, title, name } = this.props.providerResponse;

        const content = (
            <div className='selectResponsePosition'>
                <div>
                    <div
                        title='Adicionar no inicio da interaction'
                        className='mdi mdi-arrow-up'
                        onClick={(event) => {
                            event.stopPropagation();
                            this.onClick(true);
                        }}
                    />
                </div>
                <div>
                    <div
                        title='Adicionar no fim da interaction'
                        className='mdi mdi-arrow-down'
                        onClick={(event) => {
                            event.stopPropagation();
                            this.onClick();
                        }}
                    />
                </div>
            </div>
        );

        return (
            <div
                className='AddResponseButton pointer'
                title={title}
                onClick={(event) => {
                    event.stopPropagation();
                    this.onClick();
                }}
            >
                <div className='icon-response'>
                    {content}
                    <span className={icon} />
                </div>
                <span className='name-response'>{this.props.getTranslation(name)}</span>
            </div>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
    selectedLanguage: state.botReducer.selectedLanguage,
});
export const AddResponseButton = I18n(connect(mapStateToProps, {})(AddResponseButtonClass));
