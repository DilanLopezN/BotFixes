import { Badge, Col, Row, Space, Tabs } from 'antd';
import { IComment } from 'kissbot-core';
import moment from 'moment';
import { FC, useContext, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { InteractionType } from '../../../../../model/Interaction';
import { interactionSelector } from '../../../../../utils/InteractionSelector';
import I18n from '../../../../i18n/components/i18n';
import { DisabledTypeContext } from '../../../contexts/disabledFieldsContext';
import { TABS } from '../ModalInteraction/tabs.enum';
import { InteractionTabsProps, Tab } from './interfaces';
import { StyledContainer, UpdateInfo } from './styles';
const InteractionTabs: FC<InteractionTabsProps> = ({
    onSelectTab,
    currentInteraction,
    unchangedInteraction,
    preview,
    getTranslation,
}) => {
    const [selectedTab, setSelectedTab] = useState(preview ? TABS.USER_SAYS : TABS.BOT_RESPONSES);
    const [interactionComments, setInteractionComments] = useState<IComment[]>([]);
    const { disabledFields } = useContext(DisabledTypeContext);
    const shouldHideUserSaysTab = useMemo(() => {
        return (
            currentInteraction &&
            (currentInteraction.type === InteractionType.fallback ||
                currentInteraction.type === InteractionType.contextFallback)
        );
    }, [currentInteraction]);

    const onSelectTabHandler = (tab: TABS) => {
        setSelectedTab(tab);
        onSelectTab(tab);
    };

    const renderLastUpdateInfo = () => {
        if (!currentInteraction) return null;

        const interaction = interactionSelector(!disabledFields, unchangedInteraction!, currentInteraction);

        return (
            <>
                <UpdateInfo>
                    {`Atualizado em ${moment(interaction?.lastUpdateBy?.updatedAt).format('DD/MM/YY - HH:MM')}`}
                </UpdateInfo>
                <UpdateInfo>
                    {disabledFields ? (
                        <div className='blue'>{getTranslation('Versão publicada')}</div>
                    ) : (
                        !!unchangedInteraction && <div className='green'>{getTranslation('Versão atual')}</div>
                    )}
                </UpdateInfo>
            </>
        );
    };

    const items: Tab[] = useMemo(() => {
        const filteredTabs = [
            {
                label: getTranslation('Bot responses'),
                key: TABS.BOT_RESPONSES,
            },
            {
                label: getTranslation('Advanced'),
                key: TABS.ADVANCED,
            },
            {
                label: getTranslation('Comments'),
                key: TABS.COMMENTS,
            },
        ];
        if (!shouldHideUserSaysTab) {
            filteredTabs.unshift({
                label: getTranslation('User says'),
                key: TABS.USER_SAYS,
            });
        }
        return filteredTabs;
    }, [getTranslation, shouldHideUserSaysTab]);

    useEffect(() => {
        if (currentInteraction) {
            setInteractionComments(currentInteraction.comments || []);
        }
    }, [currentInteraction]);

    return (
        <StyledContainer>
            {currentInteraction && (
                <Space direction='horizontal' size={'small'}>
                    <Row gutter={[84, 24]} align={'stretch'}>
                        <Col>
                            <Badge
                                className='antd-span-default-color'
                                count={interactionComments.length}
                                color='blue'
                                size='small'
                            >
                                <Tabs
                                    activeKey={selectedTab.toString()}
                                    onChange={(tabKey: string) => onSelectTabHandler(tabKey as TABS)}
                                    items={items}
                                />
                            </Badge>
                        </Col>
                        <Col>{renderLastUpdateInfo()}</Col>
                    </Row>
                </Space>
            )}
        </StyledContainer>
    );
};

const mapStateToProps = (state: any, ownProps: any) => ({
    currentInteraction: state.botReducer.currentInteraction,
    unchangedInteraction: state.botReducer.unchangedInteraction,
});

export default I18n(withRouter(connect(mapStateToProps, null)(InteractionTabs)));
