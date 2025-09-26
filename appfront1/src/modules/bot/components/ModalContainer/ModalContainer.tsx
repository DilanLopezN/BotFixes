import React, { Component } from 'react';
import './ModalContainer.scss';
import { ModalConatinerProps, ModalInteractionState } from './ModalContainerProps';

import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { cloneDeep } from 'lodash';

import ClickOutside from 'react-click-outside';
import { DiscardBtn } from '../../../../shared/StyledForms/DiscardBtn/DiscardBtn';
import { BotActions } from '../../redux/actions';
import { BotService } from '../../services/BotService';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import { DoneBtn } from '../../../../shared/StyledForms/DoneBtn/DoneBtn';
import { Modal } from '../../../../shared/Modal/Modal';
import { Form, Formik } from 'formik';
import { LabelWrapper } from '../../../../shared/StyledForms/LabelWrapper/LabelWrapper';
import { StyledFormikField } from '../../../../shared/StyledForms/StyledFormikField/StyledFormikField';
import { ButtonSave } from '../../../../shared/ButtonSave/ButtonSave';
import * as Yup from 'yup';
import I18n from '../../../i18n/components/i18n';
import { timeout } from '../../../../utils/Timer';
import { addNotification } from '../../../../utils/AddNotification';
import BlockUi from '../../../../shared-v2/BlockUi/BlockUi';

export class ModalContainerClass extends Component<ModalConatinerProps, ModalInteractionState> {
    constructor(props: ModalConatinerProps) {
        super(props);
        this.state = {
            interaction: props.currentInteraction,
            isSubmitting: false,
            modalChangeOpen: false,
            originalNameContainer: '',
            hasUnsavedChanges: false,
        };
    }

    componentDidMount(): void {
        this.setState({
            ...this.state,
            originalNameContainer: this.props.currentInteraction ? this.props.currentInteraction.name : '',
        });
    }

    // validResponse = () => this.state.originalNameContainer === this.props.currentInteraction.name;
    validResponse = () => !this.state.hasUnsavedChanges;

    updateTree = () => {
        const params: any = this.props.match.params;
        BotService.getInteractions(params.workspaceId, params.botId).then((success) => {
            return this.props.setInteractionList(
                success?.data.map((interection) => {
                    const allCollapse = this.props.interactionList?.find((i) => {
                        return i._id === interection._id;
                    });
                    return { ...interection, isCollapsed: allCollapse?.isCollapsed! };
                })
            );
        });
    };

    onHeaderSubmit = (headerFormValues) => {
        this.props.setModalSubmitted(false);
        this.setState({ isSubmitting: true });
        const params: any = this.props.match.params;
        const { currentInteraction } = this.props;
        currentInteraction.name = headerFormValues.name;
        BotService.updateInteraction(params.workspaceId, params.botId, {
            ...currentInteraction,
            name: headerFormValues.name,
        })
            .then(() => {
                this.setState({
                    ...this.state,
                    originalNameContainer: currentInteraction.name,
                    hasUnsavedChanges: false,
                });
                timeout(() => {
                    this.setState({ isSubmitting: false });
                    addNotification({
                        message: this.props.getTranslation('Interaction saved!'),
                        title: '',
                        type: 'success',
                        insert: 'top',
                        container: 'top-right',
                        duration: 100,
                    });
                    this.props.setValidateInteraction(cloneDeep(currentInteraction));
                    this.updateTree();
                    this.closeModal();
                }, 100);
            })
            .catch((e) => {
                timeout(() => {
                    this.setState({ isSubmitting: false });
                    addNotification({
                        message: this.props.getTranslation('Sorry we get an error, verify fields and try again!'),
                        title: '',
                        type: 'danger',
                        insert: 'top',
                        container: 'top-right',
                        duration: 500,
                    });
                }, 100);
                this.setState({ isSubmitting: false });
            });
    };

    private getValidationSchema = (): Yup.ObjectSchema<any> => {
        return Yup.object().shape({
            name: Yup.string().required('Required'),
        });
    };

    toggleModalChange = (isOpen) => {
        this.setState({ modalChangeOpen: isOpen });
    };

    closeModal = () => {
        this.props.setCurrentInteraction(undefined);
        this.props.setValidateInteraction(undefined);
        this.updateTree();
    };

    onCloseModal = () => {
        if (this.validResponse() && !this.props.modalInteractionSubmitted) {
            this.closeModal();
        } else {
            this.toggleModalChange(true);
        }
    };

    renderModalChange = () => {
        const { getTranslation } = this.props;

        return (
            <Modal height='150px' width='390px' isOpened={this.state.modalChangeOpen} position={ModalPosition.center}>
                <div className='modal-change-close'>
                    <h5>{getTranslation('Unsaved changes')}</h5>
                    <p>
                        {getTranslation('You have unsaved changes. Are you sure you want to leave')}
                        <span> {getTranslation('without saving')}?</span>
                    </p>
                    <div className='modal-change'>
                        <DiscardBtn onClick={() => this.toggleModalChange(false)} className='modal-confirm-no'>
                            {getTranslation('No')}
                        </DiscardBtn>
                        <DoneBtn
                            onClick={() => {
                                this.closeModal();
                                this.toggleModalChange(false);
                            }}
                            className='modal-confirm-yes'
                        >
                            {getTranslation('Yes')}
                        </DoneBtn>
                    </div>
                </div>
            </Modal>
        );
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

    render() {
        this.onKeyDown();
        return (
            <BlockUi className='ModalContainer' blocking={this.state.isSubmitting}>
                <ClickOutside
                    className='click-outside-container'
                    onClickOutside={(event) => {
                        if (event.target.className !== 'Modal opened') return;
                        this.closeOnClickOutside();
                    }}
                >
                    {this.renderModalChange()}
                    <Formik
                        initialValues={{
                            name: this.props.currentInteraction ? this.props.currentInteraction.name : '',
                        }}
                        onSubmit={(values) => {
                            this.onHeaderSubmit(values);
                        }}
                        validationSchema={this.getValidationSchema}
                        render={({ submitForm, touched, errors, handleChange }) => {
                            return (
                                <ClickOutside
                                    className='click-outside-container'
                                    onClickOutside={this.closeOnClickOutside}
                                >
                                    <Form className='form-container-interaction'>
                                        <div className='row close-container'>
                                            <div className='col-12 close-modal-container'>
                                                <span className='close-modal-item' onClick={this.closeOnClickOutside}>
                                                    x
                                                </span>
                                            </div>
                                        </div>
                                        <div className='row container-container-interaction'>
                                            <div className='col-12'>
                                                <LabelWrapper
                                                    label='Container interaction'
                                                    validate={{
                                                        touched,
                                                        errors,
                                                        fieldName: 'name',
                                                        isSubmitted: true,
                                                    }}
                                                >
                                                    <StyledFormikField
                                                        type='text'
                                                        name={`name`}
                                                        onChange={(event) => {
                                                            handleChange(event);
                                                            this.setState({
                                                                ...this.state,
                                                                originalNameContainer: event.target.value,
                                                            });
                                                        }}
                                                    />
                                                </LabelWrapper>
                                            </div>
                                            <div className='col-12 button-container-channel'>
                                                <ButtonSave className='button-save-channel' onClick={submitForm}>
                                                    Saves
                                                </ButtonSave>
                                            </div>
                                        </div>
                                    </Form>
                                </ClickOutside>
                            );
                        }}
                    />
                </ClickOutside>
            </BlockUi>
        );
    }
}

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
    validateInteraction: state.botReducer.validateInteraction,
    modalInteractionSubmitted: state.botReducer.modalInteractionSubmitted,
});
export const ModalContainer = I18n(
    withRouter(
        connect(mapStateToProps, {
            setCurrentInteraction: BotActions.setCurrentInteraction,
            setValidateInteraction: BotActions.setValidateInteraction,
            setModalSubmitted: BotActions.setModalSubmitted,
            setInteractionList: BotActions.setInteractionList,
        })(ModalContainerClass)
    )
);
