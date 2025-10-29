export interface AttrNodeProps{
    /**
     * nodeChildren do editor
     */
    nodeChildren: any;
    onChange: (value: string, data: any) => any;
    /**
     * Valores possíveis : CREATE, SELECT
     */
    type: string;
    data: any;
}

export interface AttrNodeState{
    isOpenedPopover: boolean;
}