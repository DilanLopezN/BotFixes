import { FC, useState } from 'react'
import { InputPasswordProps } from './InputPasswordProps';
import styled from 'styled-components';
import { BsEyeSlash } from 'react-icons/bs';
import { IoEyeOutline } from 'react-icons/io5';

const InputPasswordComponent = styled.input`
    background: var(--color8);    
    border: 1px solid #d9d9d9 !important;    
    color: var(--color7);
    padding: 9px 24px 9px 19px !important;
    font-size: 15px !important;
    font-weight: 400 !important;
    line-height: 22px !important;
    min-height: 42px;
    border-radius: 3px !important;
    outline: none;
    width: 100%;
    ::placeholder {
      color: var(--color5);
    }
`;

const InVisible = styled(BsEyeSlash)`
    font-size: 20px;
    color: #969696;
    cursor: pointer;
    position: absolute;
    bottom: 13px;
    right: 10px;
    :hover {
        color: #555;
    }
`;

const Visible = styled(IoEyeOutline)`
    font-size: 20px;
    color: #969696;
    cursor: pointer;
    position: absolute;
    bottom: 13px;
    right: 10px;
    :hover {
        color: #555;
    }
`;

const Content = styled.div`
    height: 44px;
    position: relative;
`;

const InputPassword: FC<InputPasswordProps & any> = ({
    onChange,
    name,
    placeholder,
    autofocus,
    value,
    ...rest
}) => {
    const [visible, setVisible] = useState(false);

    return <Content>
        <InputPasswordComponent
            {...rest}
            value={value}
            type={`${visible ? 'text' : 'password'}`}
            autoFocus={autofocus || false}
            placeholder={placeholder || ''}
            name={name}
            onChange={(ev) => onChange(ev)}
        />
        {
            visible
                ? <InVisible onClick={() => setVisible(false)} />
                : <Visible onClick={() => setVisible(true)} />
        }
    </Content>
}

export default InputPassword;
