import { Checkbox } from 'antd';
import { cloneDeep, concat, isEmpty } from 'lodash';
import { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { v4 } from 'uuid';
import { BotAttribute } from '../../../../../../model/BotAttribute';
import { Interaction, IResponse, Language } from '../../../../../../model/Interaction';
import { fixedResponses } from '../../../../../../model/ResponseElement';
import { FormPopup } from '../../../../../../shared/FormPopup/FormPopup';
import { ModalConfirm } from '../../../../../../shared/ModalConfirm/ModalConfirm';
import { addNotification, addNotificationApp } from '../../../../../../utils/AddNotification';
import { interactionSelector } from '../../../../../../utils/InteractionSelector';
import I18n from '../../../../../i18n/components/i18n';
import { DisabledTypeContext } from '../../../../contexts/disabledFieldsContext';
import { BotActions } from '../../../../redux/actions';
import { BotService } from '../../../../services/BotService';
import { BotResponseWrapper } from '../../../BotResponseWrapper/BotResponseWrapper/BotResponseWrapper';
import { BotResponseMoveDirection } from '../../../BotResponseWrapper/BotResponseWrapper/BotResponseWrapperProps';
import { ModalListInteraction } from '../../../BotResponseWrapper/ModalListInteraction/ModalListInteraction';
import BotResponseFactory from '../../../BotResponses/BotResponseFactory/BotResponseFactory';
import { MenuLeftResponses } from '../MenuLeftResponses/MenuLeftResponses';
import NotificationGoToBot from '../NotificationGoToBot';
import './BotResponseTab.scss';
import { BotResponseTabProps, BotResponseTabState } from './BotResponseTabProps';
class BotResponseTabClass extends Component<BotResponseTabProps, BotResponseTabState> {
    constructor(props) {
        super(props);
        const params: any = this.props.match.params;
        this.state = {
            isOpenedModalDelete: false,
            responseIndex: '',
            responseCurrent: {},
            idResponseList: [],
            checkBoxAll: false,
            isCopyModalOpened: false,
            isCopyToItModalOpened: false,
            idInteractionCopy: this.listOptions(),
            workspaceId: params.workspaceId,
            botId: params.botId,
            interactionList: this.props.interactionList,
        };
    }

    toggleModal = (copyToIt?: boolean) => {
        if (copyToIt === false) {
            return this.setState({ isCopyToItModalOpened: false, isCopyModalOpened: true });
        } else if (copyToIt === true) {
            return this.setState({ isCopyToItModalOpened: true, isCopyModalOpened: false });
        }
        this.setState({ isCopyModalOpened: false, isCopyToItModalOpened: false });
    };

    listOptions = () => {
        const options: any = [];
        this.props.interactionList &&
            this.props.interactionList.map((interaction) => {
                if (
                    interaction.type !== 'fallback' &&
                    interaction.type !== 'context-fallback' &&
                    interaction._id !== this.props.currentInteraction._id
                ) {
                    options.push(interaction._id);
                }
            });
        return options[0];
    };

    onCopy = (idInteractionCopy, workspaceId, botId, interactionList) => {
        let array: IResponse[] = [];
        this.state.idResponseList.map((id) => {
            this.getResponses()?.find((obj) => {
                obj._id == id ? array.push(obj) : obj.id == id && array.push(obj);
            });
        });

        this.copyResponse(array, idInteractionCopy, workspaceId, botId, interactionList);
        this.toggleModal();
    };

    renderCopyModal = (copyToIt: Boolean) => {
        const { getTranslation } = this.props;

        if (copyToIt) {
            return (
                <FormPopup
                    trigger='mdi-content-copy'
                    isOpenedPopover={this.state.isCopyToItModalOpened}
                    onClose={this.toggleModal}
                    popupBody={
                        <ModalListInteraction copyToIt={copyToIt} onCopy={this.onCopy} toggleModal={this.toggleModal} />
                    }
                >
                    <div
                        className='control-btn'
                        onClick={() => this.toggleModal(Boolean(copyToIt))}
                        title={getTranslation('Copy')}
                    >
                        <span className='mdi mdi-24px mdi-content-copy' />
                    </div>
                </FormPopup>
            );
        }
        return (
            <FormPopup
                trigger='mdi-export'
                isOpenedPopover={this.state.isCopyModalOpened}
                onClose={this.toggleModal}
                popupBody={
                    <ModalListInteraction copyToIt={copyToIt} onCopy={this.onCopy} toggleModal={this.toggleModal} />
                }
            >
                <div
                    className='control-btn'
                    onClick={() => this.toggleModal(copyToIt)}
                    title={getTranslation('Copy to another bot')}
                >
                    <span className='mdi mdi-24px mdi-export' />
                </div>
            </FormPopup>
        );
    };

    /**
     * Função para atualizar uma response, chamada no BotResponseWrapper ou nos bot responses
     */
    onChangeResponse = (response: IResponse, responseIndex) => {
        const languages: Array<Language> = this.props.currentInteraction.languages.map((language: Language) => {
            if (language.language == this.props.selectedLanguage) {
                if (language.responses && language.responses[responseIndex]) {
                    language.responses[responseIndex] = response;
                }
            }
            return language;
        });
        this.updateLanguages(languages);
    };

    /**
     * Função para atualizar o objeto languages do currentInteraction do redux
     * Essa função é chamada a cada vez que algum component do BotResponseWrapper ou algum bot response é atualizado
     */

    updateLanguages = (languages: Array<Language>) => {
        const currentInteraction: Interaction = this.props.currentInteraction;
        currentInteraction.languages = languages;
        this.props.setCurrentInteraction(currentInteraction);
        this.forceUpdate();
    };

    /**
     * Função para deletar o response dentro do objeto language
     */
    onDelete = (response: IResponse, responseIndex: number) => {
        const languages: Array<Language> = this.props.currentInteraction.languages.map((language: Language) => {
            if (language.language == this.props.selectedLanguage) {
                if (language.responses && language.responses[responseIndex]) {
                    language.responses = language.responses.filter((response: IResponse, index) => {
                        return index != responseIndex;
                    });
                }
            }
            return language;
        });
        this.updateLanguages(languages);
        /* Validação modal */
        // this.openModalDelete(true, responseIndex, response);
    };

    toggleModaldelete = () => {
        this.setState({ isOpenedModalDelete: !this.state.isOpenedModalDelete });
    };

    openModalDelete = (status: boolean, responseIndex, response: IResponse) => {
        this.setState({ isOpenedModalDelete: status, responseIndex, responseCurrent: response });
    };

    /**
     * Função para mover o response para cima e para baixo dentro do objeto language
     */
    onMove = (moveTo: BotResponseMoveDirection, responseIndex: number) => {
        const languages: Array<Language> = this.props.currentInteraction.languages.map((language: Language) => {
            if (language.language == this.props.selectedLanguage) {
                if (language.responses && language.responses[responseIndex]) {
                    const currentInteraction = language.responses[responseIndex];
                    if (moveTo == BotResponseMoveDirection.UP) {
                        const prevInteraction = language.responses[responseIndex - 1];
                        language.responses[responseIndex - 1] = currentInteraction;
                        language.responses[responseIndex] = prevInteraction;
                    }
                    if (moveTo == BotResponseMoveDirection.DOWN) {
                        const nextInteraction = language.responses[responseIndex + 1];
                        language.responses[responseIndex + 1] = currentInteraction;
                        language.responses[responseIndex] = nextInteraction;
                    }
                }
            }
            return language;
        });
        this.updateLanguages(languages);
    };

    onScroll = () => {
        let scroll = document.querySelector('#modal-interaction-content');
        if (!scroll) return null;
        let valueInitialScroll = scroll.scrollTop + 250;
        scroll.scrollTo(0, valueInitialScroll);
    };

    copyResponse = (response: IResponse[], idInteractionCopy, workspaceId, botId, interactionList) => {
        const { selectedLanguage } = this.props;
        const params: any = this.props.match.params;

        if (idInteractionCopy) {
            interactionList.filter((interaction: Interaction, index: number) => {
                if (interaction._id == idInteractionCopy && !isEmpty(interaction.languages)) {
                    interaction.languages.filter((language) => {
                        if (selectedLanguage && selectedLanguage === language.language) {
                            language.responses && language.responses.push(...response);
                            BotService.updateInteraction(workspaceId, botId, interaction).then(() => {
                                if (botId === params.botId) {
                                    addNotification({
                                        message: 'Copied reply',
                                        title: '',
                                        type: 'success',
                                        duration: 4000,
                                        container: 'top-right',
                                        insert: 'top',
                                    });
                                    this.props.updateTree();
                                } else {
                                    addNotificationApp({
                                        content: (
                                            <NotificationGoToBot
                                                botId={botId}
                                                workspaceId={workspaceId}
                                                interactionId={idInteractionCopy}
                                            />
                                        ),
                                        duration: 10000,
                                        container: 'top-right',
                                        insert: 'top',
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } else {
            addNotification({
                message: 'Sorry we get an error, verify interaction and try again! ',
                title: '',
                type: 'danger',
                duration: 4000,
                container: 'top-right',
                insert: 'top',
            });
        }
    };

    onClone = (response: IResponse, index) => {
        const indexSelected = index + 1;
        const cloneResponse: IResponse = cloneDeep(response);
        cloneResponse._id = undefined;
        cloneResponse.id = v4();
        const languages: Array<Language> = this.props.currentInteraction.languages.map((language: Language) => {
            if (language.language == this.props.selectedLanguage) {
                if (language.responses && language.responses) {
                    language.responses.splice(indexSelected, 0, cloneResponse);
                    this.onScroll();
                }
            }
            return language;
        });
        this.updateLanguages(languages);
    };

    onCreateAttribute = (attributes: Array<BotAttribute>) => {
        const { botAttributes } = this.props;
        let newBotAttr: any = [];

        attributes.forEach((element) => {
            let existAttribute = botAttributes.find((el, index) => {
                if (el.type && el.name === element.name) {
                    botAttributes[index].type = element.type;
                }
                return el.name === element.name;
            });
            if (!existAttribute) {
                newBotAttr.push(element);
            }
        });
        this.props.setBotAttributes(concat(botAttributes, newBotAttr));
    };

    renderNotImplemented = () => {
        const { getTranslation } = this.props;

        return (
            <div className='not-implemented-yet'>
                <i className='mdi mdi-48px mdi-tag' />
                <h3>{`${getTranslation('Not implemented yet')}.`}</h3>
                <p>{`${getTranslation('Click a bot answers and actions here to make your chatbot responsive')}.`}</p>
            </div>
        );
    };

    getResponses = () => {
        if (!this.props.currentInteraction) return null;
        if (isEmpty(this.props.currentInteraction.languages)) {
            const newResponse = {
                responses: [],
                userSays: [],
                language: this.props.selectedLanguage,
            };
            this.props.currentInteraction.languages.push(newResponse);
        }
        const language: Language = this.props.currentInteraction.languages.find((language: Language) => {
            return language.language == this.props.selectedLanguage;
        }) as Language;
        if (!language) return [];
        const responses: any = language.responses || null;

        return responses?.filter((currResponse) => !fixedResponses.includes(currResponse.type));
    };

    checked = (event: boolean, idResponse: string) => {
        let responseList: string[] = [];
        responseList = this.state.idResponseList;

        if (event) {
            responseList.push(idResponse);
        } else {
            responseList.splice(responseList.indexOf(idResponse), 1);
        }

        this.setState({
            idResponseList: responseList,
            checkBoxAll: this.state.idResponseList.length === this.getResponses()?.length ? true : false,
        });
    };

    onCheckAllChange = (e) => {
        if (!e) {
            this.setState({ idResponseList: [], checkBoxAll: false });
        } else {
            const idResponses = this.getResponses()?.map((obj) => {
                if (obj.isResponseValid == true || obj.isResponseValid == undefined) {
                    if (obj._id) {
                        return obj._id;
                    } else {
                        return obj.id;
                    }
                }
            });
            this.setState({ idResponseList: idResponses ? idResponses : [], checkBoxAll: true });
        }
    };

    /**
     * Função para renderizar os responses de acordo com  a linguage seleciona no redux
     */
    renderResponses = (disabledFields) => {
        const { unchangedInteraction, currentInteraction } = this.props;
        if (!this.props.currentInteraction) return null;
        if (isEmpty(this.props.currentInteraction.languages)) {
            const newResponse = {
                responses: [],
                userSays: [],
                language: this.props.selectedLanguage,
            };
            this.props.currentInteraction.languages.push(newResponse);
        }
        const language: Language = interactionSelector(
            disabledFields,
            unchangedInteraction!,
            currentInteraction
        ).languages.find((language: Language) => {
            return language.language == this.props.selectedLanguage;
        }) as Language;
        if (!language) return null;
        const responses: Array<IResponse> = language.responses || [];
        if (isEmpty(responses)) return this.renderNotImplemented();

        return responses.map((response: IResponse, index) => {
            const fixedResponsesCount = responses.filter((currResponse) =>
                fixedResponses.includes(currResponse.type)
            ).length;
            const isFirstResponse = fixedResponsesCount - index == 0;
            return (
                <BotResponseWrapper
                    isLastResponse={index == responses.length - 1}
                    isFirstResponse={isFirstResponse}
                    onChange={(response: IResponse) => this.onChangeResponse(response, index)}
                    onDelete={() => this.onDelete(response, index)}
                    onClone={() => this.onClone(response, index)}
                    onMoveInteraction={(direction: BotResponseMoveDirection) => this.onMove(direction, index)}
                    response={response}
                    checked={this.checked}
                    idResponseList={this.state.idResponseList}
                    //Por algum motivo o key tem que ser o index,
                    //caso mude para o UUID quebra as validações
                    key={index}
                    submitted={this.props.modalInteractionSubmitted}
                >
                    <BotResponseFactory
                        response={response}
                        onCreateAttribute={this.onCreateAttribute}
                        onChange={(response) => this.onChangeResponse(response, index)}
                        submitted={this.props.modalInteractionSubmitted}
                    />
                </BotResponseWrapper>
            );
        });
    };

    renderModalDelete = () => {
        const { responseIndex, responseCurrent, isOpenedModalDelete } = this.state;
        return (
            <ModalConfirm
                isOpened={isOpenedModalDelete}
                onAction={(action) => {
                    this.toggleModaldelete();
                    if (!action) return null;
                    const languages: Array<Language> = this.props.currentInteraction.languages.map(
                        (language: Language) => {
                            if (language.language == this.props.selectedLanguage) {
                                if (language.responses && language.responses[responseIndex]) {
                                    language.responses = language.responses.filter((response: IResponse, index) => {
                                        return index != responseIndex;
                                    });
                                }
                            }
                            return language;
                        }
                    );
                    this.updateLanguages(languages);
                }}
            >
                <h5>Confirm delete</h5>
                <p>
                    Are you sure you want to delete response <span>{responseCurrent.name}</span>?
                </p>
            </ModalConfirm>
        );
    };

    render() {
        const { idResponseList, checkBoxAll } = this.state;
        return (
            <DisabledTypeContext.Consumer>
                {({ disabledFields, setDisabledFields }) => {
                    if (this.props.unchangedInteraction?._id) {
                        setDisabledFields(true);
                    }
                    return (
                        <div className='BotResponseTab'>
                            {this.state.isOpenedModalDelete ? this.renderModalDelete() : null}
                            {!!disabledFields ? null : (
                                <div className='menu-left-container'>
                                    <MenuLeftResponses onChangeLanguage={this.updateLanguages} />
                                </div>
                            )}
                            {!disabledFields && this.getResponses()?.length ? (
                                <div
                                    style={{
                                        height: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        paddingLeft: '15px',
                                    }}
                                >
                                    <Checkbox
                                        indeterminate={
                                            idResponseList.length > 0 &&
                                            idResponseList.length !== this.getResponses()?.length
                                        }
                                        onChange={(e) => this.onCheckAllChange(e.target.checked)}
                                        checked={checkBoxAll}
                                    >
                                        {this.props.getTranslation('Check all')}
                                    </Checkbox>
                                    {idResponseList.length ? (
                                        <>
                                            <div className='interaction-select-popup'>{this.renderCopyModal(true)}</div>
                                            <div style={{ marginLeft: '5px' }}>{this.renderCopyModal(false)}</div>
                                        </>
                                    ) : (
                                        ''
                                    )}
                                </div>
                            ) : (
                                ''
                            )}
                            <div
                                className='modal-interaction-content card'
                                id='modal-interaction-content'
                                style={
                                    disabledFields ? { height: 'calc(100% + 18px)' } : { height: 'calc(100% - 22px' }
                                }
                            >
                                {this.renderResponses(!!disabledFields)}
                            </div>
                        </div>
                    );
                }}
            </DisabledTypeContext.Consumer>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
    unchangedInteraction: state.botReducer.unchangedInteraction,
    interactionList: state.botReducer.interactionList,
    selectedLanguage: state.botReducer.selectedLanguage,
    modalInteractionSubmitted: state.botReducer.modalInteractionSubmitted,
    botAttributes: state.botReducer.botAttributes,
});
export const BotResponseTab = I18n(
    withRouter(
        connect(mapStateToProps, {
            setCurrentInteraction: BotActions.setCurrentInteraction,
            setInteractionList: BotActions.setInteractionList,
            setBotAttributes: BotActions.setBotAttributes,
        })(BotResponseTabClass)
    )
);
