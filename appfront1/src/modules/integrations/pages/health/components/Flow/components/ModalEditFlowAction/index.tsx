import { useFormik } from 'formik-latest';
import { Entity, FlowAction, FlowActionType } from 'kissbot-core';
import { FC, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { Workspace } from '../../../../../../../../model/Workspace';
import { ModalPortal } from '../../../../../../../../shared/ModalPortal/ModalPortal';
import { ModalPosition } from '../../../../../../../../shared/ModalPortal/ModalPortalProps';
import { DiscardBtn } from '../../../../../../../../shared/StyledForms/DiscardBtn/DiscardBtn';
import { DoneBtn } from '../../../../../../../../shared/StyledForms/DoneBtn/DoneBtn';
import { Wrapper } from '../../../../../../../../ui-kissbot-v2/common';
import { addNotification } from '../../../../../../../../utils/AddNotification';
import { EntityService } from '../../../../../../../entity/services/EntityService';
import i18n from '../../../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../../../i18n/interface/i18n.interface';
import { WorkspaceService } from '../../../../../../../workspace/services/WorkspaceService';
import FlowAttributeCard from './components/FlowAttributeCard';
import FlowGoToCard from './components/FlowGoToCard';
import FlowPostbackCard from './components/FlowPostbackCard';
import { FlowRulesCard } from './components/FlowRulesCard';
import FlowRulesConfirmationCard from './components/FlowRulesConfirmationCard';
import FlowTagCard from './components/FlowTagCard';
import FlowTextCard from './components/FlowTextCard';
import MenuActions from './components/MenuActions';
import { ModalEditFlowActionProps } from './props';
import { ContentFlowActions } from './styles';

const ModalEditFlowAction: FC<ModalEditFlowActionProps & I18nProps> = ({
    getTranslation,
    isOpened,
    onClose,
    flow,
    onActionsChanged,
    workspaceId,
}) => {
    const [bots, setBots] = useState<any[]>([]);
    const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);
    const [entitiesList, setEntitiesList] = useState<Entity[]>([]);
    const [validation, setValidation] = useState([]);

    useEffect(() => {
        getBotsWorkspace();
        getEntities();
        getWorkspaces();
    }, []);

    const getWorkspaces = async () => {
        const workspaces = await WorkspaceService.getWorkspaceList();
        if (workspaces.data) {
            setWorkspaceList(workspaces.data);
        }
    };

    const getBotsWorkspace = async () => {
        const bots = await WorkspaceService.getWorkspaceBots(workspaceId);
        if (bots.data) {
            setBots(bots.data);
        }
    };

    const getEntities = async () => {
        const list = await EntityService.getEntityList(workspaceId);
        setEntitiesList(list.data);
    };

    const validationForm = (values: any) => {
        if (values.length > 0) {
            const validationArray = values.map((action) => {
                const type = action.type;
                const element = action.element;
                if (type === 'tag') {
                    if (element.action === 'add' || element.action === 'remove') {
                        return !(action.element.name === '');
                    } else {
                        return true;
                    }
                } else if (type === 'attribute') {
                    if (element.action === 'add') {
                        return !(
                            element.name === '' ||
                            element.value === '' ||
                            element.type === '' ||
                            element.label === '' ||
                            element.botId === ''
                        );
                    } else if (element.action === 'remove') {
                        return !(element.type === '' || element.botId === '');
                    }
                } else if (type === 'postback') {
                    return !(element.value === '');
                } else if (type === 'goto') {
                    return !(element.botId === '' || element.value === '');
                } else if (type === 'text') {
                    return !(element.text === '');
                } else {
                    return true;
                }
            });
            setValidation(validationArray);

            return !(validationArray.find((e) => e === false) === false);
        } else {
            return true;
        }
    };

    const formik = useFormik({
        initialValues: { ...flow },
        onSubmit: async (values) => {
            try {
                if (validationForm(values.actions)) {
                    await onActionsChanged(values._id as string, values.actions as FlowAction[]);
                    onClose();
                } else {
                    return;
                }
            } catch (error) {
                console.error('Error while saving:', error);
                addNotification({
                    message: getTranslation('Sorry we get an error, verify fields and try again'),
                    title: '',
                    type: 'danger',
                    duration: 4000,
                });
            }
        },
    });

    useEffect(() => {
        scrollBottom();
    }, [formik.values.actions?.length]);

    const scrollBottom = () => {
        let objDiv: any = document.getElementById('formFlow');
        objDiv.scrollTop = objDiv.scrollHeight;
    };

    return (
        <ModalPortal
            isOpened={isOpened}
            position={ModalPosition.center}
            // onClickOutside={() => onCancel()}
            width='700px'
            height='90vh'
            maxHeight='700px'
            minHeight='500px'
        >
            <ContentFlowActions>
                <form
                    style={{
                        display: 'flex',
                        height: '100%',
                    }}
                >
                    <MenuActions formik={formik} workspaceId={workspaceId} />
                    <Wrapper height='100%' width='620px' overflowY='auto' id={'formFlow'}>
                        {formik.values.actions && formik.values.actions.length > 0 ? (
                            formik.values.actions.map((action, index, array) => {
                                return action.type === FlowActionType.tag ? (
                                    <FlowTagCard
                                        key={`tag:${index}`}
                                        onDeleteAction={(actions) => {
                                            formik.setFieldValue(`actions`, actions);
                                        }}
                                        values={formik.values.actions}
                                        touched={formik.touched}
                                        errors={formik.errors}
                                        isSubmitted={formik.isSubmitting}
                                        setFieldValue={formik.setFieldValue}
                                        index={index}
                                        validation={validation}
                                    />
                                ) : action.type === FlowActionType.attribute ? (
                                    <FlowAttributeCard
                                        key={`attribute:${index}`}
                                        onDeleteAction={(actions) => {
                                            formik.setFieldValue(`actions`, actions);
                                        }}
                                        values={formik.values.actions}
                                        touched={formik.touched}
                                        errors={formik.errors}
                                        isSubmitted={formik.isSubmitting}
                                        setFieldValue={formik.setFieldValue}
                                        index={index}
                                        workspaceId={workspaceId}
                                        bots={bots}
                                        entitiesList={entitiesList}
                                        validation={validation}
                                    />
                                ) : action.type === FlowActionType.postback ? (
                                    <FlowPostbackCard
                                        key={`postback:${index}`}
                                        onDeleteAction={(actions) => {
                                            formik.setFieldValue(`actions`, actions);
                                        }}
                                        values={formik.values.actions}
                                        touched={formik.touched}
                                        errors={formik.errors}
                                        isSubmitted={formik.isSubmitting}
                                        setFieldValue={formik.setFieldValue}
                                        index={index}
                                        validation={validation}
                                    />
                                ) : action.type === FlowActionType.goto ? (
                                    <FlowGoToCard
                                        key={`goto:${index}`}
                                        onDeleteAction={(actions) => {
                                            formik.setFieldValue(`actions`, actions);
                                        }}
                                        values={formik.values.actions}
                                        touched={formik.touched}
                                        errors={formik.errors}
                                        isSubmitted={formik.isSubmitting}
                                        setFieldValue={formik.setFieldValue}
                                        index={index}
                                        workspaceList={workspaceList}
                                        workspaceId={workspaceId}
                                        validation={validation}
                                    />
                                ) : action.type === FlowActionType.text ? (
                                    <FlowTextCard
                                        key={`text:${index}`}
                                        onDeleteAction={(actions) => {
                                            formik.setFieldValue(`actions`, actions);
                                        }}
                                        values={formik.values.actions}
                                        touched={formik.touched}
                                        errors={formik.errors}
                                        isSubmitted={formik.isSubmitting}
                                        setFieldValue={formik.setFieldValue}
                                        index={index}
                                        validation={validation}
                                    />
                                ) : action.type === FlowActionType.rules ? (
                                    <FlowRulesCard
                                        key={`text:${index}`}
                                        onDeleteAction={(actions) => {
                                            formik.setFieldValue(`actions`, actions);
                                        }}
                                        values={formik.values.actions}
                                        touched={formik.touched}
                                        errors={formik.errors}
                                        isSubmitted={formik.isSubmitting}
                                        setFieldValue={formik.setFieldValue}
                                        index={index}
                                        workspaceId={workspaceId}
                                        validation={validation}
                                        bots={bots}
                                    />
                                ) : (
                                    action.type === FlowActionType.rulesConfirmation && (
                                        <FlowRulesConfirmationCard
                                            key={`text:${index}`}
                                            onDeleteAction={(actions) => {
                                                formik.setFieldValue(`actions`, actions);
                                            }}
                                            values={formik.values.actions}
                                            touched={formik.touched}
                                            errors={formik.errors}
                                            isSubmitted={formik.isSubmitting}
                                            setFieldValue={formik.setFieldValue}
                                            index={index}
                                            workspaceId={workspaceId}
                                            validation={validation}
                                            bots={bots}
                                        />
                                    )
                                );
                            })
                        ) : (
                            <Wrapper margin='20%'>{getTranslation('There are no actions, select one to add!')}</Wrapper>
                        )}
                    </Wrapper>
                </form>
                <Wrapper
                    flexBox
                    padding='7px'
                    margin='-3px 0 0 0'
                    borderRadius='0 0 5px 5px'
                    bgcolor='#f2f4f8'
                    justifyContent='flex-end'
                >
                    <DiscardBtn
                        style={{ marginRight: '10px' }}
                        onClick={() => {
                            formik.resetForm();
                            onClose();
                        }}
                    >
                        {getTranslation('Cancel')}
                    </DiscardBtn>
                    <DoneBtn
                        onClick={() => {
                            formik.handleSubmit();
                        }}
                    >
                        {getTranslation('Save')}
                    </DoneBtn>
                </Wrapper>
            </ContentFlowActions>
        </ModalPortal>
    );
};

const mapStateToProps = (state: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
});

export default i18n(connect(mapStateToProps)(ModalEditFlowAction)) as FC<ModalEditFlowActionProps>;
