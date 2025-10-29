import { FC, useEffect, useState } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { TemplateListProps } from './props';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import styled from 'styled-components';
import { Tag } from '../../../../../liveAgent/components/TagSelector/props';
import { WorkspaceService } from '../../../../../workspace/services/WorkspaceService';
import TemplateItem from '../TemplateItem';
import SkeletonLines from '../../../../../../shared/skeleton-lines';
import { ChannelConfig } from '../../../../../../model/Bot';
import { ChannelConfigService } from '../../../../../newChannelConfig/service/ChannelConfigService';

const EmptyImage = styled('img')`
    height: 125px;
`;

const TemplateList: FC<TemplateListProps & I18nProps> = (props) => {
    const { templates, workspaceId, onEditTemplate, loading, getTranslation, loadingMore, user } = props;

    const [workspaceTags, setWorkspaceTags] = useState<Tag[]>([]);
    const [workspaceChannelConfigs, setWorkspaceChannelConfigs] = useState<ChannelConfig[]>([]);

    useEffect(() => {
        getWorkspaceTags();
        getWorkspaceChannels();
    }, []);

    const getWorkspaceTags = async () => {
        const response = await WorkspaceService.workspaceTags(workspaceId);

        if (response?.data?.length) {
            setWorkspaceTags(response.data);
        }
    };

    const getWorkspaceChannels = async () => {
        const filter = {
            workspaceId,
            enable: true,
        };
        const data = await ChannelConfigService.getChannelsConfig(filter);
        setWorkspaceChannelConfigs(data || []);
    };

    const getFilteredTemplates = () => {
        if (!workspaceChannelConfigs.length) {
            return templates;
        }

        return templates.map((template) => {
            if (!template.channels || template.channels.length === 0) {
                return template;
            }

            const activeChannels = template.channels.filter((channelId) => {
                return workspaceChannelConfigs.some((config) => config._id === channelId && config.enable === true);
            });

            const filteredWabaResult = {};
            if (template.wabaResult) {
                activeChannels.forEach((channelId) => {
                    if (template.wabaResult?.[channelId]) {
                        filteredWabaResult[channelId] = template.wabaResult[channelId];
                    }
                });
            }

            return {
                ...template,
                channels: activeChannels,
                wabaResult: filteredWabaResult,
            };
        });
    };
    const filteredTemplates = getFilteredTemplates();

    return (
        <Wrapper margin='-30px 0 0 0'>
            {loading ? (
                <SkeletonLines
                    rows={2}
                    style={{
                        borderRadius: '6px',
                        padding: '5px 15px',
                        margin: '0 0 3px 0',
                        height: '70px',
                    }}
                />
            ) : filteredTemplates && filteredTemplates.length > 0 ? (
                <>
                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            background: '#fff',
                            border: '1px solid #CED4DA',
                            borderBottom: 'none',
                            borderRadius: '5px',
                        }}
                    >
                        <Wrapper
                            borderRadius='5px 5px 0 0'
                            borderBottom='1px #CED4DA solid'
                            bgcolor='#f2f2f2'
                            width='100%'
                            minWidth='320px'
                            height='45px'
                            color='#555'
                            fontSize='large'
                            padding='10px'
                        >
                            {getTranslation('Template')}
                        </Wrapper>
                        {filteredTemplates.map((template) => {
                            return (
                                <TemplateItem
                                    workspaceTags={workspaceTags}
                                    key={template._id}
                                    template={template}
                                    onEditTemplate={onEditTemplate}
                                    user={user}
                                    workspaceId={workspaceId}
                                />
                            );
                        })}
                    </div>
                    <div id='template-list-area' />
                    {loadingMore && (
                        <SkeletonLines
                            rows={2}
                            style={{
                                borderRadius: '6px',
                                padding: '5px 15px',
                                margin: '0 0 3px 0',
                                height: '70px',
                            }}
                        />
                    )}
                </>
            ) : (
                <Wrapper height='150px' flexBox margin='30px 0 0 0' justifyContent='center' alignItems='center'>
                    <Wrapper>
                        <Wrapper flexBox justifyContent='center'>
                            <EmptyImage src='/assets/img/empty_draw.svg' />
                        </Wrapper>
                        <Wrapper fontSize='13px' margin='15px 0 0 0'>
                            {getTranslation('No templates found')}
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
            )}
        </Wrapper>
    );
};

export default i18n(TemplateList) as FC<TemplateListProps>;
