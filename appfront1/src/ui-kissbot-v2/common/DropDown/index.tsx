import { useState, FC } from 'react';
import styled from 'styled-components';
import ClickOutside from 'react-click-outside';
import { DropDownProps } from './props';
import { PrimaryButton } from '..';
import './styles.scss';

import { Icon, Wrapper } from '../';

const ButtonGroup = styled.div<{ margin?: string; width?: string }>`
    display: flex;

    ${(props) =>
        !!props.margin &&
        `
    margin: ${props.margin};
  `}

    ${(props) =>
        !!props.width &&
        `
    width: ${props.width};
  `}
`;

const WrapperItens = styled.div<{ small?: boolean; right?: boolean; open?: boolean }>`
    padding-top: 8px;
    position: absolute;
    top: ${(props) => (!!props.small ? '17px' : '34px')};
    ${(props) => (!props.right ? 'right: 0px;' : 'left: 0px;')}
    -webkit-box-shadow: 9px 10px 5px -10px rgba(0,0,0,0.4);
    -moz-box-shadow: 9px 10px 5px -10px rgba(0, 0, 0, 0.4);
    box-shadow: 9px 10px 5px -10px rgba(0, 0, 0, 0.4);
    z-index: 5;

    ${(props) =>
        !props.open &&
        `
    display: none;
  `}
`;

const Item = styled.div`
    min-width: fit-content;
    white-space: nowrap;
    background-color: #fff;
    color: #444;
    font-size: 16px;
    padding: 8px 16px;
    text-align: left;
    margin-top: -3px;
    border: 1px solid #e9ebeb;
    cursor: pointer;

    label {
        color: #000;
        display: block;
        margin-bottom: 0;
        cursor: pointer;
    }

    :hover {
        background-color: #f3f3f4;
    }
`;

const DropDown: FC<DropDownProps> = ({
    children,
    width,
    margin,
    height,
    right,
    iconName,
    iconSmall,
    colorType,
    onClick,
    itens,
    title,
    handleClick,
    selected,
}) => {
    const [open, setOpen] = useState<boolean>(false);

    return !iconName ? (
        <ButtonGroup width={width} margin={margin} title={title}>
            <PrimaryButton colorType={colorType} className='labelButton' onClick={onClick} height={height}>
                {children}
            </PrimaryButton>
            <PrimaryButton
                icon='menu-down'
                padding='0 5px 0 0'
                height={height}
                colorType={colorType}
                className='optionsButton'
                active={open}
                onClick={() => setOpen(false)}
            >
                <ClickOutside onClickOutside={() => setOpen(false)}>
                    <WrapperItens open={open} right={right}>
                        {itens.map((item, index) => (
                            <Item
                                onClick={() => {
                                    setOpen(false);
                                    item.onClick && handleClick
                                        ? handleClick(item.onClick)
                                        : item.onClick && item.onClick();
                                }}
                                key={`dropDownItemKey${index}`}
                            >
                                {item.icon ? <Icon name={item.icon} size='24px' /> : <span>{item.label}</span>}
                            </Item>
                        ))}
                    </WrapperItens>
                </ClickOutside>
            </PrimaryButton>
        </ButtonGroup>
    ) : (
        <Wrapper flexBox alignItems='center' margin={margin} width={width} title={title}>
            <Wrapper
                width={iconSmall ? '18px' : '35px'}
                height={iconSmall ? '18px' : undefined}
                borderRadius='50%'
                padding='0 0 0 5px'
                position='relative'
                bgcolor={open ? '#e9ebeb' : '#FF000000'}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(!open);
                }}
                cursor='pointer'
            >
                <Icon
                    name={iconName}
                    size={iconSmall ? '12px' : undefined}
                    margin={iconSmall ? '0 0 0 -3px' : undefined}
                />
                <ClickOutside onClickOutside={() => setOpen(false)}>
                    <WrapperItens open={open} small={iconSmall} right={right}>
                        {itens.map((item, index) => (
                            <Item
                                style={{
                                    background: `${selected && selected === item.label ? '#f3f3f4' : '#fff'}`,
                                }}
                                onClick={(e) => {
                                    setOpen(false);
                                    e.stopPropagation();
                                    item.onClick && handleClick
                                        ? handleClick(item.onClick)
                                        : item.onClick && item.onClick();
                                }}
                                key={`dropDownItemKey${index}`}
                            >
                                {item.icon ? <Icon name={item.icon} size='24px' /> : <span>{item.label}</span>}
                            </Item>
                        ))}
                    </WrapperItens>
                </ClickOutside>
            </Wrapper>
        </Wrapper>
    );
};

export default DropDown;
