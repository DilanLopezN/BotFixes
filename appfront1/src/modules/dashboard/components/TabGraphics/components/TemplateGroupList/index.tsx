import { Dropdown, Menu, MenuProps } from 'antd';
import { User } from 'kissbot-core';
import { FC, useState } from 'react';
import { Workspace } from '../../../../../../model/Workspace';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { isAnySystemAdmin } from '../../../../../../utils/UserPermission';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { DashboardService } from '../../../../services/DashboardService';
import { ConversationTemplate, TemplateGroupInterface } from '../../interfaces/conversation-template-interface';
import { CardTemplateGroup, OptionsCol, OptionsIcon, PrivateIcon, PublicIcon, WrapperName, Content } from './style';
import { Tabs } from 'antd';
import { ModalConfirm } from '../../../../../../shared/ModalConfirm/ModalConfirm';

const { TabPane } = Tabs;

interface TemplateGroupListProps {
    templateGroups: TemplateGroupInterface[];
    dashboardSelected?: TemplateGroupInterface;
    setDashboardSelected: (value?: TemplateGroupInterface) => void;
    loggedUser: User;
    setTemplateGroup: (value) => void;
    selectedWorkspace: Workspace;
    getTemplateGroups: Function;
    conversationTemplates: ConversationTemplate[];
    children?: React.ReactNode;
}

const TemplateGroupList: FC<TemplateGroupListProps & I18nProps> = ({
    getTranslation,
    templateGroups,
    dashboardSelected,
    setDashboardSelected,
    loggedUser,
    setTemplateGroup,
    selectedWorkspace,
    getTemplateGroups,
    children,
    conversationTemplates,
}) => {
    const [menuClick, setMenuClick] = useState<TemplateGroupInterface | undefined>(undefined);
    const [deleteTemplateGroup, setDeleteTemplateGroup] = useState<boolean>(false);

    const deleteTemplateGroupById = async () => {
        try {
            if (!menuClick?._id) return;

            const response = await DashboardService.deleteTemplateGroupById(selectedWorkspace._id, menuClick?._id);
            if (response) {
                getTemplateGroups();
            }
        } catch (e) {
            console.log('error on load TemplateGroups', e);
        }
    };

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: getTranslation('Edit'),
            onClick: () => setTemplateGroup(menuClick),
        },
        {
            key: '2',
            label: getTranslation('Delete'),
            onClick: () => setDeleteTemplateGroup(true),
        },
    ];

    return (
        <Content>
            <ModalConfirm
                isOpened={deleteTemplateGroup}
                onAction={(action: any) => {
                    if (action) {
                        deleteTemplateGroupById();
                    }
                    setDeleteTemplateGroup(false);
                }}
            >
                <h5 style={{ textAlign: 'center' }}>{getTranslation('Confirm delete')}</h5>
                <p style={{ margin: '10px 0px 17px' }}>
                    {getTranslation('Are you sure you want to delete the Dashboard?')}
                </p>
            </ModalConfirm>

            <Tabs
                defaultActiveKey={templateGroups[0]?._id}
                type={'card'}
                animated
                size='small'
                style={{ width: '100%' }}
                onChange={(event) => {
                    const tab = templateGroups.find((templateGroup) => templateGroup._id === event);

                    if (tab) {
                        setDashboardSelected(tab);
                    }
                }}
            >
                {templateGroups.map((templateGroup) => {
                    return (
                        <TabPane
                            forceRender
                            tab={
                                <CardTemplateGroup
                                    title={templateGroup.name}
                                    onClick={() => setDashboardSelected(templateGroup)}
                                >
                                    <Wrapper flexBox alignItems='center'>
                                        <Wrapper>
                                            {templateGroup.shared ? (
                                                <Wrapper flexBox alignItems='center' title={getTranslation('Public')}>
                                                    <PublicIcon />
                                                </Wrapper>
                                            ) : (
                                                <Wrapper flexBox alignItems='center' title={getTranslation('Private')}>
                                                    <PrivateIcon />
                                                </Wrapper>
                                            )}
                                        </Wrapper>
                                        <WrapperName selected={templateGroup._id === dashboardSelected?._id}>
                                            {templateGroup.name}
                                        </WrapperName>
                                        {templateGroup.globalEditable ||
                                        isAnySystemAdmin(loggedUser) ||
                                        templateGroup.ownerId === loggedUser._id ? (
                                            <OptionsCol>
                                                <Dropdown menu={{ items }} placement='bottomLeft' trigger={['click']}>
                                                    <OptionsIcon onClick={() => setMenuClick(templateGroup)} />
                                                </Dropdown>
                                            </OptionsCol>
                                        ) : null}
                                    </Wrapper>
                                </CardTemplateGroup>
                            }
                            key={templateGroup?._id}
                        >
                            {conversationTemplates[0]?.groupId === templateGroup?._id ? (
                                children
                            ) : (
                                <div
                                    style={{
                                        width: '100%',
                                        height: '400px',
                                        background: '#fff',
                                        marginTop: '-16px',
                                    }}
                                />
                            )}
                        </TabPane>
                    );
                })}
            </Tabs>
        </Content>
    );
};

export default i18n(TemplateGroupList) as FC<TemplateGroupListProps>;
