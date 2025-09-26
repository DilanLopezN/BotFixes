import React, { FC, useState, useMemo } from 'react';
import { TagsProps } from './props';
import { Tag } from '../../props';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import TagItem from '../TagItem';
import styled from 'styled-components';
import { LiveAgentService } from '../../../../service/LiveAgent.service';
import I18n from '../../../../../i18n/components/i18n';
import orderBy from 'lodash/orderBy';
import { v4 } from 'uuid';
import { Input } from 'antd';

const Wrapped = styled(Wrapper)`
    &::-webkit-scrollbar {
        width: 4px;
    }

    &::-webkit-scrollbar-track {
        background: #e8e8e8;
        border-radius: 10px;
    }

    &::-webkit-scrollbar-thumb {
        background: #989898;
        border-radius: 10px;
    }
`;

const Tags: FC<TagsProps> = ({
    conversation,
    workspaceId,
    onTagsChanged,
    workspaceTags,
    getTranslation,
    newListTags,
}) => {
    const [tags, setTags] = useState<any[]>([]);
    const [searchTags, setSearchTags] = useState('');

    const filteredTags = tags.filter((tag) => tag.name.toLowerCase().includes(searchTags.toLocaleLowerCase()));

    const validateTagsConversation = () => {
        if (conversation.tags?.length === 0) return setTags(orderBy([...workspaceTags], 'name'));

        const possibleTags = workspaceTags.filter(
            (defaultTag) => !conversation.tags.map((tag) => tag.name).includes(defaultTag?.name)
        );
        setTags(orderBy([...conversation.tags, ...possibleTags], 'name'));
    };

    useMemo(() => {
        validateTagsConversation();
    }, [conversation.tags]);

    const saveTagOnConversation = async (tag: Tag) => {
        return await LiveAgentService.createTag(workspaceId, conversation._id, tag);
    };

    const removeTagOnConversation = (tag: Tag, saved?) => {
        LiveAgentService.removeTag(workspaceId, conversation._id, tag).then(() => saved && saved());
    };

    const onSelect = (selected: Tag) => {
        const deleteTag = !!conversation.tags?.find((currTag) => currTag.name === selected.name);

        if (!deleteTag) {
            saveTagOnConversation(selected);
        } else removeTagOnConversation(selected);

        onTagsChanged(selected, deleteTag);
    };

    const checkSelected = (tag: Tag) => {
        return conversation.tags.map((tag) => tag.name).includes(tag.name);
    };

    return (
        <Wrapper
            padding='10px'
            borderRadius='5px'
            width='250px'
            boxShadow='0 8px 16px -4px rgba(9,30,66,.25), 0 0 0 1px rgba(9,30,66,.08)'
            bgcolor='#FFF'
        >
            <Wrapper flexBox justifyContent='center' borderBottom='1px #eaeaea solid' padding='1px 0 7px 0'>
                {getTranslation('Tags')}
            </Wrapper>
            <Input
                placeholder={`${getTranslation('Search')}...`}
                allowClear
                autoFocus
                type={'text'}
                value={searchTags}
                onChange={(e) => {
                    setSearchTags(e.target.value);
                }}
                style={{ width: 220 }}
            />
            <Wrapped maxHeight='380px' minHeight='80px' overflowY='auto' overflowX='hidden' margin='10px 0'>
                {filteredTags.length === 0 && (
                    <>
                        <br />
                        <p>{getTranslation('No results found')}</p>
                    </>
                )}
                {newListTags(filteredTags).map((tag) => (
                    <TagItem
                        tag={tag}
                        selected={checkSelected(tag)}
                        onSelect={() => {
                            onSelect(tag);
                        }}
                        key={tag._id || v4()}
                    />
                ))}
            </Wrapped>
        </Wrapper>
    );
};

export default I18n(Tags);
