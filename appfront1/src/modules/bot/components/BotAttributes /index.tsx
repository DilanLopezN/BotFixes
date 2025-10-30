import React, { FC, useState, useEffect } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import { BotAttributesProps } from './props';
import { BotService } from '../../services/BotService';
import { withRouter } from 'react-router-dom';
import { BotAttribute } from '../../../../model/BotAttribute';
import I18n from '../../../i18n/components/i18n';
import Loader from '../../../../shared/loader';
import { Modal } from '../../../../shared/Modal/Modal';
import { ModalPosition } from '../../../../shared/Modal/ModalProps';
import BotAttributeEdit from '../BotAttributeEdit';
import { connect } from 'react-redux';
import { BotActions } from '../../redux/actions';
import cloneDeep from 'lodash/cloneDeep';
import { ModalInteraction } from '../ModalInteraction/ModalInteraction/ModalInteraction';
import { searchResult } from '../../../../utils/SearchResult';
import { addNotification } from '../../../../utils/AddNotification';
import { Table, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

const BotAttributesCopy: FC<BotAttributesProps> = (props) => {
    const [botAttributes, setBotAttributes] = useState<BotAttribute[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [viewBotAttribute, setViewBotAttribute] = useState<BotAttribute | undefined>(undefined);
    const [botAttributesList, setBotAttributesList] = useState<BotAttribute[]>([]);

    const {
        getTranslation,
        match,
        setCurrentInteraction,
        setValidateInteraction,
        currentInteraction,
        validateInteraction,
        search,
    } = props;

    const { workspaceId, botId } = match.params;
    useEffect(() => {
        setLoading(true);
        getBotAttributes();
    }, []);

    const getBotAttributes = async () => {
        const attrs = await BotService.getBotAttributes(workspaceId, botId);

        if (attrs.data) {
            setBotAttributesList([...attrs.data].filter((attr) => !!attr._id));
            setBotAttributes([...attrs.data]);
            setLoading(false);
        }
    };

    const handleDelete = async (botAttribute: BotAttribute) => {
        let error: any;

        if (!botAttribute._id) return;

        const deleted = await BotService.deleteBotAttribute(workspaceId, botId, botAttribute._id, (err) => {
            error = err;
        });

        if (deleted.response && deleted.response.error === 'CANNOT_DELETE_ATTRIBUTE_IN_USE')
            return addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error'),
                message: getTranslation('It is not possible to remove an attribute in use'),
            });

        if (error || !deleted.deleted)
            return addNotification({
                type: 'warning',
                duration: 3000,
                title: getTranslation('Error. Try again'),
                message: getTranslation('Error. Try again'),
            });

        if (deleted && deleted.deleted) {
            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Successfully deleted'),
                message: getTranslation('Successfully deleted'),
            });

            setViewBotAttribute(undefined);
            setBotAttributes(botAttributes.filter((attr) => attr._id != botAttribute._id));
        }
    };

    const handleEdit = async (newBotAttribute: BotAttribute) => {
        if (!newBotAttribute._id) return;

        const updated = await BotService.updateBotAttribute(workspaceId, botId, newBotAttribute._id, newBotAttribute);

        if (updated && updated._id) {
            const attrIndex = botAttributes.findIndex((attr) => attr._id === newBotAttribute._id);
            botAttributes[attrIndex] = { ...updated };

            setBotAttributes(botAttributes);

            addNotification({
                type: 'success',
                duration: 3000,
                title: getTranslation('Successfully edited'),
                message: getTranslation('Successfully edited'),
            });
            getBotAttributes();
            return setViewBotAttribute(undefined);
        }

        return addNotification({
            type: 'warning',
            duration: 3000,
            title: getTranslation('Error. Try again'),
            message: getTranslation('Error. Try again'),
        });
    };

    const handleEditRequest = (botAttribute?: any) => {
        setViewBotAttribute(botAttribute);
    };

    const openInteraction = async (interactionId: string) => {
        const interaction = await BotService.getInteraction(workspaceId, botId, interactionId);
        if (!interaction) return null;
        setViewBotAttribute(undefined);

        setCurrentInteraction(interaction);
        setValidateInteraction(cloneDeep(interaction));
    };

    const validBotAttributes = () => {
        return botAttributes.filter((attr) => !!attr._id);
    };

    useEffect(() => {
        if (!currentInteraction && !validateInteraction) getBotAttributes();
    }, [currentInteraction, validateInteraction]);

    useEffect(() => {
        setBotAttributesList(searchResult(search, validBotAttributes(), 'name'));
    }, [search]);

    const columns: ColumnsType<BotAttribute> = [
        {
            title: getTranslation('Name'),
            dataIndex: 'name',
            key: 'name',
            render: (_, record) => <a>{record.name}</a>,
        },
        {
            title:'Label',
            dataIndex: 'label',
            key: 'label',
            render: (_, record) => <a>{record.label}</a>,
        },
        {
            title: getTranslation('Type'),
            dataIndex: 'type',
            key: 'type',
            render: (_, record) => <a>{record.type}</a>,
        },
        {
            title: getTranslation('Actions'),
            key: 'action',
            render: (_, record) => (
                    <Space size='middle'>
                        <a onClick={() => handleEditRequest(record)}>{getTranslation('Edit')}</a>
                        <a onClick={() => handleDelete(record)}>{getTranslation('Delete')}</a>
                    </Space>
            ),
            width:150
        },
    ];

    return (
        <Wrapper>
            <Modal
                position={ModalPosition.right}
                width={'700px'}
                height={'100%'}
                isOpened={!!currentInteraction && !!validateInteraction}
            >
                {!!currentInteraction && !!validateInteraction ? <ModalInteraction preview /> : null}
            </Modal>

            {viewBotAttribute && (
                <Wrapper>
                    <Modal
                        height='auto'
                        width='350px'
                        className='confirmationModal'
                        isOpened={!!viewBotAttribute}
                        position={ModalPosition.center}
                        onClickOutside={() => setViewBotAttribute(undefined)}
                    >
                        <BotAttributeEdit
                            botAttribute={viewBotAttribute}
                            onSave={handleEdit}
                            onDelete={(botAttribute: BotAttribute) => handleDelete(botAttribute)}
                            openInteraction={openInteraction}
                            addNotification={addNotification}
                            onCancel={() => setViewBotAttribute(undefined)}
                        />
                    </Modal>
                </Wrapper>
            )}
            {loading ? (
                <Loader />
            ) : (
                <Wrapper>
                    <div>
                        <Table columns={columns} dataSource={botAttributesList}></Table>
                    </div>
                </Wrapper>
            )}
        </Wrapper>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    selectedWorkspace: state.workspaceReducer.selectedWorkspace,
    currentInteraction: state.botReducer.currentInteraction,
    validateInteraction: state.botReducer.validateInteraction,
});

export default I18n(
    withRouter(
        connect(mapStateToProps, {
            setCurrentInteraction: BotActions.setCurrentInteraction,
            setValidateInteraction: BotActions.setValidateInteraction,
            setCurrentBot: BotActions.setCurrentBot,
        })(BotAttributesCopy)
    )
);
