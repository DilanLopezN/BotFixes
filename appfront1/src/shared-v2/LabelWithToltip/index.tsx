import { Tooltip } from 'antd';
import React from 'react';
import { LabelWithTooltipProps } from './interfaces';
import { HelpIcon } from './styles';

const LabelWithTooltip: React.FC<LabelWithTooltipProps> = ({ label, tooltipText, color, placementText }) => {
    const placement = placementText || 'bottom';

    return (
        <>
            {label}
            <Tooltip trigger='hover' placement={placement} title={tooltipText}>
                <HelpIcon color={color} />
            </Tooltip>
        </>
    );
};

export { LabelWithTooltip };
