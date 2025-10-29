import { FC } from 'react';
import { Wrapper, Icon } from '../../../../../../ui-kissbot-v2/common';
import { TemplateItemProps } from './props';
import styled from 'styled-components';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import { Tag } from '../../../../../liveAgent/components/TagSelector/props';
import { FiFile } from 'react-icons/fi';
import { TemplateStatus, TemplateType } from '../../../../../liveAgent/components/TemplateMessageList/interface';
import { Row, Tag as TagAntd, Tag as TagElement, Tooltip, Typography } from 'antd';
import { formattingWhatsappText } from '../../../../../../utils/Activity';
import { uniqBy } from 'lodash';

const Item = styled('div')`
    height: 80px;
    background-color: #fff;
    border-bottom: 1px #ced4da solid;
    padding: 5px 15px;
    width: 100%;
    cursor: pointer;

    transition: background-color 0.2s;

    &:hover {
        background-color: #f2f4f8;
    }
`;

const IconFile = styled(FiFile)`
    font-size: 15px;
    margin: 0 5px 0 0;
    color: #696969;
    cursor: pointer;
`;

const TemplateItem: FC<TemplateItemProps & I18nProps> = (props) => {
    const { template, getTranslation, onEditTemplate, workspaceTags } = props;
    const templateTags: Tag[] = workspaceTags.filter((workspaceTag) => {
        return template.tags.find((templateTagId) => templateTagId === workspaceTag._id);
    });

    const configStatus = (status) => {
        switch (status) {
            case TemplateStatus.APPROVED:
                return {
                    title: 'It has channels that the template was approved by Whatsapp',
                    color: 'success',
                    status: 'Approved',
                };
            case TemplateStatus.AWAITING_APPROVAL:
            case TemplateStatus.PENDING:
                return {
                    title: 'There are channels that the template is awaiting approval on Whatsapp',
                    color: 'warning',
                    status: 'Pending',
                };
            case TemplateStatus.REJECTED:
                return {
                    title: 'It has channels that the template was disapproved by Whatsapp',
                    color: 'error',
                    status: 'Rejected',
                };
            case TemplateStatus.DELETED:
                return {
                    title: 'It has channels that the template was deleted in Whatsapp',
                    color: 'error',
                    status: 'Deleted',
                };
            case TemplateStatus.ERROR_ONSUBMIT:
                return {
                    title: 'There are channels that the template has had an error in the submission',
                    color: 'error',
                    status: 'Error',
                };
            case TemplateStatus.DISABLED:
                return {
                    title: 'It has channels that the template was disabled in Whatsapp',
                    color: 'default',
                    status: 'Disabled',
                };

            default:
                return {
                    title: 'An error occurred while submitting the template for some channel',
                    color: 'error',
                    status: 'Disapproved',
                };
        }
    };

    const status =
        template.wabaResult && template.channels?.length
            ? template.channels.map((channel) => {
                  if (template.wabaResult?.[channel] && template.wabaResult?.[channel].status) {
                      return configStatus(template.wabaResult[channel].status?.toLowerCase());
                  }
                  return configStatus('error_onsubmit');
              })
            : [{ title: 'Template information outdated', color: 'default', status: 'Disabled' }];

    let text = template.message;
    if (text.length > 1000) {
        text = text.slice(0, 1000) + '...';
    }

    return (
        <>
            <Item
                id={template._id}
                onAuxClick={() => window.open(`${window.location.origin}/settings/templates/${template._id}`)}
                onClick={() => onEditTemplate(template._id)}
            >
                <Wrapper justifyContent='space-between' flexBox>
                    <Wrapper style={{ maxWidth: '80%' }} fontSize='15px' color='#444' fontWeight='600'>
                        <Row wrap={false}>
                            <Typography.Text style={{ color: '#444' }} ellipsis>{`/${template.name}`}</Typography.Text>
                            {!template.active && (
                                <TagAntd
                                    style={{ marginLeft: 8 }}
                                    title={getTranslation('Template is inactive')}
                                    color='default'
                                >
                                    Inativo
                                </TagAntd>
                            )}
                        </Row>
                    </Wrapper>

                    <Wrapper flexBox alignItems='center'>
                        {template.type === TemplateType.file && (
                            <IconFile title={getTranslation('This message contains file')} />
                        )}

                        {template.isHsm && (
                            <>
                                {!!status?.length ? (
                                    uniqBy(status, 'status')?.map((currStatus, index) => {
                                        return (
                                            <TagElement
                                                key={index}
                                                style={{ margin: '0 5px 0 0' }}
                                                color={currStatus.color}
                                                title={getTranslation(currStatus.title)}
                                            >
                                                {getTranslation(currStatus.status)}
                                            </TagElement>
                                        );
                                    })
                                ) : (
                                    <TagElement
                                        style={{ margin: '0 5px 0 0' }}
                                        color={configStatus(template?.status || TemplateStatus.APPROVED)?.color}
                                        title={getTranslation(
                                            configStatus(template?.status || TemplateStatus.APPROVED)?.title
                                        )}
                                    >
                                        {getTranslation(
                                            configStatus(template?.status || TemplateStatus.APPROVED)?.status
                                        )}
                                    </TagElement>
                                )}

                                <Icon
                                    style={{ margin: '0 5px 0 0' }}
                                    size='18px'
                                    name='whatsapp'
                                    title={getTranslation('Official template')}
                                />
                            </>
                        )}
                    </Wrapper>
                </Wrapper>
                <Tooltip
                    title={formattingWhatsappText(text)}
                    placement='bottomLeft'
                    overlayInnerStyle={{ maxWidth: 600, width: 'max-content', fontSize: 13 }}
                >
                    <Wrapper margin='5px 0 0 0' truncate fontSize='13px' maxHeight='20px' width='auto'>
                        {formattingWhatsappText(template.message)}
                    </Wrapper>
                </Tooltip>
                <Wrapper margin='10px 0 0 0' flexBox alignItems='center' justifyContent='space-between'>
                    <Wrapper flexBox>
                        {templateTags &&
                            templateTags.map((tag) => (
                                <Wrapper
                                    bgcolor={tag.color}
                                    width='29px'
                                    height='6px'
                                    margin='0 8px 0 0'
                                    borderRadius='4px'
                                    title={tag.name}
                                    key={`${tag.name}${template._id}`}
                                />
                            ))}
                    </Wrapper>
                </Wrapper>
            </Item>
        </>
    );
};

export default i18n(TemplateItem) as FC<TemplateItemProps>;
