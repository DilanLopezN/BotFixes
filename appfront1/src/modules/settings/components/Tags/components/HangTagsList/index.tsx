import { FC } from 'react';
import { Wrapper } from '../../../../../../ui-kissbot-v2/common';
import { HangTagsListProps } from './props';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';
import styled from 'styled-components';
import TagItem from '../TagItem';
import SkeletonLines from '../../../../../../shared/skeleton-lines';

const EmptyImage = styled('img')`
    height: 125px;
`;

const HangTagsList: FC<HangTagsListProps & I18nProps> = (props) => {
    const {
        getTranslation,
        loading,
        loadingMore,
        workspaceTags,
        onEditTag,
    } = props;
    return (
        <Wrapper>
            {loading ? (
                <SkeletonLines
                    rows={1}
                    style={{
                        padding: '13px 15px',
                        margin: '0 0 3px 0',
                        height: '50px',
                        borderRadius: '6px',
                    }}
                />
            ) : workspaceTags && workspaceTags.length > 0 ? (
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
                        {getTranslation('Hang tags')}
                    </Wrapper>
                    {workspaceTags
                        .sort((a, b) => {
                            return a.inactive === b.inactive ? 0 : a.inactive ? 1 : -1;
                        })
                        .map((tag, index) => {
                            return (
                                <TagItem
                                    key={tag._id}
                                    tag={tag}
                                    onEditTag={onEditTag}
                                    index={workspaceTags.length - 1 === index ? 1 : 0}
                                />
                            );
                        })}
                    <div id='tag-list-area' />
                    {loadingMore && (
                        <SkeletonLines
                            rows={1}
                            style={{
                                padding: '13px 15px',
                                margin: '0 0 3px 0',
                                height: '50px',
                                borderRadius: '6px',
                            }}
                        />
                    )}
                </div>
            ) : (
                <Wrapper height='150px' flexBox margin='30px 0 0 0' justifyContent='center' alignItems='center'>
                    <Wrapper>
                        <Wrapper flexBox justifyContent='center'>
                            <EmptyImage src='/assets/img/empty_draw.svg' />
                        </Wrapper>
                        <Wrapper fontSize='13px' margin='15px 0 0 0'>
                            {getTranslation('No hang tags found')}
                        </Wrapper>
                    </Wrapper>
                </Wrapper>
            )}
        </Wrapper>
    );
};

export default i18n(HangTagsList) as FC<HangTagsListProps>;
