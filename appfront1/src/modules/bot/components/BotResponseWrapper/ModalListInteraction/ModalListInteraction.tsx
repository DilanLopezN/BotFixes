import React, { Component } from 'react';
import { LabelWrapper } from '../../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { DiscardBtn } from '../../../../../shared/StyledForms/DiscardBtn/DiscardBtn';
import { DoneBtn } from '../../../../../shared/StyledForms/DoneBtn/DoneBtn';
import './ModalListInteraction.scss';
import { connect } from 'react-redux';
import { ModalListInteractionProps, ModalListInteractionState } from './ModalListInteractionProps';
import I18n from '../../../../i18n/components/i18n';
import { InteractionSelect } from '../../../../../shared/StyledForms/InteractionsSelect/InteractionSelect';
import { WorkspaceService } from '../../../../workspace/services/WorkspaceService';
import { BotService } from '../../../services/BotService';
import { CustomSelect } from '../../../../../shared/StyledForms/CustomSelect/CustomSelect';
import { FormItemInteraction } from '../../../../../shared-v2/FormItemInteraction';

class ModalListInteractionClass extends Component<ModalListInteractionProps, ModalListInteractionState> {
    constructor(props: Readonly<ModalListInteractionProps>) {
        super(props);
        this.state = {
            selectedItem: this.props.interactionList[0]._id,
            items: [],
            workspaceId: this.props.currentBot.workspaceId,
            botList: this.props.botList,
            interactionList: this.props.interactionList,
            botId: this.props.currentBot._id,
        };
    }

    getBotsWorkspace = async (workspaceId: string) => {
        const workspaceBots = await WorkspaceService.getWorkspaceBots(workspaceId);
        this.setState({ botList: workspaceBots.data, botId: workspaceBots.data[0]._id });
    };

    getInteractions = async (workspaceId: string, botId: string) => {
        const interactionsList = await BotService.getInteractions(workspaceId, botId);
        this.setState({ interactionList: interactionsList.data });
    };

    getLabels = (list) => {
        return list.map((item) => ({
            label: item.name,
            value: item._id,
        }));
    };

    render(): React.ReactNode {
        const { getTranslation } = this.props;
        return (
            <div className='ModalListInteraction'>
                {!this.props.copyToIt && (
                    <>
                        <LabelWrapper label={getTranslation('Choose a workspace')}>
                            <CustomSelect
                                onChange={(value) => {
                                    if (value === null) {
                                        this.setState({
                                            ...this.state,
                                            workspaceId: this.props.currentBot.workspaceId,
                                            interactionList: [],
                                            selectedItem: '',
                                        });
                                        this.getBotsWorkspace(this.props.currentBot.workspaceId);
                                        return;
                                    }
                                    this.setState({
                                        ...this.state,
                                        workspaceId: value.value,
                                        interactionList: [],
                                        selectedItem: '',
                                    });
                                    this.getBotsWorkspace(value.value);
                                }}
                                value={this.getLabels(this.props.workspaceList).find(
                                    (item) => item.value === this.state.workspaceId
                                )}
                                options={this.getLabels(this.props.workspaceList)}
                            />
                        </LabelWrapper>
                        {this.state.botList.length > 0 && (
                            <LabelWrapper label={getTranslation('Choose a bot')}>
                                <CustomSelect
                                    onChange={(value) => {
                                        if (value === null) {
                                            this.setState({
                                                ...this.state,
                                                botId: this.state.botList[0]._id as string,
                                                selectedItem: '',
                                            });
                                            this.getInteractions(
                                                this.state.workspaceId,
                                                this.state.botList[0]._id as string
                                            );
                                            return;
                                        }
                                        this.setState({
                                            ...this.state,
                                            botId: value.value,
                                            selectedItem: '',
                                        });
                                        this.getInteractions(this.state.workspaceId, value.value);
                                    }}
                                    value={this.getLabels(this.state.botList).find(
                                        (item) => item.value === this.state.botId
                                    )}
                                    options={this.getLabels(this.state.botList)}
                                />
                            </LabelWrapper>
                        )}
                    </>
                )}
                {this.state.interactionList.length > 0 && (
                    <LabelWrapper
                        label={getTranslation('Copy to interaction')}
                        validate={{
                            touched: this.props.touched,
                            errors: this.props.errors,
                            fieldName: 'interaction.value',
                            isSubmitted: this.props.submitted,
                        }}
                    >
                        <InteractionSelect
                            options={this.state.interactionList || []}
                            interactionTypeToShow={['interaction', 'fallback', 'welcome']}
                            defaultValue={this.state.selectedItem}
                            placeholder={getTranslation('Select a interaction')}
                            onChange={(event) => {
                                this.setState({
                                    ...this.state,
                                    selectedItem: event.value,
                                });
                            }}
                        />
                    </LabelWrapper>
                )}
                <div className='ModalListInteraction--container-btn'>
                    <DiscardBtn onClick={this.props.toggleModal}>{getTranslation('Cancel')}</DiscardBtn>
                    <DoneBtn
                        style={!this.state.selectedItem ? { pointerEvents: 'none', opacity: '0.4' } : {}}
                        onClick={() => {
                            const { selectedItem, workspaceId, botId, interactionList } = this.state;

                            this.props.onCopy(selectedItem, workspaceId, botId, interactionList);
                        }}
                    >
                        {getTranslation('Save')}
                    </DoneBtn>
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    interactionList: state.botReducer.interactionList,
    currentInteraction: state.botReducer.currentInteraction,
    workspaceList: state.workspaceReducer.workspaceList,
    botList: state.workspaceReducer.botList,
    currentBot: state.botReducer.currentBot,
});

export const ModalListInteraction = I18n(connect(mapStateToProps, {})(ModalListInteractionClass));
