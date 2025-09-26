import { Button, Popover } from 'antd';
import React, { FC, ReactElement, useEffect, useState } from 'react';
import { Wrapper } from '../../../../ui-kissbot-v2/common';
import I18n from '../../../i18n/components/i18n';
import { ConfirmPopoverProps } from './props';

const ConfirmPopover: FC<ConfirmPopoverProps> = ({
    children,
    onConfirm,
    text,
    component,
    getTranslation,
    opened,
    placements,
    disabled,
}) => {
    const customComponent = component;
    const [visible, setVisible] = useState<boolean>(opened || false);

    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (visible && target.closest('.ant-popover-inner') === null) {
            setVisible(false);
        }
    };

    useEffect(() => {
        document.addEventListener('contextmenu', handleClickOutside);
        return () => {
            document.removeEventListener('contextmenu', handleClickOutside);
        };
    }, [visible]);

    let cloneChildren;
    if (children) {
        cloneChildren = React.cloneElement(children as ReactElement<any>, {
            key: 'confirmPopoverChildren',
            onClick: () => {
                if (!disabled) setVisible(!visible);
            },
        });
    }

    return (
        <Popover
            placement={placements}
            overlayStyle={{ width: 'auto' }}
            trigger='click'
            open={disabled ? false : visible}
            onOpenChange={(newVisible) => setVisible(newVisible)}
            content={
                <div>
                    {!!component ? (
                        customComponent
                    ) : (
                        <Wrapper>
                            <Wrapper padding='3px 0px 15px 0px'>{text}</Wrapper>
                            <Wrapper flexBox justifyContent='space-evenly' alignItems='center'>
                                <Button
                                    className='antd-span-default-color'
                                    type='default'
                                    style={{ width: '52px' }}
                                    onClick={() => setVisible(false)}
                                >
                                    {getTranslation('No')}
                                </Button>
                                <Button
                                    className=' antd-span-default-color'
                                    type='primary'
                                    style={{ width: '52px' }}
                                    onClick={() => {
                                        onConfirm();
                                        setVisible(false);
                                    }}
                                >
                                    {getTranslation('Yes')}
                                </Button>
                            </Wrapper>
                        </Wrapper>
                    )}
                </div>
            }
        >
            {cloneChildren}
        </Popover>
    );
};

export default I18n(ConfirmPopover);
