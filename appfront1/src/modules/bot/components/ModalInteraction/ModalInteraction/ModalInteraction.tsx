import { ExclamationCircleOutlined } from '@ant-design/icons';
import { notification } from 'antd';
import cloneDeep from 'lodash/cloneDeep';
import { Component } from 'react';
import ClickOutside from 'react-click-outside';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { ApiError } from '../../../../../interfaces/api-error.interface';
import { ICondition, Interaction, IResponse, Language } from '../../../../../model/Interaction';
import { IconGotoInteraction } from '../../../../../shared-v2/FormItemInteraction';
import { ModalPosition } from '../../../../../shared/Modal/ModalProps';
import { ModalConfirm } from '../../../../../shared/ModalConfirm/ModalConfirm';
import { LoadingArea, Spin } from '../../../../../shared/Spin/spin';
import { Wrapper } from '../../../../../ui-kissbot-v2/common';
import { Constants } from '../../../../../utils/Constants';
import { getTreeCollapsedLocal } from '../../../../../utils/GetLocalStorageTreeCollapsed';
import { dispatchSentryError } from '../../../../../utils/Sentry';
import { timeout } from '../../../../../utils/Timer';
import I18n from '../../../../i18n/components/i18n';
import { DisabledFieldsTypeContextProvider } from '../../../contexts/disabledFieldsContext';
import { BotActions } from '../../../redux/actions';
import { BotService } from '../../../services/BotService';
import { AdvancedTab } from '../AdvancedTab/AdvancedTab';
import { BotResponseTab } from '../BotResponseTab/BotResponseTab/BotResponseTab';
import { CommentsTab } from '../CommentsTab/CommentsTab/CommentsTab';
import InteractionTabs from '../InteractionTabs';
import { ModalInteractionHeader } from '../ModalInteractionHeader/ModalInteractionHeader';
import { ModalInteractionTabs } from '../ModalInteractionTabs/ModalInteractionTabs';
import { UserSaysTabV2 } from '../user-says-tab-v2';
import { UserSaysTab } from '../UserSaysTab/UserSaysTab';
import './ModalInteraction.scss';
import { CombinedProps, ModalInteractionState } from './ModalInteractionProps';
import { TABS } from './tabs.enum';

export class ModalInteractionClass extends Component<CombinedProps, ModalInteractionState> {
    constructor(props: CombinedProps) {
        super(props);
        this.state = {
            selectedTab: TABS.BOT_RESPONSES,
            interaction: props.currentInteraction,
            isSubmitting: false,
            modalChangeOpen: false,
            fetchingInteraction: true,
            errorFetchInteraction: false,
        };
    }

    async componentDidMount() {
        const { currentInteraction } = this.props;
        const params: any = this.props.match.params;

        if (!currentInteraction) {
            return;
        }

        let error: any;

        const interaction = await BotService.getInteraction(
            params.workspaceId || this.props.selectedWorkspace._id,
            currentInteraction.botId?.toString(),
            currentInteraction._id,
            (err) => (error = err)
        );

        if (error) {
            return this.setState({
                errorFetchInteraction: true,
                fetchingInteraction: false,
            });
        }

        this.props.setCurrentInteraction({ ...interaction });
        this.setState({
            interaction: { ...interaction },
            fetchingInteraction: false,
        });
    }

    validResponse = (x, y) => {
        if (x === y) return true;
        // if both x and y are null or undefined and exactly the same

        if (!(x instanceof Object) || !(y instanceof Object)) return false;
        // if they are not strictly equal, they both need to be Objects

        if (x.constructor !== y.constructor) return false;
        // they must have the exact same prototype chain, the closest we can do is
        // test there constructor.
        for (var p in x) {
            //Essa validação e feita para excluir os campos abaixo de qualquer comparação
            if (
                p === 'isElementCardValid' ||
                p === 'isConditionValid' ||
                p === 'isResponseValid' ||
                p === 'userSaysIsValid' ||
                p === 'isButtonValid' ||
                x[p] == ' '
            ) {
                return true;
            }
            if (!x.hasOwnProperty(p)) continue;
            // other properties were tested using x.constructor === y.constructor

            if (!y.hasOwnProperty(p)) return false;
            // allows to compare x[ p ] and y[ p ] when set to undefined

            if (x[p] === y[p]) continue;
            // if they have the same strict value or identity then they are equal

            if (typeof x[p] !== 'object') return false;
            // Numbers, Strings, Functions, Booleans must be strictly equal

            if (!this.validResponse(x[p], y[p])) return false;
            // Objects and Arrays must be tested recursively
        }

        for (p in y) {
            if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
            // allows x[ p ] to be set to undefined
        }
        return true;
    };

    isInteractionEquals = () => {
        const { currentInteraction, validateInteraction } = this.props;

        const currentInteractionCopy: any = { ...currentInteraction };
        const validateInteractionCopy: any = { ...validateInteraction };

        delete currentInteractionCopy.isCollapsed;
        delete currentInteractionCopy.updatedAt;
        delete currentInteractionCopy.lastUpdateBy;
        delete currentInteractionCopy.completePath;
        delete currentInteractionCopy.path;

        delete validateInteractionCopy.isCollapsed;
        delete validateInteractionCopy.updatedAt;
        delete validateInteractionCopy.lastUpdateBy;
        delete validateInteractionCopy.completePath;
        delete validateInteractionCopy.path;

        return this.validResponse(currentInteractionCopy, validateInteractionCopy);
    };

    validateInteraction = (): Array<string> => {
        const error: Array<string> = [];
        for (let i = 0; i < this.props.currentInteraction.languages.length; i++) {
            const language: Language = this.props.currentInteraction.languages[i];
            if (language.userSaysIsValid === false) {
                error.push('User field says it is invalid!');
            }
            if (language.responses) {
                for (let responseIndex = 0; responseIndex < language.responses.length; responseIndex++) {
                    const response: IResponse = language.responses[responseIndex];
                    if (response.isResponseValid === false) error.push('Some bot responses are invalid!');
                    if (response.filter && response.filter.conditions) {
                        for (let filterIndex = 0; filterIndex < response.filter.conditions.length; filterIndex++) {
                            const condition: ICondition = response.filter.conditions[filterIndex];
                            if (condition.isConditionValid === false) error.push('Some response filter is invalid!');
                        }
                    }
                }
            }
        }
        return error;
    };

    setTreeCollapseLocalNull = (params: any) => {
        const treeCollapsed = getTreeCollapsedLocal();
        const replCollapsed = {
            ...treeCollapsed,
            [params.workspaceId]: {
                ...treeCollapsed?.[params.workspaceId],
                [params.botId]: {
                    collapsed: null,
                },
            },
        };
        localStorage.setItem(Constants.LOCAL_STORAGE_MAP.TREE_COLLAPSED, JSON.stringify(replCollapsed));
        this.props.onResetCollapseType?.();
    };

    updateTree = () => {
        const params: any = this.props.match.params;
        BotService.getInteractions(
            params.workspaceId || this.props.selectedWorkspace._id,
            params.botId || this.props.currentBot._id
        ).then((success) => {
            if (success?.data) {
                const localStorageTreeCollapsed = getTreeCollapsedLocal();
                if (
                    localStorageTreeCollapsed?.[params.workspaceId]?.[params.botId].collapsed === false ||
                    localStorageTreeCollapsed?.[params.workspaceId]?.[params.botId].collapsed === null
                ) {
                    try {
                        this.setTreeCollapseLocalNull(params);
                    } catch (error) {
                        dispatchSentryError(error);
                    }
                    return this.props.setInteractionList(
                        success?.data.map((interaction) => {
                            const allCollapse = this.props.interactionList?.find((i) => {
                                return i._id === interaction._id;
                            });
                            return { ...interaction, isCollapsed: allCollapse?.isCollapsed! };
                        })
                    );
                }
            }
        });
    };

    onHeaderSubmit = async (headerFormValues) => {
        let error: ApiError;
        if (this.state.errorFetchInteraction || this.state.fetchingInteraction) {
            return;
        }

        this.props.setModalSubmitted(false);
        const errors: Array<string> = this.validateInteraction();
        if (errors.length === 0) {
            this.setState({ isSubmitting: true });
            const params: any = this.props.match.params;

            const errorMessage = () => {
                this.setState({ isSubmitting: false });
                notification.error({
                    message: this.props.getTranslation('Erro'),
                    description: this.props.getTranslation('An error has occurred. Check the fields'),
                });
            };

            const successMessage = () => {
                this.setState({ isSubmitting: false });

                notification.success({
                    message: this.props.getTranslation('Success'),
                    description: this.props.getTranslation('Saved successfully'),
                    placement: 'bottomRight',
                });

                this.props.setValidateInteraction(cloneDeep(this.props.currentInteraction));
                this.updateTree();
            };

            try {
                const response = await BotService.updateInteraction(
                    params.workspaceId || this.props.selectedWorkspace._id,
                    params.botId || this.props.currentBot._id,
                    {
                        ...this.props.currentInteraction,
                        name: headerFormValues.name,
                    },
                    (err: ApiError) => {
                        error = err;
                    }
                );

                timeout(() => {
                    const getIntentNameById = (intentId: string) => {
                        const intent = this.props.interactionList?.find((intention) => intention._id === intentId);
                        return intent ? intent.name : intentId;
                    };

                    if (!response) {
                        const intentName = getIntentNameById(error.message[0]);
                        if (error?.statusCode === 400 && error?.error === 'ERROR_DUPLICATED_UNIQUE_INTENT') {
                            return notification.open({
                                message: this.props.getTranslation('Erro'),
                                description: (
                                    <>
                                        {this.props.getTranslation(
                                            'Intent is already being used in this context. Interaction:'
                                        )}
                                        <strong>{intentName}</strong>
                                        <IconGotoInteraction
                                            style={{ marginLeft: 5 }}
                                            title={this.props.getTranslation('Navigate to the selected interaction')}
                                            className='mdi mdi-share mdi-18px'
                                            href={`/workspace/${this.props.selectedWorkspace._id}/bot/${this.props.currentBot._id}/interaction/${error.message[0]}`}
                                            target='_blank'
                                        />
                                    </>
                                ),
                                icon: <ExclamationCircleOutlined />,
                            });
                        }
                        return errorMessage();
                    }

                    this.props.setInteractionsPendingPublication();

                    this.props.setInteractionList(
                        this.props.interactionList.map((interaction) => {
                            if (interaction._id === this.state.interaction?._id) {
                                return { ...interaction, ...response };
                            }

                            return interaction;
                        })
                    );

                    return successMessage();
                }, 0);
            } catch (error) {
                errorMessage();
            }
        } else {
            const uniqueErrors = Array.from(new Set(errors));
            uniqueErrors.forEach((err) => {
                notification.warning({
                    message: this.props.getTranslation('Warning'),
                    description: this.props.getTranslation(err),
                });
            });
            this.props.setModalSubmitted(true);
        }
    };

    onSelectTab = (tab: TABS) => {
        this.setState({ selectedTab: tab });
    };

    getTab = (isCurrentInteraction: boolean) => {
        const { getTranslation } = this.props;
        if (this.state.fetchingInteraction) {
            return (
                <Wrapper>
                    <LoadingArea>
                        <Spin />
                    </LoadingArea>
                </Wrapper>
            );
        }

        if (this.state.errorFetchInteraction) {
            return (
                <Wrapper display='flex' justifyContent='center'>
                    <div>
                        <i className='mdi mdi-48px mdi-alert-circle' />
                        <h4>{getTranslation('An error occurred while loading the interaction')}</h4>
                        <p>{getTranslation('Close the interaction and open it again')}</p>
                    </div>
                </Wrapper>
            );
        }

        if (!this.state.interaction) {
            return null;
        }

        if (this.state.selectedTab === TABS.USER_SAYS) {
            return this.props.settings.generalFeatureFlag?.v2Handlebars ? <UserSaysTabV2 /> : <UserSaysTab />;
        }
        if (this.state.selectedTab === TABS.BOT_RESPONSES) {
            return <BotResponseTab updateTree={this.updateTree} />;
        }
        if (this.state.selectedTab === TABS.ADVANCED) {
            return <AdvancedTab />;
        }
        if (this.state.selectedTab === TABS.COMMENTS) {
            return <CommentsTab />;
        }
        return 'Not implemented yet';
    };

    toggleModalChange = (isOpen) => {
        this.setState({ modalChangeOpen: isOpen });
    };

    closeModal = () => {
        this.props.setCurrentInteraction(undefined);
        this.props.setUnchangedInteraction(undefined);
        this.props.setValidateInteraction(undefined);
        this.updateTree();
    };

    onCloseModal = () => {
        if (this.isInteractionEquals() && !this.props.modalInteractionSubmitted) {
            this.closeModal();
        } else {
            this.toggleModalChange(true);
        }
    };

    onPublish = () => {
        if (this.isInteractionEquals() && !this.props.modalInteractionSubmitted) {
            return false;
        } else {
            return true;
        }
    };

    renderModalChange = () => {
        const { getTranslation } = this.props;

        return (
            <ModalConfirm
                height='150px'
                width='390px'
                isOpened={this.state.modalChangeOpen}
                position={ModalPosition.center}
                onConfirmText={getTranslation('Yes')}
                onCancelText={getTranslation('No')}
                onAction={(action: any) => {
                    if (action) {
                        this.closeModal();
                        this.toggleModalChange(false);
                    } else {
                        this.toggleModalChange(false);
                    }
                }}
            >
                <div className='modal-change-close'>
                    <h5>{getTranslation('Unsaved changes')}</h5>
                    <p>
                        {getTranslation('You have unsaved changes. Are you sure you want to leave')}
                        <span> {getTranslation('without saving')}?</span>
                    </p>
                </div>
            </ModalConfirm>
        );
    };

    onLanguageChange = (language) => {
        this.props.setSelectedLanguage(language);
    };

    /**
     * Ao clicar em outside sempre pega o evento de onclick, mesmo com modal fechado, pois o component
     * ClickOutside está sempre renderizado; para corrigir isso é necessário forçar a verificação se o modal interaction está aberto.
     * O modal interaction é considerado aberto quando os reduxes currentInteraction e validateInteraction não estão vazios
     */
    closeOnClickOutside = () => {
        if (this.props.currentInteraction && this.props.validateInteraction) {
            this.onCloseModal();
        }
    };

    onKeyDown = () => {
        if (this.props.currentInteraction && this.props.validateInteraction) {
            document.onkeydown = (event) => {
                if (event.key === 'Escape') {
                    this.onCloseModal();
                }
            };
        }
    };

    renderModal = (isCurrentInteraction: boolean) => {
        return (
            <div className='ModalInteraction'>
                <ClickOutside
                    className='click-outside-container'
                    onClickOutside={(event) => {
                        if (event.target.className !== 'Modal opened') return;
                        this.closeOnClickOutside();
                    }}
                >
                    {this.renderModalChange()}
                    <ModalInteractionHeader
                        preview={this.props.preview}
                        onSubmit={this.onHeaderSubmit}
                        onCloseModal={() => this.onCloseModal()}
                        onPublish={() => this.onPublish()}
                        setPendingPublication={(int: Interaction[]) => this.props.setPendingPublication(int)}
                    />

                    {this.props.settings.generalFeatureFlag?.v2Handlebars ? (
                        <InteractionTabs
                            tab={this.state.selectedTab}
                            preview={this.props.preview}
                            onSelectLanguage={this.onLanguageChange}
                            onSelectTab={this.onSelectTab}
                        />
                    ) : (
                        <ModalInteractionTabs
                            tab={this.state.selectedTab}
                            preview={this.props.preview}
                            onSelectLanguage={this.onLanguageChange}
                            onSelectTab={this.onSelectTab}
                        />
                    )}
                    {isCurrentInteraction ? this.getTab(isCurrentInteraction) : this.getTab(false)}
                </ClickOutside>
            </div>
        );
    };

    render() {
        const { unchangedInteraction } = this.props;
        this.onKeyDown();

        return (
            <div
                style={
                    unchangedInteraction
                        ? { display: 'flex', justifyContent: 'space-between', height: '100%' }
                        : { height: '100%' }
                }
            >
                {unchangedInteraction?._id && (
                    <div style={{ width: '40%' }}>
                        <DisabledFieldsTypeContextProvider>
                            {<>{this.renderModal(false)}</>}
                        </DisabledFieldsTypeContextProvider>
                    </div>
                )}
                <div style={unchangedInteraction ? { width: '40%' } : { height: '100%' }}>{this.renderModal(true)}</div>
            </div>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
    unchangedInteraction: state.botReducer.unchangedInteraction,
    validateInteraction: state.botReducer.validateInteraction,
    modalInteractionSubmitted: state.botReducer.modalInteractionSubmitted,
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    currentBot: state.botReducer.currentBot,
    interactionList: state.botReducer.interactionList,
    settings: state.loginReducer.settings || { generalFeatureFlag: {} },
});
export const ModalInteraction = I18n(
    withRouter(
        connect(mapStateToProps, {
            setCurrentInteraction: BotActions.setCurrentInteraction,
            setUnchangedInteraction: BotActions.setUnchangedInteraction,
            setValidateInteraction: BotActions.setValidateInteraction,
            setModalSubmitted: BotActions.setModalSubmitted,
            setInteractionList: BotActions.setInteractionList,
            setSelectedLanguage: BotActions.setSelectedLanguage,
        })(ModalInteractionClass)
    )
);
