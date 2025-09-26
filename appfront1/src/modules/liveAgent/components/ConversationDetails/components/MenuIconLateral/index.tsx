import React, { FC } from "react";
import { Wrapper } from "../../../../../../ui-kissbot-v2/common";
import { MenuIconLateralProps } from "./props";

const Icon = ({ option, onClick, selected, ...rest }) => {
    return <Wrapper
        flex
        justifyContent='center'
        textAlign='center'
        onClick={onClick}
        {...rest}
        alignItems='center'>
        <span
            title={option.label}
            style={{
                cursor: 'pointer',
                color: selected.value === option.value
                    ? '#007bff'
                    : ''
            }}
            className={`mdi mdi-24px mdi-${option.icon}`} />
    </Wrapper>
}

const MenuIconLateral: FC<MenuIconLateralProps> = ({
    onSelectMenu,
    options,
    selected,
}) => {
    return <Wrapper
        width="100%"
        height="65px"
        minHeight='65px'
        bgcolor='#FFF'
        alignItems='center'
        borderBottom='1px #eaeaea solid'
        padding='5px'
        flexBox>
        {options.map((option, i) => {
            return <Icon
                title={option.label}
                option={option}
                key={i}
                selected={selected}
                onClick={() => onSelectMenu(option)} />
        })}
    </Wrapper>
}

export default MenuIconLateral;