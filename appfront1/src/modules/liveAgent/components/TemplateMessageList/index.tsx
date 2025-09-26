import { FC, useState, useEffect, useRef } from 'react';
import { TemplateMessageListProps } from './props';
import { Wrapper, Icon, PlainWrapper } from '../../../../ui-kissbot-v2/common';
import { TemplateMessage, TemplateType } from './interface';
import { WorkspaceService } from '../../../workspace/services/WorkspaceService';
import Popover from 'react-popover';
import ClickOutside from 'react-click-outside';
import { getColor, ColorType } from '../../../../ui-kissbot-v2/theme';
import orderBy from 'lodash/orderBy';
import { Skeleton } from 'antd';
import i18n from '../../../i18n/components/i18n';
import { I18nProps } from '../../../i18n/interface/i18n.interface';
import { Tag } from '../TagSelector/props';
import { EmptyImage, IconFile, Scroll, TemplateItem } from './styled';
import { timeout } from '../../../../utils/Timer';

export const TEMPLATE_ITEM_HEIGHT = 73;

const scrollTo = (element: any, to: number, duration: number) => {
    let start = element.scrollTop,
        change = to - start,
        currentTime = 0,
        increment = 20;

    const animateScroll = () => {
        currentTime += increment;
        var val = easeInOutQuad(currentTime, start, change, duration);
        element.scrollTop = val;
        if (currentTime < duration) {
            timeout(animateScroll, increment);
        }
    };

    animateScroll();
};

const easeInOutQuad = (t: number, b: number, c: number, d: number) => {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
};

const TemplateMessageList: FC<TemplateMessageListProps & I18nProps> = ({
    workspaceId,
    onChange,
    opened,
    onClose,
    hsmFilter,
    textFilter,
    getTranslation,
    channelId,
    canSendOfficialTemplate,
    typeMessage,
}) => {
    const [templates, setTemplates] = useState<TemplateMessage[] | undefined>(undefined);
    const [templatesPersist, setTemplatesPersist] = useState<TemplateMessage[] | undefined>(undefined);
    const [templateSelected, setTemplateSelected] = useState<TemplateMessage | undefined>(undefined);
    const [maxWidth, setMaxWidth] = useState(530);
    const [workspaceTags, setWorkspaceTags] = useState<Tag[]>([]);

    const templateSelectedRef: any = useRef(null);
    templateSelectedRef.current = {
        templateSelected,
        setTemplateSelected,
    };

    const templatesRef: any = useRef(null);
    templatesRef.current = {
        templates,
        setTemplates,
    };

    const getWorkspaceTags = async () => {
        if (!workspaceId) return;

        const response = await WorkspaceService.workspaceTags(workspaceId);
        setWorkspaceTags(response?.data || []);
    };

    useEffect(() => {
        if (!opened) {
            return;
        }

        getWorkspaceTags();
        setTemplatesPersist([]);
        setTemplates([]);

        getTemplates();
        handleCustomEvents();

        return () => {
            window.removeEventListener('@template_enter', handler_selectTemplate);
            window.removeEventListener('@template_move', handler_moveTemplate);
        };
    }, [opened]);

    useEffect(() => {
        if (!opened) {
            return;
        }
        filterTemplates();
    }, [textFilter]);

    const filterTemplates = () => {
        const text = textFilter.substring(1);
        const { setTemplates } = templatesRef.current;

        if (!text) {
            setTemplateSelected(templatesPersist?.[0]);
            return setTemplates(templatesPersist);
        }

        let filteredTemplates: TemplateMessage[] = [];

        if (templatesPersist) {
            const formattedText = text.toLowerCase();
            const matchedByName: TemplateMessage[] = [];
            const matchedByMessage: any = new Set();
            
            templatesPersist.forEach((temp) => {
                const nameMatches = temp.name.toLowerCase().includes(formattedText);
                const messageMatches = temp.message.toLowerCase().includes(formattedText);
                
                if (nameMatches) {
                    matchedByName.push(temp);
                } else if (messageMatches) {
                    matchedByMessage.add(temp);
                }
            });

            filteredTemplates = [...matchedByName, ...matchedByMessage];
        }

        setTemplates(filteredTemplates);

        if (filterTemplates?.length === 0) {
            setTemplateSelected(undefined);
        }

        if (filteredTemplates && filteredTemplates.length > 0) {
            const { setTemplateSelected } = templateSelectedRef.current;
            setTemplateSelected(filteredTemplates[0]);
        }
    };

    useEffect(() => {
        opened && setTemplates(templatesPersist);
    }, [opened]);

    const getTemplates = async () => {
        let filter: { [key: string]: any } = {};

        if (canSendOfficialTemplate) {
            if (hsmFilter) {
                filter.isHsm = true;
            }
        } else {
            filter.isHsm = false;
        }

        if (typeMessage) {
            filter.type = { $not: { $eq: TemplateType.file } };
        }

        filter = {
            ...filter,
            $or: [
                {
                    active: true,
                },
                {
                    active: { $exists: false },
                },
            ],
        };

        const query: any = {
            skip: 0,
            filter,
            custom: {},
        };

        // filtra templates pelo canal da conversa
        if (!!channelId) {
            query.custom.channel = channelId;
        }

        const response = await WorkspaceService.getTemplates(query, workspaceId);

        const { setTemplates } = templatesRef.current;
        const { setTemplateSelected } = templateSelectedRef.current;

        const orderedTemplates = orderBy(response?.data ?? [], 'name', 'asc');
        const filteredTemplates = hsmFilter
            ? orderedTemplates.filter((template: TemplateMessage) => {
                  if (template.isHsm) {
                      return template;
                  }
              })
            : orderedTemplates;

        setTemplateSelected(filteredTemplates[0]);
        setTemplates(filteredTemplates || []);
        setTemplatesPersist(filteredTemplates || []);
    };

    const handleCustomEvents = () => {
        window.addEventListener('@template_enter', handler_selectTemplate);
        window.addEventListener('@template_move', handler_moveTemplate);
    };

    const handler_selectTemplate = () => {
        const { templateSelected } = templateSelectedRef.current;
        onChange(templateSelected);

        timeout(onClose, 50);
    };

    const handler_moveTemplate = (ev: any) => {
        const position = ev.detail.move;
        move(position);
    };

    const move = (pos: number) => {
        const { templateSelected, setTemplateSelected } = templateSelectedRef.current;
        const { templates = [] } = templatesRef.current;

        if (templates) {
            const currentIndex = templates.findIndex((template) => template._id === templateSelected?._id);
            let nextIndex = currentIndex + pos;

            if (nextIndex === -1) {
                nextIndex = templates.length - 1;
            }

            if (nextIndex + 1 > templates.length) {
                nextIndex = 0;
            }

            setTemplateSelected(templates[nextIndex]);

            const scrollArea = document.getElementById('templateMessageScrollArea');
            if (!scrollArea) return;

            scrollTo(scrollArea, nextIndex * TEMPLATE_ITEM_HEIGHT, 170);
        }
    };

    const isTemplateSelected = (currTemplateId: string) => {
        const { templateSelected } = templateSelectedRef.current;
        return templateSelected && templateSelected._id === currTemplateId;
    };

    useEffect(() => {
        const chatContainer = document.getElementById('container-chat');

        if (!!chatContainer) {
            setMaxWidth(chatContainer.offsetWidth - 20);
        }
    }, [opened]);

    return (
        <Popover
            isOpen={opened}
            body={
                <ClickOutside
                    onClickOutside={(e: any) => {
                        if (e.target.id !== 'chatContainerTextInput') {
                            onClose();
                        }
                    }}
                >
                    <Wrapper
                        outline='none'
                        tabIndex={100}
                        id='templateMessage'
                        boxShadow='rgba(71, 88, 114, 0.08) 0px 2px 2px'
                        borderRadius='6px'
                        padding='10px 4px'
                        minWidth='440px'
                        width={`${maxWidth}px`}
                        maxWidth='560px'
                        bgcolor='#FFF'
                    >
                        <Wrapper padding='0 10px 10px 10px' flexBox alignItems='center' fontSize='13px'>
                            <Icon name='text-box' size='19px' margin='0 6px 0 0' />
                            {getTranslation('Template messages')}
                        </Wrapper>
                        <Scroll
                            id='templateMessageScrollArea'
                            maxHeight={`${TEMPLATE_ITEM_HEIGHT * 3}px`}
                            minHeight={`${TEMPLATE_ITEM_HEIGHT * 2}px`}
                            overflowY='auto'
                        >
                            {!templates &&
                                new Array(4).fill(0).map((_, i) => {
                                    return (
                                        <TemplateItem size={TEMPLATE_ITEM_HEIGHT} key={i}>
                                            <Skeleton active={true} title={false} paragraph={{ rows: 2 }} />
                                        </TemplateItem>
                                    );
                                })}
                            {templates && templates.length > 0 ? (
                                templates.map((template: TemplateMessage) => {
                                    const templateTags: Tag[] = workspaceTags.filter((workspaceTag) => {
                                        return template.tags.find(
                                            (templateTagId) => templateTagId === workspaceTag._id
                                        );
                                    });

                                    return (
                                        <PlainWrapper key={template._id}>
                                            <TemplateItem
                                                size={TEMPLATE_ITEM_HEIGHT}
                                                id={
                                                    isTemplateSelected(template._id || '')
                                                        ? 'templateMessageSelected'
                                                        : undefined
                                                }
                                                onClick={(e: any) => {
                                                    e.preventDefault();
                                                    setTemplateSelected(template);
                                                    onChange(template);
                                                    onClose();
                                                }}
                                                bgcolor={
                                                    isTemplateSelected(template._id || '')
                                                        ? getColor(ColorType.laSelected)
                                                        : '#fff'
                                                }
                                            >
                                                <Wrapper flexBox flexDirection='column' width='93%'>
                                                    <Wrapper color='#555' fontWeight='600' truncate fontSize='14px'>
                                                        {`/ ${template.name}`}
                                                    </Wrapper>
                                                    <Wrapper truncate fontSize='13px' padding='2px 0 0 3px'>
                                                        {template.message}
                                                    </Wrapper>
                                                    <Wrapper padding='0 3px' height='6px' margin='5px 0 0 0' justifyContent='flex-start' flexBox>
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
                                                <Wrapper
                                                    flexBox
                                                    flexDirection='row'
                                                    alignItems='center'
                                                    justifyContent='flex-end'
                                                    width='7%'
                                                >
                                                    {/* <Wrapper fontSize='13px'>{`${getTranslation('Editable')}`}</Wrapper> */}
                                                    <Wrapper flexBox justifyContent='center' fontSize='16px' alignItems='center'>
                                                        {template.type === TemplateType.file && (
                                                            <IconFile
                                                                title={getTranslation('This message contains file')}
                                                            />
                                                        )}
                                                        {template.isHsm && (
                                                            <Icon
                                                                style={{ margin: '0 0 0 5px' }}
                                                                size='16px'
                                                                name='whatsapp'
                                                                title={getTranslation('Official template')}
                                                            />
                                                        )}
                                                    </Wrapper>
                                                    <Wrapper display='flex' textAlign='center'  justifyContent='center' color='#444' fontSize='16px'>
                                                        {template.canEdit ? (
                                                            <Icon
                                                                style={{ margin: '0 0 0 5px' }}
                                                                size='16px'
                                                                name='pencil'
                                                                title={getTranslation('Editable template')}
                                                            />
                                                        ) : (
                                                            <Icon
                                                                style={{ margin: '0 0 0 5px' }}
                                                                size='16px'
                                                                name='pencil-lock-outline'
                                                                title={getTranslation('Non-editable template')}
                                                            />
                                                        )}
                                                    </Wrapper>
                                                </Wrapper>
                                            </TemplateItem>
                                        </PlainWrapper>
                                    );
                                })
                            ) : (
                                <Wrapper height='150px' flexBox justifyContent='center' alignItems='center'>
                                    <Wrapper>
                                        <Wrapper flexBox justifyContent='center'>
                                            <EmptyImage src='assets/img/empty_draw.svg' />
                                        </Wrapper>
                                        <Wrapper fontSize='13px' margin='15px 0 0 0'>
                                            {getTranslation('No templates found')}
                                        </Wrapper>
                                    </Wrapper>
                                </Wrapper>
                            )}
                        </Scroll>
                    </Wrapper>
                </ClickOutside>
            }
            enterExitTransitionDurationMs={600}
            tipSize={0.01}
            children={<Wrapper key='templateMessageListChildren' />}
        />
    );
};

export default i18n(TemplateMessageList) as FC<TemplateMessageListProps>;
