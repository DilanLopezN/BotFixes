import React, { FC } from 'react';
import { Wrapper } from '../../../../../../../../../ui-kissbot-v2/common';
import { ButtonFormView } from '../../ButtonFormModalProps';
import { HeaderProps } from './props';
import { Badge } from 'antd';

const Header: FC<HeaderProps> = ({ viewSelected, onViewChanged, values }) => {
    return (
        <Wrapper flexBox justifyContent='center' flexDirection='column'>
            <Wrapper flexBox justifyContent='space-evenly' margin='0 0 5px 0'>
                <Wrapper
                    fontWeight='600'
                    color={viewSelected === ButtonFormView.general ? '#007bff' : '#444'}
                    onClick={() => onViewChanged(ButtonFormView.general)}
                    cursor='pointer'
                    fontSize='16px'
                >
                    Geral
                </Wrapper>
                <Wrapper
                    fontWeight='600'
                    color={viewSelected === ButtonFormView.actions ? '#007bff' : '#444'}
                    onClick={() => onViewChanged(ButtonFormView.actions)}
                    cursor='pointer'
                    fontSize='16px'
                >
                    <Badge
                        count={values?.actions?.length}
                        color='#1890ff'
                        size='small'
                        style={{ right: -5 }}
                        className='white-text'
                    >
                        Ações
                    </Badge>
                </Wrapper>
            </Wrapper>
            <Wrapper margin='0 0 15px 0' width='100%' borderBottom='1px #e8e8e8 solid' />
        </Wrapper>
    );
};

export default Header;
