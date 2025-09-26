import React, { FC } from 'react'
import { Wrapper } from '../../../../ui-kissbot-v2/common'
import { MenuSelectionProps } from './props';

export interface OptionModalMenu {
    ref: string;
    component: any;
    label: string;
}

const MenuSelection: FC<MenuSelectionProps> = (props) => {

    const {
        onSelect,
        options,
        selected,
    } = props;

    return (
        <Wrapper
            flexBox
            height='39px'
            padding='0 20px'
            bgcolor='#f2f4f8'
            justifyContent='flex-start'
            alignItems='center'>
            {options.map(option => <Wrapper
                key={option.ref}
                id={`tab-${option.ref}`}
                padding='0 5px'
                margin='0 7px'
                flexBox
                height='39px'
                alignItems='center'
                cursor='pointer'
                borderTop={`2px ${option.ref === selected.ref ? '#007bff' : 'transparent'} solid`}
                onClick={() => onSelect(option)}>
                {option.label}
            </Wrapper>)}
        </Wrapper>
    )
}

export default MenuSelection as FC<MenuSelectionProps>
