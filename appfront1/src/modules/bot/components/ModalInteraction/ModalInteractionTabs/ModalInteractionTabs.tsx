import { Component } from 'react';
import './ModalInteractionTabs.scss';
import { ModalInteractionTabsProps, ModalInteractionTabsState } from './ModalInteractionTabsProps';
import { connect } from 'react-redux';
import { Interaction, InteractionType } from '../../../../../model/Interaction';
import I18n from '../../../../i18n/components/i18n';
import moment from 'moment';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';
import { interactionSelector } from '../../../../../utils/InteractionSelector';

export enum TABS {
    USER_SAYS = 'USER_SAYS',
    BOT_RESPONSES = 'BOT_RESPONSES',
    ADVANCED = 'ADVANCED',
    LABELS = 'LABELS',
    COMMENTS = 'COMMENTS',
}

class ModalInteractionTabsClass extends Component<ModalInteractionTabsProps, ModalInteractionTabsState> {
    languages: string[];
    constructor(props: ModalInteractionTabsProps) {
        super(props);
        this.state = {
            selectedTab: this.props.preview ? TABS.USER_SAYS : TABS.BOT_RESPONSES,
        };
        this.languages = ['pt-BR', 'en', 'es'];
        this.props.onSelectTab(this.state.selectedTab);
    }

    onSelectTab = (tab: TABS) => {
        this.setState({ selectedTab: tab });
        this.props.onSelectTab(tab);
    };

    getSelectedClass = (tab: TABS) => {
        if (tab == this.props.tab) {
            return 'selected-tab';
        }
        return null;
    };

    setLanguage = ($event: any) => {
        // Para isso quando muda a language é necessário um forceUpdate;
        this.props.onSelectLanguage($event.target.value);
        this.onSelectTab(TABS.BOT_RESPONSES);
    };

    isFallBack = () => {
        return (
            this.props.currentInteraction &&
            (this.props.currentInteraction.type === InteractionType.fallback ||
                this.props.currentInteraction.type === InteractionType.contextFallback)
        );
    };

    renderUserSays = () => {
        if (this.isFallBack()) return null;
        return (
            <div
                className={'tab-item no-padding ' + this.getSelectedClass(TABS.USER_SAYS)}
                onClick={() => this.onSelectTab(TABS.USER_SAYS)}
            >
                {this.props.getTranslation('User says')}
            </div>
        );
    };

    renderBotResponse = () => {
        return (
            <div
                className={'tab-item no-padding ' + this.getSelectedClass(TABS.BOT_RESPONSES)}
                onClick={() => this.onSelectTab(TABS.BOT_RESPONSES)}
            >
                {this.props.getTranslation('Bot responses')}
            </div>
        );
    };

    renderAdvanced = () => {
        if (this.isFallBack()) return null;
        return (
            <div
                className={'tab-item no-padding ' + this.getSelectedClass(TABS.ADVANCED)}
                onClick={() => this.onSelectTab(TABS.ADVANCED)}
            >
                {this.props.getTranslation('Advanced')}
            </div>
        );
    };

    renderLabels = () => {
        return (
            <div
                className={'tab-item no-padding ' + this.getSelectedClass(TABS.LABELS)}
                onClick={() => this.onSelectTab(TABS.LABELS)}
            >
                {this.props.getTranslation('Labels')}
            </div>
        );
    };

    renderCommentsBlock = (interaction: Interaction) => {
        return (
            interaction.comments &&
            interaction.comments.length > 0 && (
                <div
                    style={{
                        fontSize: '10px',
                        background: '#007bff',
                        color: '#fff',
                        borderRadius: '50%',
                        height: '16px',
                        width: '16px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        margin: '-3px 0 0 1px',
                        fontWeight: 'bold',
                    }}
                >
                    {interaction.comments.length}
                </div>
            )
        );
    };

    renderComments = (disabledFields, unchangedInteraction, currentInteraction) => {
        return (
            <>
                {' '}
                <div
                    className={'tab-item no-padding ' + this.getSelectedClass(TABS.COMMENTS)}
                    onClick={() => this.onSelectTab(TABS.COMMENTS)}
                >
                    {this.props.getTranslation('Comments')}
                </div>
                {this.renderCommentsBlock(
                    interactionSelector(!!disabledFields, unchangedInteraction!, currentInteraction)
                )}
            </>
        );
    };

    render() {
        const { unchangedInteraction, currentInteraction } = this.props;
        return (
            <DisabledTypeContext.Consumer>
                {({ disabledFields }) => {
                    return this.props.currentInteraction ? (
                        <div className='ModalInteractionTabs row no-margin'>
                            <div key={this.state.selectedTab} className='ModalInteractionTabs--tab-item-container'>
                                {this.renderUserSays()}
                                {this.renderBotResponse()}
                                {this.renderAdvanced()}
                                {/* {this.renderLabels()} */}
                                {this.renderComments(disabledFields, unchangedInteraction, currentInteraction)}
                            </div>
                            {/* <div className="tab-item no-padding language">
                <select className="form-control form-control-sm" onChange={this.setLanguage}>
                    {this.languages && this.languages.length > 0
                        ? this.languages.map((language: string) => <option value={language} key={language}>{language}</option>)
                        : <option value={this.languages[0]}>{this.languages[0]}</option>}
                </select>
            </div> */}
                            {this.props.currentInteraction.lastUpdateBy && (
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                    {`Atualizado em ${moment(
                                        interactionSelector(!!disabledFields, unchangedInteraction!, currentInteraction)
                                            .lastUpdateBy?.updatedAt
                                    ).format('DD/MM/YY - HH:MM')}`}
                                    {disabledFields ? (
                                        <div style={{ color: 'blue', fontSize: '13px' }}>Versão publicada</div>
                                    ) : (
                                        !!unchangedInteraction && (
                                            <div style={{ color: 'green', fontSize: '13px' }}>Versão atual</div>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null;
                }}
            </DisabledTypeContext.Consumer>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
    unchangedInteraction: state.botReducer.unchangedInteraction,
});
export const ModalInteractionTabs = I18n(connect(mapStateToProps, {})(ModalInteractionTabsClass));
