import { Button, Dropdown, Menu } from 'antd';
import { CSSProperties, FC, MouseEventHandler } from 'react';
import styled from 'styled-components';
import i18n from '../../modules/i18n/components/i18n';
import { I18nProps } from '../../modules/i18n/interface/i18n.interface';

const Div = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
    color: #555;
    background-color: #fff;
    box-shadow: 0px 1px 0px #f0f0f0;
    padding: 16px 24px;
    min-width: 900px;
`;

const Title = styled.span`
    font-size: 18px;
    font-weight: 700;
`;

const ActionsWrapper = styled.div`
    display: flex;
`;


const ButtonSelect = styled(Dropdown.Button)``;

interface ButtonProps {
    visible: boolean;
    onClick?: MouseEventHandler<HTMLElement>;
    loading?: boolean;
    disable?: boolean;
    text?: string;
}

interface ButtonMenuProps extends ButtonProps{
    menu?: JSX.Element;
}

interface HeaderProps {
    title: string | React.ReactNode;
    style?: CSSProperties;
    action?: React.ReactNode;
    buttonDelete?: ButtonProps;
    buttonSave?: ButtonProps;
    buttonBack?: ButtonProps;
    buttonMenu?: ButtonMenuProps;
}

const Header: FC<HeaderProps & I18nProps> = (props) => {
    const { title, action, style, buttonBack, buttonSave, buttonDelete, buttonMenu, getTranslation } = props;

    return (
        <Div style={style}>
            <Title>{title}</Title>
            <ActionsWrapper>
                {action ? (
                    action
                ) : (
                    <>
                        {!!buttonBack && buttonBack.visible ? (
                            <Button
                                className='antd-span-default-color'
                                style={{ marginRight: '10px' }}
                                children={getTranslation(buttonBack.text || 'Back')}
                                onClick={buttonBack.onClick}
                            />
                        ) : null}
                        {!!buttonDelete && buttonDelete.visible ? (
                            <Button
                                danger
                                className='antd-span-default-color'
                                style={{ marginRight: '10px' }}
                                disabled={buttonDelete.disable}
                                children={getTranslation(buttonDelete.text || 'Delete')}
                                onClick={buttonDelete.onClick}
                            />
                        ) : null}
                        {!buttonMenu && !!buttonSave && buttonSave.visible ? (
                            <Button
                                className='antd-span-default-color'
                                type='primary'
                                loading={buttonSave.loading}
                                disabled={buttonSave.disable}
                                children={getTranslation(buttonSave.text || 'Save')}
                                onClick={buttonSave.onClick}
                            />
                        ) : null}
                        {!!buttonMenu ? (
                            <ButtonSelect
                                className='antd-span-default-color'
                                type={'primary'}
                                loading={buttonMenu.loading}
                                disabled={buttonMenu.disable}
                                children={getTranslation(buttonMenu.text || 'Save')}
                                onClick={buttonMenu.onClick}
                                overlay={buttonMenu.menu}
                            />
                        ) : null}
                    </>
                )}
            </ActionsWrapper>
        </Div>
    );
};

export default i18n(Header) as FC<HeaderProps>;
