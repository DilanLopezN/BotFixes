import { Popover } from 'antd';
import { TooltipPlacement } from 'antd/lib/tooltip';
import { CSSProperties, FC, useState } from 'react';
import { timeout } from '../../utils/Timer';

export interface CopyProps {
    style: CSSProperties;
    onClick: () => void;
    title: string;
    id: string;
    duration: number;
    placement: TooltipPlacement;
    className?: string;
    size?: string;
}

const Copy: FC<CopyProps> = (props) => {
    const [visible, setVisible] = useState(false);

    const hide = () => {
        setVisible(true);

        timeout(() => {
            setVisible(false);
        }, props.duration);
    };

    return (
        <Popover open={visible} placement={props.placement}>
            <span
                style={props.style}
                id={props.id}
                title={props.title}
                className={props.className || 'mdi mdi-content-copy'}
                onClick={() => {
                    hide();
                    props.onClick();
                }}
            />
        </Popover>
    );
};

export default Copy;
