export type ColorType = 'primary' | 'default';
type TooltipPlacement =
    | 'top'
    | 'left'
    | 'right'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight'
    | 'leftTop'
    | 'leftBottom'
    | 'rightTop'
    | 'rightBottom';

export interface InfoIconProps {
    color: ColorType;
}

export interface LabelWithTooltipProps {
    label: string;
    tooltipText: string;
    color: ColorType;
    placementText?: TooltipPlacement;
}
