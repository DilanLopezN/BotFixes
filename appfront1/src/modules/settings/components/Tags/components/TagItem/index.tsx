import { FC } from 'react'
import { Wrapper } from '../../../../../../ui-kissbot-v2/common'
import { TagItemProps } from './props';
import styled from 'styled-components';
import i18n from '../../../../../i18n/components/i18n';
import { I18nProps } from '../../../../../i18n/interface/i18n.interface';

const Item = styled(Wrapper)`
    height: 45px;
    width: 1100px;
    min-width: 320px;
    transition: background-color .2s;
    cursor: pointer;

    &:hover {
    background-color: #F2F4F8;
  }
`;

const TagItem: FC<TagItemProps & I18nProps> = (props) => {
    const {
        tag,
        onEditTag,
        index
    } = props;

    return (
        <>
            <Wrapper
                borderBottom='1px #CED4DA solid'
                borderRadius={`${index === 1 ? '0 0 5px 5px' : '0'}`}
                width='100%'>
                <Item
                    id={tag._id}
                    bgcolor={'#fff'}
                    opacity={tag.inactive ? '0.6' : '1'}
                    width='auto !important'
                    padding='13px 15px'
                    borderLeft={`8px solid ${tag.color}`}
                    onClick={() => onEditTag(tag._id)}
                >
                    <div 
                        style={{display: 'flex', justifyContent: 'space-between'}}
                        onAuxClick={() => window.open(`${window.location.origin}/settings/tags/${tag._id}`)}
                    >
                        <Wrapper
                            fontSize='15px'
                            color='#444'
                            truncate
                            fontWeight='600'>
                            {tag.name}
                        </Wrapper>
                    </div>
                </Item>
            </Wrapper>
        </>
    )
}

export default i18n(TagItem) as FC<TagItemProps>;
